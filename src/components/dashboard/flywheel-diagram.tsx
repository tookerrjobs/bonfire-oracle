'use client';

import { useState, useEffect } from 'react';
import { Flame, Brain, Wallet, Coins, ArrowRight } from 'lucide-react';
import type { AgentState } from '@/lib/agent/types';

interface FlywheelDiagramProps {
  state: AgentState;
}

export function FlywheelDiagram({ state }: FlywheelDiagramProps) {
  const isRunning = state.status === 'running';

  // Always animate the flywheel — shows the concept even on first visit
  const [activeStep, setActiveStep] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-xl p-5 fade-in">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
        Autonomous Flywheel
      </h2>

      <div className="relative">
        {/* Circular flywheel visualization */}
        <div className="relative w-full aspect-square max-w-[280px] mx-auto">
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
            active={true}
            color="orange"
          />
          <FlywheelNode
            icon={<Brain className="w-4 h-4" />}
            label="LLM Gateway"
            sub="Multi-Model AI"
            position="right"
            active={true}
            color="violet"
          />
          <FlywheelNode
            icon={<Wallet className="w-4 h-4" />}
            label="Bankr Wallet"
            sub="Onchain Execution"
            position="bottom"
            active={true}
            color="blue"
          />
          <FlywheelNode
            icon={<Coins className="w-4 h-4" />}
            label="Token Fees"
            sub="Self-Funding"
            position="left"
            active={true}
            color="emerald"
          />
        </div>

        {/* Flow arrows (animated when running) */}
        <div className="absolute inset-0 pointer-events-none">
          <FlowArrow from="top" to="right" active={true} highlight={activeStep === 1} />
          <FlowArrow from="right" to="bottom" active={true} highlight={activeStep === 2} />
          <FlowArrow from="bottom" to="left" active={true} highlight={activeStep === 3} />
          <FlowArrow from="left" to="top" active={true} highlight={activeStep === 4} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-800 space-y-1.5">
        <FlowStep num={1} text="Bonfires surfaces community alpha" active={true} highlighted={activeStep === 1} />
        <FlowStep num={2} text="3 LLMs analyze via Bankr Gateway" active={true} highlighted={activeStep === 2} />
        <FlowStep num={3} text="Bankr wallet executes onchain" active={true} highlighted={activeStep === 3} />
        <FlowStep num={4} text="Token fees fund next inference cycle" active={true} highlighted={activeStep === 4} />
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

function FlowArrow({ from, to, active, highlight }: { from: string; to: string; active: boolean; highlight: boolean }) {
  // Position arrows between nodes
  const arrowPositions: Record<string, { top: string; left: string; rotate: string }> = {
    'top-right': { top: '18%', left: '72%', rotate: 'rotate(45deg)' },
    'right-bottom': { top: '72%', left: '72%', rotate: 'rotate(135deg)' },
    'bottom-left': { top: '72%', left: '18%', rotate: 'rotate(225deg)' },
    'left-top': { top: '18%', left: '18%', rotate: 'rotate(315deg)' },
  };

  const key = `${from}-${to}`;
  const pos = arrowPositions[key];
  if (!pos) return null;

  return (
    <div
      className={`absolute w-6 h-6 flex items-center justify-center transition-all duration-500 ${
        highlight ? 'flow-arrow-active scale-125' : active ? 'opacity-40' : 'opacity-20'
      }`}
      style={{
        top: pos.top,
        left: pos.left,
        transform: `translate(-50%, -50%) ${pos.rotate}`,
      }}
    >
      <ArrowRight className={`w-4 h-4 ${highlight ? 'text-orange-400' : active ? 'text-zinc-500' : 'text-zinc-700'}`} />
    </div>
  );
}

function FlowStep({ num, text, active, highlighted }: { num: number; text: string; active: boolean; highlighted: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-0.5 px-1 rounded transition-all duration-300 ${highlighted ? 'flow-step-highlight' : ''}`}>
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
          highlighted
            ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
            : active
            ? 'bg-orange-900/50 text-orange-400 border border-orange-800/50'
            : 'bg-zinc-800 text-zinc-500'
        }`}
      >
        {num}
      </span>
      <span className={`text-xs transition-colors duration-300 ${highlighted ? 'text-orange-300 font-medium' : active ? 'text-zinc-300' : 'text-zinc-600'}`}>
        {text}
      </span>
    </div>
  );
}
