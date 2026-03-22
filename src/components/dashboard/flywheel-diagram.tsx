'use client';

import { Flame, Brain, Wallet, Coins, ArrowRight } from 'lucide-react';
import type { AgentState } from '@/lib/agent/types';

interface FlywheelDiagramProps {
  state: AgentState;
}

export function FlywheelDiagram({ state }: FlywheelDiagramProps) {
  const isRunning = state.status === 'running';

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
        Autonomous Flywheel
      </h2>

      <div className="relative">
        {/* Circular flywheel visualization */}
        <div className={`relative w-full aspect-square max-w-[280px] mx-auto ${isRunning ? 'animate-[spin_20s_linear_infinite]' : ''}`}>
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-950/50 border border-orange-800/50 flex items-center justify-center">
              <Flame className={`w-7 h-7 ${isRunning ? 'text-orange-400 animate-pulse' : 'text-orange-700'}`} />
            </div>
          </div>

          {/* Nodes positioned around the circle */}
          <FlywheelNode
            icon={<Flame className="w-4 h-4" />}
            label="Bonfires"
            sub="Community Intel"
            position="top"
            active={isRunning}
            color="orange"
          />
          <FlywheelNode
            icon={<Brain className="w-4 h-4" />}
            label="LLM Gateway"
            sub="Multi-Model AI"
            position="right"
            active={isRunning}
            color="violet"
          />
          <FlywheelNode
            icon={<Wallet className="w-4 h-4" />}
            label="Bankr Wallet"
            sub="Onchain Execution"
            position="bottom"
            active={isRunning}
            color="blue"
          />
          <FlywheelNode
            icon={<Coins className="w-4 h-4" />}
            label="Token Fees"
            sub="Self-Funding"
            position="left"
            active={isRunning}
            color="emerald"
          />
        </div>

        {/* Flow arrows (static, don't spin) */}
        <div className="absolute inset-0 pointer-events-none">
          <FlowArrow from="top" to="right" active={isRunning} />
          <FlowArrow from="right" to="bottom" active={isRunning} />
          <FlowArrow from="bottom" to="left" active={isRunning} />
          <FlowArrow from="left" to="top" active={isRunning} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-800 space-y-1.5">
        <FlowStep num={1} text="Bonfires surfaces community alpha" active={isRunning} />
        <FlowStep num={2} text="3 LLMs analyze via Bankr Gateway" active={isRunning} />
        <FlowStep num={3} text="Bankr wallet executes onchain" active={isRunning} />
        <FlowStep num={4} text="Token fees fund next inference cycle" active={isRunning} />
      </div>
    </div>
  );
}

function FlywheelNode({
  icon,
  label,
  sub,
  position,
  active,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  active: boolean;
  color: string;
}) {
  const positions: Record<string, string> = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    right: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    left: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2',
  };

  const colorMap: Record<string, string> = {
    orange: active ? 'border-orange-700 bg-orange-950/50 text-orange-400' : 'border-zinc-800 bg-zinc-950 text-zinc-600',
    violet: active ? 'border-violet-700 bg-violet-950/50 text-violet-400' : 'border-zinc-800 bg-zinc-950 text-zinc-600',
    blue: active ? 'border-blue-700 bg-blue-950/50 text-blue-400' : 'border-zinc-800 bg-zinc-950 text-zinc-600',
    emerald: active ? 'border-emerald-700 bg-emerald-950/50 text-emerald-400' : 'border-zinc-800 bg-zinc-950 text-zinc-600',
  };

  return (
    <div className={`absolute ${positions[position]} z-10`}>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${colorMap[color]}`}>
        {icon}
        <div>
          <div className="font-semibold whitespace-nowrap">{label}</div>
          <div className="text-[10px] opacity-60 whitespace-nowrap">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function FlowArrow({ from, to, active }: { from: string; to: string; active: boolean }) {
  return null; // CSS arrows are complex; the legend below serves the purpose
}

function FlowStep({ num, text, active }: { num: number; text: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
          active ? 'bg-orange-900/50 text-orange-400 border border-orange-800/50' : 'bg-zinc-800 text-zinc-500'
        }`}
      >
        {num}
      </span>
      <span className={`text-xs ${active ? 'text-zinc-300' : 'text-zinc-600'}`}>{text}</span>
    </div>
  );
}
