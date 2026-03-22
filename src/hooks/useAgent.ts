'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AgentState } from '@/lib/agent/types';

const INITIAL_STATE: AgentState = {
  status: 'idle',
  currentCycle: 0,
  lastCycleAt: null,
  nextCycleAt: null,
  decisions: [],
  economics: {
    totalInferenceCost: 0,
    totalRevenue: 0,
    netPnl: 0,
    roi: 0,
    costBreakdown: {},
    revenueBreakdown: {},
    cyclesRun: 0,
    decisionsExecuted: 0,
    avgCostPerCycle: 0,
    avgRevenuePerCycle: 0,
    selfSustaining: false,
    runwayCycles: 0,
  },
  error: null,
  startedAt: null,
  tokenLaunched: false,
  tokenName: null,
  tokenSymbol: null,
  wallet: {
    balanceRaw: 'unknown',
    lastCheckedAt: null,
    totalFeesClaimed: 0,
    totalTradeVolume: 0,
    inferenceSpend: 0,
  },
  activityLog: [],
  bonfiresReputation: { accuracy: 0, totalPredictions: 0, communityTrust: 0.5 },
};

export function useAgent() {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial state once on mount
  useEffect(() => { fetchState(); }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/agent');
      if (res.ok) {
        const data = await res.json();
        if (data.demoMode !== undefined) setDemoMode(data.demoMode);
        // Only update if the server has newer data (more cycles run)
        // This prevents serverless cold starts from wiping client state
        if (data.currentCycle > 0 && data.currentCycle >= (state?.currentCycle || 0)) {
          setState(data);
        }
      }
    } catch {}
  }, [state?.currentCycle]);

  const sendAction = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      setLoading(true);
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...extra }),
        });
        const data = await res.json();
        // The POST response has the authoritative state from the cycle that just ran
        if (data.state) {
          setState(data.state);
          setDemoMode(data.state.demoMode || false);
        } else if (data.currentCycle) {
          setState(data);
        }
        return data;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const start = useCallback(
    (config?: Record<string, unknown>) => sendAction('start', { config }),
    [sendAction]
  );
  const stop = useCallback(() => sendAction('stop'), [sendAction]);
  const runCycle = useCallback(() => sendAction('cycle'), [sendAction]);
  const launchToken = useCallback(
    (tokenName: string, tokenSymbol: string) =>
      sendAction('launch-token', { tokenName, tokenSymbol }),
    [sendAction]
  );

  // Fetch initial state (includes demoMode)
  useEffect(() => { fetchState(); }, [fetchState]);

  return { state, demoMode, loading, start, stop, runCycle, launchToken, fetchState };
}
