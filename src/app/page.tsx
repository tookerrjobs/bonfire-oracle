'use client';

import { useAgent } from '@/hooks/useAgent';
import { Header } from '@/components/dashboard/header';
import { EconomicsPanel } from '@/components/dashboard/economics-panel';
import { DecisionFeed } from '@/components/dashboard/decision-feed';
import { ModelUsage } from '@/components/dashboard/model-usage';
import { FlywheelDiagram } from '@/components/dashboard/flywheel-diagram';
import { OnchainActivity } from '@/components/dashboard/onchain-activity';
import { BonfiresPanel } from '@/components/dashboard/bonfires-panel';

export default function Home() {
  const { state, demoMode, loading, start, stop, runCycle, launchToken } = useAgent();

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Header
        state={state}
        demoMode={demoMode}
        loading={loading}
        onStart={() => start()}
        onStop={stop}
        onRunCycle={runCycle}
        onLaunchToken={() => launchToken('BonfireOracle', 'ORACLE')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
