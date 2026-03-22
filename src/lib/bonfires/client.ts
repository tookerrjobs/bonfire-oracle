import type {
  BonfiresConfig,
  KnowledgeQueryResult,
  CommunitySignal,
  BonfiresInsight,
  KnowledgeNode,
} from './types';

if (!process.env.BONFIRES_API_KEY) {
  console.warn('[BonfiresClient] BONFIRES_API_KEY is not set — Bonfires queries will use fallback data');
}

const DEFAULT_CONFIG: BonfiresConfig = {
  apiUrl: process.env.BONFIRES_API_URL || 'https://api.bonfires.ai',
  apiKey: process.env.BONFIRES_API_KEY || '',
};

export class BonfiresClient {
  private config: BonfiresConfig;
  private cache: Map<string, { data: BonfiresInsight; expiry: number }> = new Map();
  private cacheTtlMs = 5 * 60 * 1000;

  constructor(config?: Partial<BonfiresConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async queryKnowledge(
    query: string,
    communityId?: string
  ): Promise<KnowledgeQueryResult> {
    const start = Date.now();

    try {
      const res = await fetch(`${this.config.apiUrl}/v1/knowledge/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ query, communityId, limit: 50 }),
      });

      if (!res.ok) {
        console.warn(`Bonfires API error: ${res.status}, using fallback`);
        return this.getFallbackQueryResult(query, Date.now() - start);
      }

      return await res.json();
    } catch (err) {
      console.warn('Bonfires API unreachable, using fallback:', err);
      return this.getFallbackQueryResult(query, Date.now() - start);
    }
  }

  async getCommunitySignals(topics: string[]): Promise<CommunitySignal[]> {
    const results = await Promise.all(
      topics.map(async (topic) => {
        try {
          const result = await this.queryKnowledge(
            `What are communities discussing about ${topic}? Include governance decisions, sentiment, and key participants.`
          );
          if (result.nodes.length > 0) {
            return this.extractSignal(topic, result);
          }
          return null;
        } catch (err) {
          console.warn(`Failed to get signal for ${topic}:`, err);
          return null;
        }
      })
    );

    return results.filter((s): s is CommunitySignal => s !== null);
  }

  async getInsights(topics: string[]): Promise<BonfiresInsight> {
    const cacheKey = topics.sort().join(',');
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) return cached.data;

    const start = Date.now();
    const signals = await this.getCommunitySignals(topics);

    const topTopics = signals
      .map((s) => ({ topic: s.topic, mentions: s.mentionCount, sentiment: s.sentiment }))
      .sort((a, b) => b.mentions - a.mentions);

    const governanceActions = signals.flatMap((s) =>
      s.recentDecisions.map((d) => ({
        dao: s.communityName,
        action: d,
        impact: s.sentiment > 0.6 ? 'bullish' : s.sentiment < 0.4 ? 'bearish' : 'neutral',
      }))
    );

    const alphaOpportunities = signals
      .filter((s) => s.trendDirection === 'rising' && s.sentiment > 0.6)
      .map((s) => ({
        token: s.topic,
        reason: `Rising discussion (${s.mentionCount} mentions) with ${Math.round(s.sentiment * 100)}% positive sentiment`,
        communitySource: s.communityName,
        confidence: Math.min(s.sentiment * (s.mentionCount / 50), 1),
      }));

    const insight: BonfiresInsight = {
      signals,
      topTopics,
      governanceActions,
      alphaOpportunities,
      queryCost: signals.length * 0.001,
      queryTimeMs: Date.now() - start,
    };

    this.cache.set(cacheKey, { data: insight, expiry: Date.now() + this.cacheTtlMs });
    return insight;
  }

  async publishDecision(decision: {
    token: string;
    action: string;
    confidence: number;
    reasoning: string;
    result?: string;
  }): Promise<void> {
    try {
      await fetch(`${this.config.apiUrl}/v1/knowledge/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          type: 'agent_decision',
          content: `Bonfire Oracle ${decision.action.toUpperCase()} ${decision.token} (confidence: ${(decision.confidence * 100).toFixed(0)}%) — ${decision.reasoning}`,
          metadata: { agent: 'bonfire-oracle', ...decision },
        }),
      });
    } catch (err) {
      console.warn('Failed to publish decision to Bonfires:', err);
    }
  }

  async getAgentReputation(): Promise<{
    accuracy: number;
    totalPredictions: number;
    communityTrust: number;
  }> {
    try {
      const res = await fetch(
        `${this.config.apiUrl}/v1/agents/bonfire-oracle/reputation`,
        {
          headers: { Authorization: `Bearer ${this.config.apiKey}` },
        }
      );
      if (res.ok) return await res.json();
    } catch {}
    return { accuracy: 0, totalPredictions: 0, communityTrust: 0.5 };
  }

  async getCommunityConsensus(
    token: string
  ): Promise<{ sentiment: number; confidence: number; sampleSize: number }> {
    const result = await this.queryKnowledge(
      `Community consensus on ${token}: bullish or bearish? Include recent discussion volume and key arguments.`,
      undefined
    );
    const sentiment =
      result.nodes.length > 0
        ? result.nodes.reduce((sum, n) => sum + n.weight, 0) /
          result.nodes.length
        : 0.5;
    return {
      sentiment,
      confidence: Math.min(result.totalNodes / 20, 1),
      sampleSize: result.totalNodes,
    };
  }

  private extractSignal(topic: string, result: KnowledgeQueryResult): CommunitySignal {
    const decisions = result.nodes
      .filter((n) => n.type === 'decision' || n.type === 'consensus')
      .map((n) => n.content);

    const people = result.nodes
      .filter((n) => n.type === 'person')
      .map((n) => n.content);

    const avgWeight =
      result.nodes.reduce((sum, n) => sum + n.weight, 0) / Math.max(result.nodes.length, 1);

    return {
      communityId: result.communityId,
      communityName: result.communityName,
      topic,
      sentiment: Math.min(Math.max(avgWeight, 0), 1),
      mentionCount: result.totalNodes,
      keyParticipants: people.slice(0, 5),
      recentDecisions: decisions.slice(0, 5),
      trendDirection: avgWeight > 0.6 ? 'rising' : avgWeight < 0.4 ? 'declining' : 'stable',
      relevantNodes: result.nodes.slice(0, 10),
      extractedAt: new Date().toISOString(),
    };
  }

  private getFallbackQueryResult(query: string, queryTimeMs: number): KnowledgeQueryResult {
    return {
      nodes: [],
      totalNodes: 0,
      queryTimeMs,
      communityId: 'fallback',
      communityName: 'Bonfires Network',
    };
  }
}

export const bonfires = new BonfiresClient();
