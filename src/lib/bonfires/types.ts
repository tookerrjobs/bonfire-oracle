export interface BonfiresConfig {
  apiUrl: string;
  apiKey: string;
}

export interface KnowledgeNode {
  id: string;
  type: 'decision' | 'person' | 'concept' | 'data_point' | 'action_item' | 'consensus';
  content: string;
  source: string;
  timestamp: string;
  connections: string[];
  weight: number;
}

export interface KnowledgeQueryResult {
  nodes: KnowledgeNode[];
  totalNodes: number;
  queryTimeMs: number;
  communityId: string;
  communityName: string;
}

export interface CommunitySignal {
  communityId: string;
  communityName: string;
  topic: string;
  sentiment: number;
  mentionCount: number;
  keyParticipants: string[];
  recentDecisions: string[];
  trendDirection: 'rising' | 'stable' | 'declining';
  relevantNodes: KnowledgeNode[];
  extractedAt: string;
}

export interface BonfiresInsight {
  signals: CommunitySignal[];
  topTopics: Array<{ topic: string; mentions: number; sentiment: number }>;
  governanceActions: Array<{ dao: string; action: string; impact: string }>;
  alphaOpportunities: Array<{
    token: string;
    reason: string;
    communitySource: string;
    confidence: number;
  }>;
  queryCost: number;
  queryTimeMs: number;
}
