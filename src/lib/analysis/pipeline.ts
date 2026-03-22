import { callModel } from '../bankr/gateway';
import { bonfires } from '../bonfires/client';
import type { BonfiresInsight } from '../bonfires/types';
import type { ScanResult, QuantAnalysis, Thesis, CommitteeDecision } from './types';

const SCANNER_MODEL = 'gemini-2.5-flash';
const QUANT_MODEL = 'gpt-5-mini';
const SYNTHESIZER_MODEL = 'claude-sonnet-4.6';

let decisionCounter = 0;

export async function runScan(
  bonfiresInsight: BonfiresInsight | null
): Promise<ScanResult> {
  const communityContext = bonfiresInsight
    ? `\n\nCOMMUNITY INTELLIGENCE (from Bonfires Knowledge Graph):\n${JSON.stringify(
        {
          topTopics: bonfiresInsight.topTopics.slice(0, 5),
          governanceActions: bonfiresInsight.governanceActions.slice(0, 5),
          alphaOpportunities: bonfiresInsight.alphaOpportunities.slice(0, 3),
        },
        null,
        2
      )}`
    : '';

  const result = await callModel(
    SCANNER_MODEL,
    `You are a crypto market scanner. Analyze current market conditions and community intelligence to identify trading signals. Be concise and data-driven.

Return a JSON object with this exact structure:
{
  "topics": ["topic1", "topic2"],
  "signals": [
    {"token": "ETH", "signal": "bullish", "strength": 0.7, "reason": "brief reason"}
  ]
}

Only return valid JSON, no markdown or explanation.`,
    `Scan the current crypto market for opportunities. Focus on Base chain tokens and major assets.${communityContext}`,
    { temperature: 0.2, maxTokens: 1024 }
  );

  try {
    const parsed = JSON.parse(result.text.replace(/```json?\n?|\n?```/g, '').trim());
    return {
      topics: parsed.topics || [],
      signals: (parsed.signals || []).map((s: Record<string, unknown>) => ({
        token: String(s.token || ''),
        signal: s.signal === 'bullish' || s.signal === 'bearish' ? s.signal : 'neutral',
        strength: Number(s.strength) || 0.5,
        reason: String(s.reason || ''),
      })),
      modelUsed: SCANNER_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost: result.estimatedCost,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      topics: [],
      signals: [],
      modelUsed: SCANNER_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost: result.estimatedCost,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function runQuantAnalysis(
  token: string,
  scanSignal: ScanResult['signals'][0],
  bonfiresInsight: BonfiresInsight | null
): Promise<QuantAnalysis> {
  const communityData = bonfiresInsight
    ? `\nCommunity data: ${bonfiresInsight.signals.length} communities tracked, ${bonfiresInsight.topTopics.length} trending topics`
    : '';

  const result = await callModel(
    QUANT_MODEL,
    `You are a quantitative crypto analyst. Analyze the token and provide a structured assessment.

Return a JSON object with this exact structure:
{
  "pattern": "description of price/volume pattern",
  "historicalCorrelation": 0.65,
  "riskScore": 0.4,
  "expectedReturn": 0.08,
  "confidence": 0.7,
  "reasoning": "brief quantitative reasoning"
}

Only return valid JSON, no markdown or explanation.`,
    `Analyze ${token} for trading opportunity.\nScanner signal: ${scanSignal.signal} (strength: ${scanSignal.strength})\nReason: ${scanSignal.reason}${communityData}`,
    { temperature: 0.1, maxTokens: 512 }
  );

  try {
    const parsed = JSON.parse(result.text.replace(/```json?\n?|\n?```/g, '').trim());
    return {
      token,
      pattern: String(parsed.pattern || 'Unknown pattern'),
      historicalCorrelation: Number(parsed.historicalCorrelation) || 0.5,
      riskScore: Number(parsed.riskScore) || 0.5,
      expectedReturn: Number(parsed.expectedReturn) || 0,
      confidence: Number(parsed.confidence) || 0.5,
      reasoning: String(parsed.reasoning || ''),
      modelUsed: QUANT_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost: result.estimatedCost,
      latencyMs: result.latencyMs,
    };
  } catch {
    return {
      token,
      pattern: 'Parse error',
      historicalCorrelation: 0.5,
      riskScore: 0.5,
      expectedReturn: 0,
      confidence: 0.3,
      reasoning: result.text.slice(0, 200),
      modelUsed: QUANT_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost: result.estimatedCost,
      latencyMs: result.latencyMs,
    };
  }
}

export async function runSynthesis(
  token: string,
  scanSignal: ScanResult['signals'][0],
  quantAnalysis: QuantAnalysis,
  bonfiresInsight: BonfiresInsight | null,
  maxPositionUsd: number = 5
): Promise<Thesis> {
  const communityContext = bonfiresInsight
    ? `\nCommunity Intelligence:\n- ${bonfiresInsight.alphaOpportunities.length} alpha opportunities detected\n- ${bonfiresInsight.governanceActions.length} governance actions tracked\n- Top sentiment: ${bonfiresInsight.topTopics[0]?.topic || 'N/A'} (${bonfiresInsight.topTopics[0]?.sentiment || 0})`
    : '';

  const result = await callModel(
    SYNTHESIZER_MODEL,
    `You are a senior crypto investment analyst writing a final thesis. Synthesize scanner signals, quantitative analysis, and community intelligence into an actionable decision.

Consider:
- Risk/reward ratio
- Community sentiment alignment
- Quantitative confidence
- Position sizing (max $${maxPositionUsd})

Return a JSON object with this exact structure:
{
  "action": "buy" or "sell" or "hold" or "skip",
  "conviction": 0.75,
  "riskAssessment": "brief risk assessment",
  "narrative": "the thesis narrative",
  "entryReason": "why enter now",
  "exitCriteria": "when to exit",
  "positionSizeUsd": 3.0
}

Only return valid JSON, no markdown or explanation.`,
    `INVESTMENT THESIS REQUEST for ${token}

Scanner (Gemini): ${scanSignal.signal} signal, strength ${scanSignal.strength}
Reason: ${scanSignal.reason}

Quant Analysis (GPT): 
- Pattern: ${quantAnalysis.pattern}
- Expected return: ${(quantAnalysis.expectedReturn * 100).toFixed(1)}%
- Risk score: ${quantAnalysis.riskScore}
- Confidence: ${quantAnalysis.confidence}
- Reasoning: ${quantAnalysis.reasoning}${communityContext}`,
    { temperature: 0.2, maxTokens: 768 }
  );

  try {
    const parsed = JSON.parse(result.text.replace(/```json?\n?|\n?```/g, '').trim());
    return {
      token,
      action: ['buy', 'sell', 'hold', 'skip'].includes(parsed.action) ? parsed.action : 'skip',
      conviction: Math.min(Math.max(Number(parsed.conviction) || 0, 0), 1),
      riskAssessment: String(parsed.riskAssessment || ''),
      narrative: String(parsed.narrative || ''),
      entryReason: String(parsed.entryReason || ''),
      exitCriteria: String(parsed.exitCriteria || ''),
      positionSizeUsd: Math.min(Number(parsed.positionSizeUsd) || 1, maxPositionUsd),
      modelUsed: SYNTHESIZER_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost: result.estimatedCost,
      latencyMs: result.latencyMs,
    };
  } catch {
    return {
      token,
      action: 'skip',
      conviction: 0,
      riskAssessment: 'Failed to parse synthesis',
      narrative: result.text.slice(0, 200),
      entryReason: '',
      exitCriteria: '',
      positionSizeUsd: 0,
      modelUsed: SYNTHESIZER_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost: result.estimatedCost,
      latencyMs: result.latencyMs,
    };
  }
}

export async function runFullPipeline(
  topics: string[] = ['ETH', 'Base ecosystem', 'DeFi', 'AI tokens', 'memecoins'],
  maxPositionUsd: number = 5,
  minConsensus: number = 0.6
): Promise<CommitteeDecision[]> {
  const decisions: CommitteeDecision[] = [];

  // Step 1: Query Bonfires for community intelligence
  let bonfiresInsight: BonfiresInsight | null = null;
  try {
    bonfiresInsight = await bonfires.getInsights(topics);
  } catch (err) {
    console.warn('Bonfires insights unavailable:', err);
  }

  // Step 2: Run scanner (Gemini Flash)
  const scan = await runScan(bonfiresInsight);

  // Step 3: For each signal above threshold, run full committee
  const strongSignals = scan.signals.filter((s) => s.strength >= 0.5);

  for (const signal of strongSignals.slice(0, 3)) {
    const decisionId = `dec_${++decisionCounter}_${Date.now()}`;
    const decision: CommitteeDecision = {
      id: decisionId,
      timestamp: new Date().toISOString(),
      token: signal.token,
      scanResult: scan,
      quantAnalysis: null,
      thesis: null,
      finalAction: 'skip',
      consensusScore: 0,
      totalInferenceCost: scan.cost,
      totalLatencyMs: scan.latencyMs,
      status: 'analyzing',
    };

    try {
      // Step 3a: Quant analysis (GPT)
      const quant = await runQuantAnalysis(signal.token, signal, bonfiresInsight);
      decision.quantAnalysis = quant;
      decision.totalInferenceCost += quant.cost;
      decision.totalLatencyMs += quant.latencyMs;

      // Step 3b: Only escalate to Claude if quant confidence is reasonable
      if (quant.confidence >= 0.4) {
        const thesis = await runSynthesis(
          signal.token,
          signal,
          quant,
          bonfiresInsight,
          maxPositionUsd
        );
        decision.thesis = thesis;
        decision.totalInferenceCost += thesis.cost;
        decision.totalLatencyMs += thesis.latencyMs;

        // Compute consensus from all three models + Bonfires community weight
        const scanConf = signal.strength;
        const quantConf = quant.confidence;
        const thesisConf = thesis.conviction;
        const communityWeight = bonfiresInsight
          ? bonfiresInsight.alphaOpportunities.find(
              (a) => a.token.toLowerCase() === signal.token.toLowerCase()
            )?.confidence || 0
          : 0;
        decision.consensusScore = communityWeight > 0
          ? (scanConf + quantConf + thesisConf + communityWeight) / 4
          : (scanConf + quantConf + thesisConf) / 3;
        decision.finalAction =
          decision.consensusScore >= minConsensus && thesis.action !== 'skip'
            ? thesis.action
            : 'skip';
      } else {
        decision.finalAction = 'skip';
        decision.consensusScore = (signal.strength + quant.confidence) / 2;
      }

      decision.status = 'decided';
    } catch (err) {
      decision.status = 'failed';
      console.error(`Pipeline failed for ${signal.token}:`, err);
    }

    // Add bonfires query cost
    if (bonfiresInsight) {
      decision.totalInferenceCost += bonfiresInsight.queryCost;
    }

    decisions.push(decision);
  }

  return decisions;
}
