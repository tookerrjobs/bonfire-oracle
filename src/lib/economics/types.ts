export interface InferenceCostEntry {
  timestamp: string;
  model: string;
  role: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  decisionId: string;
}

export interface RevenueEntry {
  timestamp: string;
  source: 'trade_pnl' | 'token_fees' | 'fee_claim';
  amount: number;
  token: string;
  details: string;
}

export interface EconomicsSnapshot {
  totalInferenceCost: number;
  totalRevenue: number;
  netPnl: number;
  roi: number;
  costBreakdown: Record<string, number>;
  revenueBreakdown: Record<string, number>;
  cyclesRun: number;
  decisionsExecuted: number;
  avgCostPerCycle: number;
  avgRevenuePerCycle: number;
  selfSustaining: boolean;
  runwayCycles: number;
}
