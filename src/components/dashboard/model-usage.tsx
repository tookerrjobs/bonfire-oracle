'use client';

import { Cpu } from 'lucide-react';
import type { EconomicsSnapshot } from '@/lib/economics/types';
import { formatUsd } from '@/lib/utils';

interface ModelUsageProps {
  economics: EconomicsSnapshot;
}

const MODEL_COLORS: Record<string, { bar: string; text: string; label: string }> = {
  'gemini-2.5-flash': { bar: 'bg-blue-500', text: 'text-blue-400', label: 'Gemini Flash (Scanner)' },
  'gpt-5-mini': { bar: 'bg-green-500', text: 'text-green-400', label: 'GPT-5 Mini (Quantitative)' },
  'claude-sonnet-4.6': { bar: 'bg-violet-500', text: 'text-violet-400', label: 'Claude Sonnet (Synthesizer)' },
};

export function ModelUsage({ economics }: ModelUsageProps) {
  const breakdown = economics.costBreakdown;
  const totalCost = Object.values(breakdown).reduce((s, v) => s + v, 0) || 1;
  const models = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Multi-Model Usage
          </h2>
        </div>
        <span className="text-xs text-zinc-500 font-mono">
          {economics.cyclesRun} cycles &middot; {formatUsd(economics.totalInferenceCost)} total
        </span>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-zinc-600">No model calls yet. Run a cycle to see usage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {models.map(([model, cost]) => {
            const config = MODEL_COLORS[model] || { bar: 'bg-zinc-500', text: 'text-zinc-400', label: model };
            const pct = (cost / totalCost) * 100;

            return (
              <div key={model}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={config.text}>{config.label}</span>
                  <span className="text-zinc-500 font-mono">
                    {formatUsd(cost)} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pipeline visualization */}
      <div className="mt-5 pt-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 mb-3">Analysis Pipeline</div>
        <div className="flex items-center justify-between gap-2">
          <PipelineStep
            label="Scan"
            model="Gemini Flash"
            description="Fast signal detection"
            color="blue"
          />
          <Arrow />
          <PipelineStep
            label="Quantify"
            model="GPT-5 Mini"
            description="Pattern analysis"
            color="green"
          />
          <Arrow />
          <PipelineStep
            label="Synthesize"
            model="Claude Sonnet"
            description="Final thesis"
            color="violet"
          />
        </div>
      </div>
    </div>
  );
}

function PipelineStep({
  label,
  model,
  description,
  color,
}: {
  label: string;
  model: string;
  description: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-800/50 bg-blue-950/30',
    green: 'border-green-800/50 bg-green-950/30',
    violet: 'border-violet-800/50 bg-violet-950/30',
  };

  return (
    <div className={`flex-1 p-2.5 rounded-lg border ${colors[color] || 'border-zinc-800 bg-zinc-950/30'}`}>
      <div className="text-xs font-semibold text-zinc-300">{label}</div>
      <div className="text-[10px] text-zinc-500">{model}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5">{description}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="text-zinc-700 flex-shrink-0">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
