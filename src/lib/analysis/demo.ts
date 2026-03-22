import type { ScanResult, QuantAnalysis, Thesis, CommitteeDecision } from './types';
import type { BonfiresInsight, CommunitySignal } from '../bonfires/types';
import { economics } from '../economics/tracker';

let demoCounter = 0;

const DEMO_TOKENS = ['ETH', 'BNKR', 'DEGEN', 'AERO', 'HIGHER', 'BRETT', 'TOSHI'];

const DEMO_NARRATIVES = [
  'Strong community momentum detected across multiple DAOs. Governance proposals aligning with broader market sentiment suggest institutional accumulation phase.',
  'Rising developer activity and protocol revenue indicate sustainable growth. Community knowledge graph shows increasing positive discussion density.',
  'Token launch fee revenue exceeding projections. Community sentiment strongly bullish with governance decisions supporting ecosystem expansion.',
  'Cross-community correlation detected between DeFi governance and token price action. Multiple knowledge nodes confirm institutional interest.',
  'Bonfires community intel reveals early-stage narrative forming around this asset. Social graph analysis shows key influencer accumulation.',
];

const DEMO_SCAN_REASONS = [
  'Community discussion volume up 340% in 72h with bullish governance proposals',
  'On-chain metrics show smart money accumulation, Bonfires knowledge graph confirms',
  'DAO treasury diversification into this asset detected across 3+ communities',
  'Developer grant program announced, community sentiment overwhelmingly positive',
  'Cross-chain bridge activity spiking, multiple community Bonfires flagging as opportunity',
  'Protocol revenue trending up, community governance voting to expand liquidity incentives',
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function generateDemoBonfiresInsight(): BonfiresInsight {
  const signals: CommunitySignal[] = DEMO_TOKENS.slice(0, 3).map((token) => ({
    communityId: `demo_${token.toLowerCase()}`,
    communityName: `${token} DAO`,
    topic: token,
    sentiment: randomFloat(0.4, 0.95),
    mentionCount: Math.floor(randomFloat(10, 200)),
    keyParticipants: ['alice.eth', 'bob.dao', 'defi_whale.eth', 'crypto_sara'].slice(
      0,
      Math.floor(randomFloat(2, 4))
    ),
    recentDecisions: [
      `Treasury allocation to ${token} staking approved`,
      `Community vote: expand ${token} liquidity incentives`,
    ],
    trendDirection: Math.random() > 0.3 ? 'rising' : 'stable',
    relevantNodes: [],
    extractedAt: new Date().toISOString(),
  }));

  return {
    signals,
    topTopics: signals.map((s) => ({
      topic: s.topic,
      mentions: s.mentionCount,
      sentiment: s.sentiment,
    })),
    governanceActions: signals.flatMap((s) =>
      s.recentDecisions.map((d) => ({
        dao: s.communityName,
        action: d,
        impact: s.sentiment > 0.6 ? 'bullish' : 'neutral',
      }))
    ),
    alphaOpportunities: signals
      .filter((s) => s.trendDirection === 'rising' && s.sentiment > 0.6)
      .map((s) => ({
        token: s.topic,
        reason: `Rising community discussion (${s.mentionCount} mentions) with ${Math.round(s.sentiment * 100)}% positive sentiment`,
        communitySource: s.communityName,
        confidence: Math.min(s.sentiment * (s.mentionCount / 50), 1),
      })),
    queryCost: 0.003,
    queryTimeMs: Math.floor(randomFloat(200, 800)),
  };
}

export async function runDemoPipeline(): Promise<CommitteeDecision[]> {
  const decisions: CommitteeDecision[] = [];
  const insight = generateDemoBonfiresInsight();

  // Simulate Bonfires query time
  await sleep(randomFloat(300, 600));

  // Pick 2-3 tokens to analyze
  const tokensToAnalyze = DEMO_TOKENS.sort(() => Math.random() - 0.5).slice(0, Math.floor(randomFloat(2, 4)));

  for (const token of tokensToAnalyze) {
    const decisionId = `demo_${++demoCounter}_${Date.now()}`;

    // Step 1: Scanner (Gemini Flash) — fast, cheap
    await sleep(randomFloat(400, 900));
    const scannerCost = randomFloat(0.0001, 0.0005);
    const scanSignalStrength = randomFloat(0.4, 0.95);
    const scanSignal = scanSignalStrength > 0.6 ? 'bullish' : scanSignalStrength > 0.45 ? 'neutral' : 'bearish';

    const scanResult: ScanResult = {
      topics: [token, 'DeFi', 'Base ecosystem'],
      signals: [
        {
          token,
          signal: scanSignal as 'bullish' | 'bearish' | 'neutral',
          strength: scanSignalStrength,
          reason: randomChoice(DEMO_SCAN_REASONS),
        },
      ],
      modelUsed: 'gemini-2.5-flash',
      inputTokens: Math.floor(randomFloat(200, 500)),
      outputTokens: Math.floor(randomFloat(100, 300)),
      cost: scannerCost,
      latencyMs: Math.floor(randomFloat(400, 900)),
      timestamp: new Date().toISOString(),
    };

    // Record scanner cost
    economics.recordDecisionCosts(decisionId, [
      { model: 'gemini-2.5-flash', role: 'scanner', inputTokens: Math.floor(randomFloat(200, 500)), outputTokens: Math.floor(randomFloat(100, 300)), cost: scannerCost },
    ]);

    let quantAnalysis: QuantAnalysis | null = null;
    let thesis: Thesis | null = null;
    let finalAction: 'buy' | 'sell' | 'hold' | 'skip' = 'skip';
    let consensusScore = scanSignalStrength / 3;
    let totalCost = scannerCost;

    // Step 2: Quant analysis (GPT) — only if signal is strong enough
    if (scanSignalStrength >= 0.5) {
      await sleep(randomFloat(600, 1200));
      const quantCost = randomFloat(0.0003, 0.001);
      const quantConf = randomFloat(0.35, 0.9);

      quantAnalysis = {
        token,
        pattern: randomChoice([
          'Ascending triangle with volume confirmation',
          'Bull flag forming after breakout',
          'Accumulation phase — Wyckoff Phase C',
          'MACD crossover with RSI divergence',
          'Volume profile showing strong support zone',
        ]),
        historicalCorrelation: randomFloat(0.4, 0.85),
        riskScore: randomFloat(0.2, 0.7),
        expectedReturn: randomFloat(-0.05, 0.15),
        confidence: quantConf,
        reasoning: `Quantitative indicators suggest ${quantConf > 0.6 ? 'favorable' : 'mixed'} risk/reward. Volume analysis confirms ${scanSignal} signal from scanner.`,
        modelUsed: 'gpt-5-mini',
        inputTokens: Math.floor(randomFloat(300, 600)),
        outputTokens: Math.floor(randomFloat(150, 400)),
        cost: quantCost,
        latencyMs: Math.floor(randomFloat(600, 1200)),
      };

      economics.recordDecisionCosts(decisionId, [
        { model: 'gpt-5-mini', role: 'quantitative', inputTokens: Math.floor(randomFloat(300, 600)), outputTokens: Math.floor(randomFloat(150, 400)), cost: quantCost },
      ]);

      totalCost += quantCost;
      consensusScore = (scanSignalStrength + quantConf) / 3;

      // Step 3: Synthesis (Claude) — only if quant confidence is good
      if (quantConf >= 0.4) {
        await sleep(randomFloat(800, 1500));
        const thesisCost = randomFloat(0.001, 0.004);
        const thesisConviction = randomFloat(0.3, 0.95);
        const action: 'buy' | 'sell' | 'hold' | 'skip' =
          thesisConviction > 0.7 && scanSignal === 'bullish'
            ? 'buy'
            : thesisConviction > 0.6 && scanSignal === 'bearish'
              ? 'sell'
              : thesisConviction > 0.5
                ? 'hold'
                : 'skip';

        const qa = quantAnalysis!;
        thesis = {
          token,
          action,
          conviction: thesisConviction,
          riskAssessment: `Risk score ${qa.riskScore.toFixed(2)} — ${qa.riskScore < 0.4 ? 'Low' : qa.riskScore < 0.6 ? 'Moderate' : 'Elevated'} risk profile with ${quantConf > 0.6 ? 'strong' : 'moderate'} quantitative backing.`,
          narrative: randomChoice(DEMO_NARRATIVES),
          entryReason: `${scanSignal.charAt(0).toUpperCase() + scanSignal.slice(1)} scanner signal (${(scanSignalStrength * 100).toFixed(0)}%) confirmed by quant analysis (${(quantConf * 100).toFixed(0)}% confidence). Community intelligence supports the thesis.`,
          exitCriteria: `Exit if consensus drops below 50% or risk score exceeds 0.8. Target: ${(qa.expectedReturn * 100).toFixed(1)}% return.`,
          positionSizeUsd: action !== 'skip' && action !== 'hold' ? randomFloat(1, 5) : 0,
          modelUsed: 'claude-sonnet-4.6',
          inputTokens: Math.floor(randomFloat(500, 900)),
          outputTokens: Math.floor(randomFloat(300, 600)),
          cost: thesisCost,
          latencyMs: Math.floor(randomFloat(800, 1500)),
        };

        economics.recordDecisionCosts(decisionId, [
          { model: 'claude-sonnet-4.6', role: 'synthesizer', inputTokens: Math.floor(randomFloat(500, 900)), outputTokens: Math.floor(randomFloat(300, 600)), cost: thesisCost },
        ]);

        totalCost += thesisCost;
        consensusScore = (scanSignalStrength + quantConf + thesisConviction) / 3;
        finalAction = consensusScore >= 0.6 && action !== 'skip' ? action : 'skip';
      }
    }

    // Simulate execution result for buy/sell
    let executionResult: string | undefined;
    let status: CommitteeDecision['status'] = 'decided';

    if (finalAction === 'buy' || finalAction === 'sell') {
      await sleep(randomFloat(500, 1000));
      executionResult = `${finalAction.toUpperCase()} executed: $${thesis!.positionSizeUsd.toFixed(2)} of ${token} on Base via Bankr Agent API. Tx confirmed.`;
      status = 'completed';
      economics.recordExecution();

      // Record simulated trade revenue
      economics.recordRevenue({
        timestamp: new Date().toISOString(),
        source: 'trade_pnl',
        amount: randomFloat(0.001, 0.02),
        token,
        details: executionResult,
      });
    }

    // Simulate token fee revenue (every few decisions)
    if (demoCounter % 3 === 0) {
      economics.recordRevenue({
        timestamp: new Date().toISOString(),
        source: 'token_fees',
        amount: randomFloat(0.005, 0.03),
        token: 'ORACLE',
        details: 'Swap fee revenue from $ORACLE trading activity',
      });
    }

    economics.recordCycle();

    decisions.push({
      id: decisionId,
      timestamp: new Date().toISOString(),
      token,
      scanResult,
      quantAnalysis,
      thesis,
      finalAction,
      consensusScore,
      totalInferenceCost: totalCost,
      totalLatencyMs: Math.floor(randomFloat(1500, 3500)),
      executionResult,
      status,
    });
  }

  return decisions;
}
