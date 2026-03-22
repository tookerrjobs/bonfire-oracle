'use client';

import { ArrowUpRight, ArrowDownRight, MinusCircle, AlertCircle, CheckCircle2, Loader2, Brain } from 'lucide-react';
import type { CommitteeDecision } from '@/lib/analysis/types';
import { formatUsd, timeAgo } from '@/lib/utils';

interface DecisionFeedProps {
  decisions: CommitteeDecision[];
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  buy: {
    icon: <ArrowUpRight className="w-4 h-4" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30 border-emerald-800/50',
  },
  sell: {
    icon: <ArrowDownRight className="w-4 h-4" />,
    color: 'text-red-400',
    bg: 'bg-red-900/30 border-red-800/50',
  },
  hold: {
    icon: <MinusCircle className="w-4 h-4" />,
    color: 'text-amber-400',
    bg: 'bg-amber-900/30 border-amber-800/50',
  },
  skip: {
    icon: <MinusCircle className="w-4 h-4" />,
    color: 'text-zinc-500',
    bg: 'bg-zinc-900/30 border-zinc-800/50',
  },
};

const STATUS_BADGE: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  analyzing: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Analyzing', color: 'text-blue-400' },
  decided: { icon: <Brain className="w-3 h-3" />, label: 'Decided', color: 'text-violet-400' },
  executing: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Executing', color: 'text-amber-400' },
  completed: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Completed', color: 'text-emerald-400' },
  failed: { icon: <AlertCircle className="w-3 h-3" />, label: 'Failed', color: 'text-red-400' },
};

export function DecisionFeed({ decisions }: DecisionFeedProps) {
  if (decisions.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
        <div className="text-center">
          <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-zinc-400 mb-1">No Decisions Yet</h3>
          <p className="text-xs text-zinc-600">Start the agent or run a cycle to see the multi-model committee in action</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Committee Decisions
        </h2>
        <p className="text-xs text-zinc-600 mt-0.5">
          Gemini scans &rarr; GPT quantifies &rarr; Claude synthesizes
        </p>
      </div>

      <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
        {decisions.map((d) => {
          const action = ACTION_CONFIG[d.finalAction] || ACTION_CONFIG.skip;
          const status = STATUS_BADGE[d.status] || STATUS_BADGE.analyzing;

          return (
            <div key={d.id} className="p-4 hover:bg-zinc-800/30 transition-colors">
              {/* Top row: token + action + status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${action.bg} ${action.color}`}>
                    {action.icon}
                    <span className="uppercase">{d.finalAction}</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">{d.token}</span>
                  {d.thesis && d.thesis.positionSizeUsd > 0 && d.finalAction !== 'skip' && (
                    <span className="text-xs text-zinc-500">{formatUsd(d.thesis.positionSizeUsd)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </span>
                  <span className="text-xs text-zinc-600">{timeAgo(d.timestamp)}</span>
                </div>
              </div>

              {/* Consensus bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500">Consensus</span>
                  <span className="text-zinc-400 font-mono">{(d.consensusScore * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      d.consensusScore >= 0.7 ? 'bg-emerald-500' : d.consensusScore >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(d.consensusScore * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Model pipeline summary */}
              <div className="flex items-center gap-3 text-xs">
                <ModelChip name="Gemini" role="Scan" active={!!d.scanResult} />
                <span className="text-zinc-700">&rarr;</span>
                <ModelChip name="GPT" role="Quant" active={!!d.quantAnalysis} />
                <span className="text-zinc-700">&rarr;</span>
                <ModelChip name="Claude" role="Thesis" active={!!d.thesis} />
                <span className="ml-auto text-zinc-600 font-mono">{formatUsd(d.totalInferenceCost)} cost</span>
              </div>

              {/* Thesis narrative (if available) */}
              {d.thesis && d.thesis.narrative && (
                <div className="mt-2 p-2 rounded bg-zinc-950/50 border border-zinc-800/50">
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{d.thesis.narrative}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModelChip({ name, role, active }: { name: string; role: string; active: boolean }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-mono ${
        active ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-900 text-zinc-600'
      }`}
    >
      {name} <span className="text-zinc-500">({role})</span>
    </span>
  );
}
