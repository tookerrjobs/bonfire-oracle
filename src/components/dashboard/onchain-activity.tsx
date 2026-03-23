'use client';

import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Rocket,
  Brain,
  RefreshCw,
  Flame,
} from 'lucide-react';
import type { AgentState } from '@/lib/agent/types';
import { formatUsd } from '@/lib/utils';

interface OnchainActivityProps {
  state: AgentState;
}

const TYPE_CONFIG = {
  trade: { icon: ArrowUpRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  fee_claim: { icon: Coins, color: 'text-green-400', bg: 'bg-green-500/10' },
  token_launch: { icon: Rocket, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  balance_check: { icon: RefreshCw, color: 'text-gray-400', bg: 'bg-gray-500/10' },
  inference: { icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  bonfires: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export function OnchainActivity({ state }: OnchainActivityProps) {
  const { wallet, activityLog } = state;

  return (
    <div className="glass-panel rounded-xl p-5 fade-in">
      {/* Wallet Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-lg">Onchain Proof</h2>
        </div>
        <a
          href="https://basescan.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
        >
          Basescan <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      {/* Wallet Balance Card */}
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            Bankr Wallet Balance
          </div>
        </div>
        <div className="text-lg text-emerald-300 font-mono break-all leading-relaxed font-bold">
          {wallet.balanceRaw === 'unknown' ? (
            <span className="text-gray-500 italic text-sm font-normal">
              Will populate on first cycle...
            </span>
          ) : (
            wallet.balanceRaw.slice(0, 300)
          )}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {wallet.lastCheckedAt && (
            <span className="text-xs text-gray-500">
              Last checked:{' '}
              {new Date(wallet.lastCheckedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Token Contract Link */}
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">$ORACLE Token</div>
        <a
          href="https://bankr.bot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-mono flex items-center gap-1.5"
        >
          View on bankr.bot <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      {/* Self-Funding Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">Inference Spend</div>
          <div className="text-sm font-bold text-red-400 mt-1">
            {formatUsd(wallet.inferenceSpend)}
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">Fees Claimed</div>
          <div className="text-sm font-bold text-green-400 mt-1">
            {formatUsd(wallet.totalFeesClaimed)}
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400">Trade Volume</div>
          <div className="text-sm font-bold text-blue-400 mt-1">
            {formatUsd(wallet.totalTradeVolume)}
          </div>
        </div>
      </div>

      {/* Self-Sustaining Indicator */}
      <div
        className={`rounded-lg p-3 mb-4 text-center text-sm font-medium ${
          state.economics.selfSustaining
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
        }`}
      >
        {state.economics.selfSustaining ? (
          <>✅ Self-Sustaining — Revenue exceeds inference costs</>
        ) : state.economics.cyclesRun > 0 ? (
          <>
            ⏳ Building runway — {formatUsd(state.economics.totalRevenue)} /{' '}
            {formatUsd(state.economics.totalInferenceCost)} inference cost
          </>
        ) : (
          <>🔄 Waiting for first cycle...</>
        )}
      </div>

      {/* Activity Log */}
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Activity Log
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activityLog.length === 0 ? (
          <div className="text-sm text-gray-500 italic py-4 text-center">
            No activity yet — start the agent or run a cycle
          </div>
        ) : (
          activityLog.slice(0, 20).map((activity) => {
            const config = TYPE_CONFIG[activity.type];
            const Icon = config.icon;
            return (
              <div
                key={activity.id}
                className={`rounded-lg ${config.bg} p-3 border border-white/5`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-200 leading-tight">
                      {activity.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-mono break-all">
                      {activity.result.slice(0, 150)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                      {activity.costUsd !== undefined && activity.costUsd > 0 && (
                        <span className="text-xs text-red-400 flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          {formatUsd(activity.costUsd)}
                        </span>
                      )}
                      {activity.revenueUsd !== undefined &&
                        activity.revenueUsd > 0 && (
                          <span className="text-xs text-green-400 flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            {formatUsd(activity.revenueUsd)}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
