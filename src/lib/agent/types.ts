import type { CommitteeDecision } from '../analysis/types';
import type { EconomicsSnapshot } from '../economics/types';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';

export interface BonfiresReputation {
  accuracy: number;
  totalPredictions: number;
  communityTrust: number;
}

export interface OnchainActivity {
  id: string;
  timestamp: string;
  type: 'trade' | 'fee_claim' | 'token_launch' | 'balance_check' | 'inference' | 'bonfires';
  description: string;
  result: string;
  costUsd?: number;
  revenueUsd?: number;
}

export interface WalletInfo {
  balanceRaw: string;
  lastCheckedAt: string | null;
  totalFeesClaimed: number;
  totalTradeVolume: number;
  inferenceSpend: number;
}

export interface AgentState {
  status: AgentStatus;
  currentCycle: number;
  lastCycleAt: string | null;
  nextCycleAt: string | null;
  decisions: CommitteeDecision[];
  economics: EconomicsSnapshot;
  error: string | null;
  startedAt: string | null;
  tokenLaunched: boolean;
  tokenName: string | null;
  tokenSymbol: string | null;
  wallet: WalletInfo;
  activityLog: OnchainActivity[];
  bonfiresReputation: BonfiresReputation;
}

export interface AgentConfig {
  cycleIntervalMs: number;
  maxPositionSizeUsd: number;
  minConsensusScore: number;
  topics: string[];
  enableExecution: boolean;
  enableTokenLaunch: boolean;
  autoLaunchToken: boolean;
  autoClaimFees: boolean;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  cycleIntervalMs: Number(process.env.AGENT_CYCLE_INTERVAL_MS) || 300000,
  maxPositionSizeUsd: Number(process.env.AGENT_MAX_POSITION_SIZE_USD) || 5,
  minConsensusScore: Number(process.env.AGENT_MIN_CONSENSUS_SCORE) || 0.3,
  topics: ['ETH', 'Base ecosystem', 'DeFi governance', 'AI tokens', 'BNKR'],
  enableExecution: true,
  enableTokenLaunch: false,
  autoLaunchToken: false, // Token already launched — don't create duplicates
  autoClaimFees: true,
};
