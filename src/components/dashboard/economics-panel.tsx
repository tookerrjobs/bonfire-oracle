'use client';

import { TrendingUp, TrendingDown, DollarSign, Zap, Target, Battery } from 'lucide-react';
import type { EconomicsSnapshot } from '@/lib/economics/types';
import { formatUsd, formatPercent } from '@/lib/utils';

interface EconomicsPanelProps {
  economics: EconomicsSnapshot;
}

export function EconomicsPanel({ economics }: EconomicsPanelProps) {
  const isPositive = economics.netPnl >= 0;

  return (
    <div className="glass-panel rounded-xl p-5 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Self-Funding Economics
        </h2>
        {economics.selfSustaining ? (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-900/40 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800/50 badge-pulse">
            <Battery className="w-3 h-3" />
            Self-Sustaining
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-900/40 text-amber-400 text-xs font-medium rounded-full border border-amber-800/50">
            <Zap className="w-3 h-3" />
            Building
          </span>
        )}
      </div>

      {/* Revenue Hero */}
      <div className="mb-4 p-4 rounded-lg bg-zinc-950/80 border border-emerald-900/30">
        <div className="text-xs text-zinc-500 mb-1">Total Revenue</div>
        <div className="text-4xl font-bold tracking-tight text-emerald-400 revenue-glow font-mono">
          {formatUsd(economics.totalRevenue)}
        </div>
        <div className="text-xs text-zinc-600 mt-1">
          {formatUsd(economics.avgRevenuePerCycle)}/cycle avg
        </div>
      </div>

      {/* Net PnL + ROI */}
      <div className="mb-5 p-4 rounded-lg bg-zinc-950/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Net Inference ROI</div>
            <div className={`text-3xl font-bold tracking-tight ${isPositive ? 'text-emerald-400 text-glow-green' : 'text-red-400'}`}>
              {formatPercent(economics.roi)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500 mb-1">Net P&L</div>
            <div className={`text-xl font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatUsd(economics.netPnl)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={`text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? 'Profitable' : 'Building'} — {formatUsd(economics.totalInferenceCost)} spent
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<DollarSign className="w-4 h-4 text-red-400" />}
          label="Total Cost"
          value={formatUsd(economics.totalInferenceCost)}
          sub={`${formatUsd(economics.avgCostPerCycle)}/cycle`}
        />
        <MetricCard
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          label="Total Revenue"
          value={formatUsd(economics.totalRevenue)}
          sub={`${formatUsd(economics.avgRevenuePerCycle)}/cycle`}
        />
        <MetricCard
          icon={<Target className="w-4 h-4 text-blue-400" />}
          label="Decisions"
          value={String(economics.decisionsExecuted)}
          sub={`${economics.cyclesRun} cycles run`}
        />
        <MetricCard
          icon={<Battery className="w-4 h-4 text-amber-400" />}
          label="Runway"
          value={economics.runwayCycles >= 9999 ? 'Infinite' : `${economics.runwayCycles} cycles`}
          sub={economics.selfSustaining ? 'Self-funding' : 'Pre-funding'}
        />
      </div>

      {/* Revenue Breakdown */}
      {Object.keys(economics.revenueBreakdown).length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2">Revenue Sources</div>
          {Object.entries(economics.revenueBreakdown).map(([source, amount]) => (
            <div key={source} className="flex items-center justify-between text-xs py-1">
              <span className="text-zinc-400 capitalize">{source.replace(/_/g, ' ')}</span>
              <span className="text-emerald-400 font-mono">{formatUsd(amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Explain the model when no data yet */}
      {economics.cyclesRun === 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="text-[11px] text-zinc-400 leading-relaxed space-y-2">
            <p><span className="text-emerald-400 font-medium">How self-funding works:</span> The agent launched $ORACLE on Base. Every time someone trades $ORACLE, a fee flows to this wallet. Those fees pay for Gemini, GPT, and Claude inference — which generates trading signals — which generate more revenue.</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-zinc-950/50 rounded p-2 text-center">
                <div className="text-emerald-400 text-xs font-bold">$63+</div>
                <div className="text-[9px] text-zinc-600">Earned to date</div>
              </div>
              <div className="bg-zinc-950/50 rounded p-2 text-center">
                <div className="text-red-400 text-xs font-bold">~$0.01</div>
                <div className="text-[9px] text-zinc-600">Per cycle cost</div>
              </div>
              <div className="bg-zinc-950/50 rounded p-2 text-center">
                <div className="text-blue-400 text-xs font-bold">∞</div>
                <div className="text-[9px] text-zinc-600">Runway</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <div className="text-sm font-semibold text-zinc-200">{value}</div>
      <div className="text-xs text-zinc-600">{sub}</div>
    </div>
  );
}
