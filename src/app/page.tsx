'use client';

import { useAgent } from '@/hooks/useAgent';
import { Header } from '@/components/dashboard/header';
import { EconomicsPanel } from '@/components/dashboard/economics-panel';
import { DecisionFeed } from '@/components/dashboard/decision-feed';
import { ModelUsage } from '@/components/dashboard/model-usage';
import { FlywheelDiagram } from '@/components/dashboard/flywheel-diagram';
import { OnchainActivity } from '@/components/dashboard/onchain-activity';
import { BonfiresPanel } from '@/components/dashboard/bonfires-panel';
import { DollarSign, Cpu, RotateCw, Activity, ExternalLink, CheckCircle, Shield } from 'lucide-react';
import { formatUsd } from '@/lib/utils';

export default function Home() {
  const { state, demoMode, loading, running, start, stop, runCycle, launchToken } = useAgent();

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Header
        state={state}
        demoMode={demoMode}
        loading={loading}
        running={running}
        onStart={() => start()}
        onStop={stop}
        onRunCycle={runCycle}
        onLaunchToken={() => launchToken('BonfireOracle', 'ORACLE')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue */}
          <div className="glass-kpi rounded-xl p-5 fade-in fade-in-delay-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Revenue</span>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-emerald-400 revenue-glow font-mono tracking-tight">
              {formatUsd(state.economics.totalRevenue)}
            </div>
            <div className="text-xs text-zinc-600 mt-1">
              {formatUsd(state.economics.avgRevenuePerCycle)}/cycle
            </div>
          </div>

          {/* Inference Cost */}
          <div className="glass-kpi rounded-xl p-5 fade-in fade-in-delay-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Inference Cost</span>
            </div>
            <div className="text-2xl font-bold text-zinc-400 font-mono tracking-tight">
              {formatUsd(state.economics.totalInferenceCost)}
            </div>
            <div className="text-xs text-zinc-600 mt-1">
              {formatUsd(state.economics.avgCostPerCycle)}/cycle
            </div>
          </div>

          {/* Cycles Run */}
          <div className="glass-kpi rounded-xl p-5 fade-in fade-in-delay-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <RotateCw className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Cycles Run</span>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-zinc-200 font-mono tracking-tight">
              {state.economics.cyclesRun}
            </div>
            <div className="text-xs text-zinc-600 mt-1">
              {state.economics.decisionsExecuted} decisions
            </div>
          </div>

          {/* Agent Status */}
          <div className="glass-kpi rounded-xl p-5 fade-in fade-in-delay-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Agent Status</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${running ? 'bg-emerald-400 status-dot-glow' : 'bg-zinc-600'}`} />
              <span className={`text-2xl font-bold tracking-tight ${running ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {running ? 'Autonomous' : state.status === 'idle' ? 'Idle' : state.status}
              </span>
            </div>
            <div className="text-xs text-zinc-600 mt-1">
              {state.economics.selfSustaining ? 'Self-sustaining' : 'Building runway'}
            </div>
          </div>
        </div>

        {/* Verified On-Chain Results — always visible, links to verifiable proof */}
        <div className="glass-panel rounded-xl p-5 mb-8 fade-in fade-in-delay-2">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Verified On-Chain Results</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Live on Base</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue Proof */}
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-zinc-400 font-medium">Autonomous Revenue</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400 revenue-glow font-mono">$63+</div>
              <p className="text-[11px] text-zinc-500 mt-1">Trading fees earned autonomously from $ORACLE token swaps. Zero human intervention.</p>
              <a href="https://basescan.org/address/0x3ff0f48e048baa017885cb2e834830229c7e8e30" target="_blank" rel="noopener"
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 mt-2 transition-colors">
                Verify on Basescan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {/* Token Proof */}
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-zinc-400 font-medium">$ORACLE Token</span>
              </div>
              <div className="text-sm font-mono text-zinc-300 break-all">0xa67Cb7F2...14c8bA3</div>
              <p className="text-[11px] text-zinc-500 mt-1">ERC-20 token auto-launched by the agent on Base. Trading fees flow back to fund inference.</p>
              <a href="https://www.bankr.bot/launches/0xa67Cb7F225147e188D7D52f4EDC20fE6514c8bA3" target="_blank" rel="noopener"
                className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 mt-2 transition-colors">
                View on Bankr <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {/* Architecture Proof */}
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-400 font-medium">3-Model AI Committee</span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Gemini · Scanner</span>
                <span className="text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">GPT · Quant</span>
                <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Claude · Thesis</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">Cost-optimized pipeline via Bankr LLM Gateway. Cheap Gemini filters first, expensive Claude only on high-confidence signals.</p>
              <a href="https://github.com/tookerrjobs/bonfire-oracle" target="_blank" rel="noopener"
                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                View Source <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Onchain Proof + Bonfires + Economics + Flywheel */}
          <div className="lg:col-span-1 space-y-6">
            <OnchainActivity state={state} />
            <BonfiresPanel state={state} />
            <EconomicsPanel economics={state.economics} />
            <FlywheelDiagram state={state} />
          </div>

          {/* Right column: Decision Feed + Model Usage */}
          <div className="lg:col-span-2 space-y-6">
            <ModelUsage economics={state.economics} />
            <DecisionFeed decisions={state.decisions} />
          </div>
        </div>
      </main>
    </div>
  );
}
