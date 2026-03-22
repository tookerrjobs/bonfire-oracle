import { runFullPipeline } from '../analysis/pipeline';
import { runDemoPipeline } from '../analysis/demo';
import { executeTrade, claimFees, launchToken, getBalances } from '../bankr/agent-api';
import { economics } from '../economics/tracker';
import { bonfires } from '../bonfires/client';
import type { CommitteeDecision } from '../analysis/types';
import type { AgentState, AgentConfig, OnchainActivity } from './types';
import { DEFAULT_AGENT_CONFIG } from './types';

function isDemoMode(): boolean {
  return !process.env.BANKR_API_KEY || process.env.BANKR_API_KEY === 'bk_your_api_key_here';
}

let activityCounter = 0;
function logActivity(
  log: OnchainActivity[],
  type: OnchainActivity['type'],
  description: string,
  result: string,
  costUsd?: number,
  revenueUsd?: number
): OnchainActivity {
  const entry: OnchainActivity = {
    id: `act_${++activityCounter}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    description,
    result,
    costUsd,
    revenueUsd,
  };
  log.unshift(entry);
  if (log.length > 100) log.length = 100;
  return entry;
}

type Listener = (state: AgentState) => void;

class AgentOrchestrator {
  private config: AgentConfig = { ...DEFAULT_AGENT_CONFIG };
  private state: AgentState = {
    status: 'idle',
    currentCycle: 0,
    lastCycleAt: null,
    nextCycleAt: null,
    decisions: [],
    economics: economics.getSnapshot(),
    error: null,
    startedAt: null,
    tokenLaunched: false,
    tokenName: null,
    tokenSymbol: null,
    wallet: {
      balanceRaw: 'unknown',
      lastCheckedAt: null,
      totalFeesClaimed: 0,
      totalTradeVolume: 0,
      inferenceSpend: 0,
    },
    activityLog: [],
    bonfiresReputation: { accuracy: 0, totalPredictions: 0, communityTrust: 0.5 },
  };
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.state.economics = economics.getSnapshot();
    this.state.wallet.inferenceSpend = this.state.economics.totalInferenceCost;
    for (const listener of this.listeners) {
      try {
        listener({
          ...this.state,
          decisions: [...this.state.decisions],
          activityLog: [...this.state.activityLog],
          wallet: { ...this.state.wallet },
        });
      } catch {}
    }
  }

  getState(): AgentState {
    this.state.economics = economics.getSnapshot();
    this.state.wallet.inferenceSpend = this.state.economics.totalInferenceCost;
    return {
      ...this.state,
      decisions: [...this.state.decisions],
      activityLog: [...this.state.activityLog],
      wallet: { ...this.state.wallet },
    };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<AgentConfig>) {
    this.config = { ...this.config, ...partial };
  }

  async start(config?: Partial<AgentConfig>) {
    if (this.state.status === 'running') return;
    if (config) this.updateConfig(config);

    this.state.status = 'running';
    this.state.startedAt = new Date().toISOString();
    this.state.error = null;
    this.notify();

    await this.runCycle();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.state.status = 'idle';
    this.state.nextCycleAt = null;
    this.notify();
  }

  async runSingleCycle() {
    await this.runCycle(true);
  }

  // ── Self-funding loop: check wallet, claim fees, assess runway ──
  private async selfFundingCheck() {
    if (isDemoMode()) return;

    // 1. Check wallet balance
    try {
      const balanceResult = await getBalances();
      this.state.wallet.balanceRaw = balanceResult;
      this.state.wallet.lastCheckedAt = new Date().toISOString();
      logActivity(
        this.state.activityLog,
        'balance_check',
        'Checked Bankr wallet balance',
        balanceResult.slice(0, 200)
      );
    } catch (err) {
      console.warn('[SelfFund] Balance check failed:', err);
    }

    // 2. Auto-claim token fees if we've launched a token
    if (this.state.tokenLaunched && this.config.autoClaimFees) {
      try {
        const feesResult = await claimFees();
        const feeMatch = feesResult.match(/\$?([\d.]+)/);
        const feeAmount = feeMatch ? parseFloat(feeMatch[1]) || 0 : 0;
        this.state.wallet.totalFeesClaimed += feeAmount;
        economics.recordRevenue({
          timestamp: new Date().toISOString(),
          source: 'fee_claim',
          amount: feeAmount,
          token: this.state.tokenSymbol || 'ORACLE',
          details: feesResult.slice(0, 100),
        });
        logActivity(
          this.state.activityLog,
          'fee_claim',
          `Claimed $${this.state.tokenSymbol || 'ORACLE'} trading fees → funding inference`,
          feesResult.slice(0, 200),
          undefined,
          feeAmount
        );
        console.log(`[SelfFund] Fees claimed: $${feeAmount.toFixed(4)} → inference funding`);
      } catch (err) {
        console.warn('[SelfFund] Fee claim failed:', err);
      }
    }

    // 3. Auto-launch token if not yet launched (after cycle 2 for data)
    if (
      !this.state.tokenLaunched &&
      this.config.autoLaunchToken &&
      this.state.currentCycle >= 2
    ) {
      try {
        console.log('[SelfFund] Auto-launching agent token for fee revenue...');
        await this.launchAgentToken('BonfireOracle', 'ORACLE');
        logActivity(
          this.state.activityLog,
          'token_launch',
          'Auto-launched $ORACLE token on Base for fee revenue',
          `Token launched — fees will fund future inference cycles`,
          undefined,
          0
        );
      } catch (err) {
        console.warn('[SelfFund] Auto token launch failed:', err);
      }
    }

    this.notify();
  }

  private async runCycle(once: boolean = false) {
    if (this.state.status !== 'running' && !once) return;

    this.state.currentCycle++;
    this.state.lastCycleAt = new Date().toISOString();
    this.notify();

    // ── BONFIRES REPUTATION: track agent standing in community ──
    try {
      this.state.bonfiresReputation = await bonfires.getAgentReputation();
    } catch {
      // Keep previous reputation on failure
    }

    try {
      let decisions: CommitteeDecision[];

      if (isDemoMode()) {
        decisions = await runDemoPipeline();
      } else {
        // ── SELF-FUNDING CHECK: balance, fees, auto-launch ──
        await this.selfFundingCheck();

        // ── ANALYSIS PIPELINE: 3-model committee ──
        logActivity(
          this.state.activityLog,
          'inference',
          `Cycle ${this.state.currentCycle}: Running 3-model analysis (Gemini → GPT → Claude)`,
          'Pipeline started...'
        );

        decisions = await runFullPipeline(
          this.config.topics,
          this.config.maxPositionSizeUsd,
          this.config.minConsensusScore
        );

        // Record costs for each decision
        let cycleTotalCost = 0;
        for (const decision of decisions) {
          const modelCalls = [];

          if (decision.scanResult) {
            modelCalls.push({
              model: decision.scanResult.modelUsed,
              role: 'scanner',
              inputTokens: decision.scanResult.inputTokens,
              outputTokens: decision.scanResult.outputTokens,
              cost: decision.scanResult.cost,
            });
          }
          if (decision.quantAnalysis) {
            modelCalls.push({
              model: decision.quantAnalysis.modelUsed,
              role: 'quantitative',
              inputTokens: decision.quantAnalysis.inputTokens,
              outputTokens: decision.quantAnalysis.outputTokens,
              cost: decision.quantAnalysis.cost,
            });
          }
          if (decision.thesis) {
            modelCalls.push({
              model: decision.thesis.modelUsed,
              role: 'synthesizer',
              inputTokens: decision.thesis.inputTokens,
              outputTokens: decision.thesis.outputTokens,
              cost: decision.thesis.cost,
            });
          }

          economics.recordDecisionCosts(decision.id, modelCalls);
          cycleTotalCost += decision.totalInferenceCost;

          // ── BONFIRES CONSENSUS GATE: validate trade against community ──
          if (decision.finalAction !== 'skip' && decision.finalAction !== 'hold') {
            try {
              const consensus = await bonfires.getCommunityConsensus(decision.token);
              decision.communityConsensus = consensus;

              // If community strongly disagrees (>30% confidence, opposite sentiment), downgrade to hold
              const isBuy = decision.finalAction === 'buy';
              const communityDisagrees = consensus.confidence > 0.3 && (
                (isBuy && consensus.sentiment < 0.35) ||
                (!isBuy && consensus.sentiment > 0.65)
              );

              if (communityDisagrees) {
                logActivity(
                  this.state.activityLog,
                  'bonfires',
                  `Community disagrees with ${decision.finalAction} ${decision.token} — sentiment: ${(consensus.sentiment * 100).toFixed(0)}%, confidence: ${(consensus.confidence * 100).toFixed(0)}%`,
                  'Trade downgraded to HOLD based on Bonfires community consensus'
                );
                decision.finalAction = 'hold';
                decision.status = 'community_override';
              } else {
                logActivity(
                  this.state.activityLog,
                  'bonfires',
                  `Community supports ${decision.finalAction} ${decision.token} — sentiment: ${(consensus.sentiment * 100).toFixed(0)}%`,
                  `${consensus.sampleSize} community data points analyzed`
                );
              }
            } catch (err) {
              console.warn('[Bonfires] Consensus gate failed, proceeding with trade:', err);
            }
          }

          // ── EXECUTION: real trades via Bankr Agent API ──
          if (
            this.config.enableExecution &&
            decision.finalAction !== 'skip' &&
            decision.finalAction !== 'hold' &&
            decision.thesis &&
            decision.thesis.positionSizeUsd > 0
          ) {
            try {
              decision.status = 'executing';
              this.notify();

              const result = await executeTrade(
                decision.finalAction,
                decision.thesis.positionSizeUsd,
                decision.token
              );

              decision.executionResult = result;
              decision.status = 'completed';
              economics.recordExecution();
              this.state.wallet.totalTradeVolume += decision.thesis.positionSizeUsd;

              const sellRevenueMatch = decision.finalAction === 'sell' ? result.match(/\$?([\d.]+)/) : null;
              const sellRevenue = sellRevenueMatch
                ? parseFloat(sellRevenueMatch[1]) || decision.thesis.positionSizeUsd * 0.01
                : decision.thesis.positionSizeUsd * 0.01;

              logActivity(
                this.state.activityLog,
                'trade',
                `${decision.finalAction.toUpperCase()} $${decision.thesis.positionSizeUsd.toFixed(2)} of ${decision.token} on Base`,
                result.slice(0, 200),
                decision.finalAction === 'buy' ? decision.thesis.positionSizeUsd : undefined,
                decision.finalAction === 'sell' ? sellRevenue : undefined
              );

              if (decision.finalAction === 'sell') {
                const revenue = sellRevenue;
                economics.recordRevenue({
                  timestamp: new Date().toISOString(),
                  source: 'trade_pnl',
                  amount: revenue,
                  token: decision.token,
                  details: `Sell execution: ${result.slice(0, 100)}`,
                });
              }
            } catch (err) {
              decision.executionResult = `Execution error: ${err}`;
              decision.status = 'failed';
              logActivity(
                this.state.activityLog,
                'trade',
                `FAILED: ${decision.finalAction} ${decision.token}`,
                String(err).slice(0, 200)
              );
            }
          } else {
            decision.status = decision.status === 'analyzing' ? 'decided' : decision.status;
          }

          // ── PUBLISH BACK TO BONFIRES: agent becomes community participant ──
          await bonfires.publishDecision({
            token: decision.token,
            action: decision.finalAction,
            confidence: decision.consensusScore,
            reasoning: decision.thesis?.narrative || decision.scanResult?.signals?.[0]?.reason || '',
            result: decision.executionResult,
          });
        }

        // Update inference activity with actual cost
        logActivity(
          this.state.activityLog,
          'inference',
          `Cycle ${this.state.currentCycle} complete: ${decisions.length} decisions, $${cycleTotalCost.toFixed(6)} inference cost`,
          `Models used: gemini-2.5-flash → gpt-5-mini → claude-sonnet-4.6`,
          cycleTotalCost
        );

        economics.recordCycle();
      }

      this.state.decisions = [...decisions, ...this.state.decisions].slice(0, 50);
      this.state.error = null;
    } catch (err) {
      this.state.error = `Cycle error: ${err}`;
      console.error('Agent cycle error:', err);
    }

    this.notify();

    // Schedule next cycle if running continuously
    if (!once && this.state.status === 'running') {
      const nextTime = new Date(Date.now() + this.config.cycleIntervalMs);
      this.state.nextCycleAt = nextTime.toISOString();
      this.notify();
      this.timer = setTimeout(() => this.runCycle(), this.config.cycleIntervalMs);
    }
  }

  async launchAgentToken(name: string, symbol: string): Promise<string> {
    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 1500));
      this.state.tokenLaunched = true;
      this.state.tokenName = name;
      this.state.tokenSymbol = symbol;
      logActivity(
        this.state.activityLog,
        'token_launch',
        `[DEMO] Launched $${symbol} token on Base`,
        'Simulated token launch — add BANKR_API_KEY for real onchain execution',
      );
      this.notify();
      return `[DEMO] Token ${name} ($${symbol}) launched on Base. Uniswap V4 pool created. Trading fees active.`;
    }

    try {
      const result = await launchToken(name, symbol);
      this.state.tokenLaunched = true;
      this.state.tokenName = name;
      this.state.tokenSymbol = symbol;
      logActivity(
        this.state.activityLog,
        'token_launch',
        `Launched $${symbol} token on Base via Bankr Agent API`,
        result.slice(0, 200)
      );
      this.notify();
      return result;
    } catch (err) {
      throw new Error(`Token launch failed: ${err}`);
    }
  }

  isDemoMode(): boolean {
    return isDemoMode();
  }
}

export const agent = new AgentOrchestrator();
