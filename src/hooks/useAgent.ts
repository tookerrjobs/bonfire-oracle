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

const CYCLE_INTERVAL_MS = 60000; // 60 seconds between auto-cycles

export function useAgent() {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doRunCycle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cycle' }),
      });
      const data = await res.json();
      if (data.state) {
        setState(prev => ({
          ...data.state,
          // Accumulate activity log across cycles (server loses state between calls)
          activityLog: [
            ...data.state.activityLog,
            ...prev.activityLog.filter((a: { id: string }) =>
              !data.state.activityLog.some((b: { id: string }) => b.id === a.id)
            ),
          ].slice(0, 50),
          // Accumulate economics
          economics: {
            ...data.state.economics,
            totalInferenceCost: prev.economics.totalInferenceCost + data.state.economics.totalInferenceCost,
            totalRevenue: prev.economics.totalRevenue + data.state.economics.totalRevenue,
            cyclesRun: prev.economics.cyclesRun + 1,
          },
        }));
        setDemoMode(data.state.demoMode || false);
      }
      return data;
    } catch (err) {
      console.error('Cycle error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback(() => {
    setRunning(true);
    setState(prev => ({ ...prev, status: 'running', startedAt: new Date().toISOString() }));
    // Run first cycle immediately
    doRunCycle();
    // Then schedule recurring cycles
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      doRunCycle();
    }, CYCLE_INTERVAL_MS);
  }, [doRunCycle]);

  const stop = useCallback(() => {
    setRunning(false);
    setState(prev => ({ ...prev, status: 'idle' }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const runCycle = useCallback(() => doRunCycle(), [doRunCycle]);

  const launchToken = useCallback(async (tokenName: string, tokenSymbol: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch-token', tokenName, tokenSymbol }),
      });
      const data = await res.json();
      if (data.state) setState(data.state);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/agent');
      if (res.ok) {
        const data = await res.json();
        if (data.demoMode !== undefined) setDemoMode(data.demoMode);
      }
    } catch {}
  }, []);

  // Fetch initial demoMode on mount
  useEffect(() => { fetchState(); }, [fetchState]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { state, demoMode, loading, running, start, stop, runCycle, launchToken, fetchState };
}
