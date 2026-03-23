'use client';

import { Shield, Users, AlertTriangle, Send, Flame } from 'lucide-react';
import type { AgentState } from '@/lib/agent/types';
import type { CommitteeDecision } from '@/lib/analysis/types';

interface BonfiresPanelProps {
  state: AgentState;
}

export function BonfiresPanel({ state }: BonfiresPanelProps) {
  const { bonfiresReputation, decisions, activityLog } = state;

  const communityOverrides = decisions.filter(
    (d) => d.status === 'community_override'
  );

  const publishedDecisions = decisions.filter(
    (d) => d.status === 'completed' || d.status === 'decided' || d.status === 'community_override'
  );

  const bonfiresActivities = activityLog.filter((a) => a.type === 'bonfires');

  const trustColor =
    bonfiresReputation.communityTrust >= 0.7
      ? 'text-emerald-400'
      : bonfiresReputation.communityTrust >= 0.4
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          Bonfires Community
        </h2>
        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/40 text-orange-400 text-xs font-medium rounded-full border border-orange-800/50">
          <Shield className="w-3 h-3" />
          Load-Bearing
        </span>
      </div>

      {/* Agent Reputation */}
      <div className="mb-5 p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
        <div className="text-xs text-zinc-500 mb-2">Agent Reputation on Bonfires</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-lg font-bold text-zinc-200">
              {bonfiresReputation.totalPredictions > 0
                ? `${(bonfiresReputation.accuracy * 100).toFixed(0)}%`
                : 'New'}
            </div>
            <div className="text-xs text-zinc-500">Accuracy</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-200">
              {bonfiresReputation.totalPredictions || '—'}
            </div>
            <div className="text-xs text-zinc-500">Predictions</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${trustColor}`}>
              {(bonfiresReputation.communityTrust * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-zinc-500">Community Trust</div>
          </div>
        </div>
        {bonfiresReputation.totalPredictions === 0 && (
          <div className="text-[10px] text-zinc-600 mt-2">Reputation builds as the agent publishes predictions and the community validates them.</div>
        )}
      </div>

      {/* Community Consensus on Active Tokens */}
      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          Community Consensus
        </div>
        {decisions.slice(0, 5).map((d) => (
          <ConsensusRow key={d.id} decision={d} />
        ))}
        {decisions.length === 0 && (
          <div className="space-y-2 py-1">
            <div className="text-[11px] text-zinc-400 leading-relaxed">
              Bonfires knowledge graph is queried before every trade. Community sentiment, governance actions, and trending signals are fed into the AI committee as a <span className="text-orange-400 font-medium">4th consensus signal</span>.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/50">
                <div className="text-[10px] text-orange-400/70 font-medium mb-1">Consensus Gate</div>
                <div className="text-[10px] text-zinc-500">Community can override AI decisions when sentiment strongly disagrees</div>
              </div>
              <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/50">
                <div className="text-[10px] text-blue-400/70 font-medium mb-1">Decision Publishing</div>
                <div className="text-[10px] text-zinc-500">Every trade decision is published back to Bonfires knowledge graph</div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-600 italic">Waiting for next cycle to query community...</div>
          </div>
        )}
      </div>

      {/* Community Overrides */}
      {communityOverrides.length > 0 && (
        <div className="mb-4 pt-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Community Overrides ({communityOverrides.length})
          </div>
          {communityOverrides.slice(0, 5).map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50 last:border-0"
            >
              <span className="text-amber-400 font-mono">{d.token}</span>
              <span className="text-zinc-500">
                {d.communityConsensus
                  ? `Sentiment: ${(d.communityConsensus.sentiment * 100).toFixed(0)}%`
                  : 'Overridden'}
              </span>
              <span className="text-zinc-600 text-xs">
                {new Date(d.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Published Back */}
      <div className="pt-3 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
          <Send className="w-3 h-3 text-blue-400" />
          Published to Community ({publishedDecisions.length})
        </div>
        {publishedDecisions.slice(0, 5).map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50 last:border-0"
          >
            <span className="text-zinc-300 font-mono">{d.token}</span>
            <ActionBadge action={d.finalAction} />
            <span className="text-zinc-500">
              {(d.consensusScore * 100).toFixed(0)}% conf
            </span>
          </div>
        ))}
        {publishedDecisions.length === 0 && (
          <div className="space-y-2 py-1">
            <div className="text-[11px] text-zinc-500 leading-relaxed">
              After each cycle, the agent publishes its trading decision back to Bonfires — including token, action, confidence, and reasoning. This makes the community smarter over time.
            </div>
            <div className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/50">
              <div className="text-[10px] text-zinc-400 mb-1.5">Example contribution:</div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-300 font-mono">ETH</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">BUY</span>
                <span className="text-zinc-500">78% confidence</span>
              </div>
              <div className="text-[9px] text-zinc-600 mt-1 italic">&quot;Rising Base ecosystem activity with strong DeFi governance signals&quot;</div>
            </div>
            <div className="text-[10px] text-zinc-600 italic">Contributions begin on the next active cycle.</div>
          </div>
        )}
      </div>

      {/* Recent Bonfires Activity */}
      {bonfiresActivities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2">Recent Activity</div>
          {bonfiresActivities.slice(0, 4).map((a) => (
            <div
              key={a.id}
              className="text-xs text-zinc-600 py-1 truncate"
              title={a.description}
            >
              {a.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsensusRow({ decision }: { decision: CommitteeDecision }) {
  const consensus = decision.communityConsensus;
  if (!consensus) {
    return (
      <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50 last:border-0">
        <span className="text-zinc-300 font-mono">{decision.token}</span>
        <span className="text-zinc-600">No community data</span>
      </div>
    );
  }

  const sentimentColor =
    consensus.sentiment >= 0.6
      ? 'text-emerald-400'
      : consensus.sentiment <= 0.4
        ? 'text-red-400'
        : 'text-zinc-400';

  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-300 font-mono">{decision.token}</span>
      <div className="flex items-center gap-2">
        <span className={sentimentColor}>
          {(consensus.sentiment * 100).toFixed(0)}% sentiment
        </span>
        <span className="text-zinc-600">
          {consensus.sampleSize} pts
        </span>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    buy: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50',
    sell: 'bg-red-900/40 text-red-400 border-red-800/50',
    hold: 'bg-amber-900/40 text-amber-400 border-amber-800/50',
    skip: 'bg-zinc-800/40 text-zinc-500 border-zinc-700/50',
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium border ${styles[action] || styles.skip}`}
    >
      {action.toUpperCase()}
    </span>
  );
}
