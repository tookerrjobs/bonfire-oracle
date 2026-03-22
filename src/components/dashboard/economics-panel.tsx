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
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Self-Funding Economics
        </h2>
        {economics.selfSustaining ? (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-900/40 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800/50">
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

      {/* Net PnL Hero */}
      <div className="mb-5 p-4 rounded-lg bg-zinc-950 border border-zinc-800">
        <div className="text-xs text-zinc-500 mb-1">Net Inference ROI</div>
        <div className={`text-3xl font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatPercent(economics.roi)}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={`text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatUsd(economics.netPnl)} net
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
