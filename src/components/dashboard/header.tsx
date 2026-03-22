'use client';

import { useState, useEffect } from 'react';
import { Flame, Play, Square, RotateCw, Rocket, Loader2, AlertTriangle } from 'lucide-react';
import type { AgentState } from '@/lib/agent/types';

interface HeaderProps {
  state: AgentState;
  demoMode: boolean;
  loading: boolean;
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onRunCycle: () => void;
  onLaunchToken: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-zinc-500',
  running: 'bg-emerald-500 animate-pulse',
  paused: 'bg-amber-500',
  error: 'bg-red-500',
};

function useUptime(startedAt: string | null) {
  const [uptime, setUptime] = useState('0s');
  useEffect(() => {
    if (!startedAt) { setUptime('0s'); return; }
    const start = new Date(startedAt).getTime();
    const tick = () => {
      const secs = Math.floor((Date.now() - start) / 1000);
      if (secs < 60) setUptime(`${secs}s`);
      else if (secs < 3600) setUptime(`${Math.floor(secs / 60)}m ${secs % 60}s`);
      else setUptime(`${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return uptime;
}

export function Header({ state, demoMode, loading, running, onStart, onStop, onRunCycle, onLaunchToken }: HeaderProps) {
  const uptime = useUptime(state.startedAt);
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Flame className="w-8 h-8 text-orange-500" />
              {state.status === 'running' && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Bonfire Oracle</h1>
              <p className="text-xs text-zinc-500">Autonomous Intelligence Agent</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${running ? 'bg-emerald-500 animate-pulse' : STATUS_COLORS[state.status]}`} />
              <span className="text-sm text-zinc-400 capitalize">{running ? 'autonomous' : state.status}</span>
            </div>
            {state.currentCycle > 0 && (
              <span className="text-xs text-zinc-500 font-mono">Cycle #{state.currentCycle}</span>
            )}
            {running && state.startedAt && (
              <span className="text-xs text-emerald-400/70 font-mono">Uptime: {uptime}</span>
            )}
            {loading && (
              <span className="text-xs text-cyan-400/70 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                analyzing...
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!running ? (
              <button
                onClick={onStart}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Agent
              </button>
            ) : (
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}

            <button
              onClick={onRunCycle}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
              Run Cycle
            </button>

            {!state.tokenLaunched && (
              <button
                onClick={onLaunchToken}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Rocket className="w-4 h-4" />
                Launch Token
              </button>
            )}

            {state.tokenLaunched && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-900/30 text-orange-400 text-sm font-medium rounded-lg border border-orange-800/50">
                <Rocket className="w-4 h-4" />
                ${state.tokenSymbol}
              </span>
            )}
          </div>
        </div>

        {/* Demo Mode Warning */}
        {demoMode && (
          <div className="pb-2">
            <div className="bg-amber-950/50 border border-amber-900/50 rounded-lg px-3 py-2 text-sm text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>No API keys configured.</strong> Add your <code className="bg-amber-900/40 px-1 rounded">BANKR_API_KEY</code> to <code className="bg-amber-900/40 px-1 rounded">.env.local</code> for real onchain execution. Running with simulated data.
              </span>
            </div>
          </div>
        )}

        {/* Error Bar */}
        {state.error && (
          <div className="pb-2">
            <div className="bg-red-950/50 border border-red-900/50 rounded-lg px-3 py-2 text-sm text-red-400">
              {state.error}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
