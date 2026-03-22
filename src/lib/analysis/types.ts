export interface ScanResult {
  topics: string[];
  signals: Array<{
    token: string;
    signal: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    reason: string;
  }>;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  timestamp: string;
}

export interface QuantAnalysis {
  token: string;
  pattern: string;
  historicalCorrelation: number;
  riskScore: number;
  expectedReturn: number;
  confidence: number;
  reasoning: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
}

export interface Thesis {
  token: string;
  action: 'buy' | 'sell' | 'hold' | 'skip';
  conviction: number;
  riskAssessment: string;
  narrative: string;
  entryReason: string;
  exitCriteria: string;
  positionSizeUsd: number;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
}

export interface CommunityConsensus {
  sentiment: number;
  confidence: number;
  sampleSize: number;
}

export interface CommitteeDecision {
  id: string;
  timestamp: string;
  token: string;
  scanResult: ScanResult;
  quantAnalysis: QuantAnalysis | null;
  thesis: Thesis | null;
  finalAction: 'buy' | 'sell' | 'hold' | 'skip';
  consensusScore: number;
  totalInferenceCost: number;
  totalLatencyMs: number;
  executionResult?: string;
  pnl?: number;
  status: 'analyzing' | 'decided' | 'executing' | 'completed' | 'failed' | 'community_override';
  communityConsensus?: CommunityConsensus;
}
