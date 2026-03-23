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

const CYCLE_INTERVAL_MS = 45000; // 45 seconds between auto-cycles (balances LLM costs vs responsiveness)

export function useAgent() {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted economics from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bonfire_oracle_economics');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          economics: { ...prev.economics, ...parsed },
        }));
      }
    } catch {}
  }, []);

  const persistEconomics = useCallback((econ: typeof INITIAL_STATE.economics) => {
    try {
      localStorage.setItem('bonfire_oracle_economics', JSON.stringify({
        totalInferenceCost: econ.totalInferenceCost,
        totalRevenue: econ.totalRevenue,
        cyclesRun: econ.cyclesRun,
        decisionsExecuted: econ.decisionsExecuted,
      }));
    } catch {}
  }, []);

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
        setState(prev => {
          const newEconomics = {
            ...data.state.economics,
            totalInferenceCost: prev.economics.totalInferenceCost + data.state.economics.totalInferenceCost,
            totalRevenue: prev.economics.totalRevenue + data.state.economics.totalRevenue,
            cyclesRun: prev.economics.cyclesRun + 1,
          };
          persistEconomics(newEconomics);
          return {
            ...data.state,
            activityLog: [
              ...data.state.activityLog,
              ...prev.activityLog.filter((a: { id: string }) =>
                !data.state.activityLog.some((b: { id: string }) => b.id === a.id)
              ),
            ].slice(0, 50),
            economics: newEconomics,
          };
        });
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

  // Auto-start on mount — fully autonomous, no human intervention required
  useEffect(() => {
    fetchState();
    // Small delay to let the UI render first, then start autonomously
    const bootTimer = setTimeout(() => {
      start();
    }, 2000);
    return () => {
      clearTimeout(bootTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { state, demoMode, loading, running, start, stop, runCycle, launchToken, fetchState };
}
