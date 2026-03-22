import type { InferenceCostEntry, RevenueEntry, EconomicsSnapshot } from './types';

class EconomicsTracker {
  private costs: InferenceCostEntry[] = [];
  private revenues: RevenueEntry[] = [];
  private cyclesRun = 0;
  private decisionsExecuted = 0;

  recordCost(entry: InferenceCostEntry) {
    this.costs.push(entry);
  }

  recordRevenue(entry: RevenueEntry) {
    this.revenues.push(entry);
  }

  recordCycle() {
    this.cyclesRun++;
  }

  recordExecution() {
    this.decisionsExecuted++;
  }

  recordDecisionCosts(
    decisionId: string,
    modelCalls: Array<{ model: string; role: string; inputTokens: number; outputTokens: number; cost: number }>
  ) {
    for (const call of modelCalls) {
      this.recordCost({
        timestamp: new Date().toISOString(),
        model: call.model,
        role: call.role,
        inputTokens: call.inputTokens,
        outputTokens: call.outputTokens,
        cost: call.cost,
        decisionId,
      });
    }
  }

  getSnapshot(): EconomicsSnapshot {
    const totalInferenceCost = this.costs.reduce((s, c) => s + c.cost, 0);
    const totalRevenue = this.revenues.reduce((s, r) => s + r.amount, 0);
    const netPnl = totalRevenue - totalInferenceCost;
    const roi = totalInferenceCost > 0 ? (netPnl / totalInferenceCost) * 100 : 0;

    const costBreakdown: Record<string, number> = {};
    for (const c of this.costs) {
      costBreakdown[c.model] = (costBreakdown[c.model] || 0) + c.cost;
    }

    const revenueBreakdown: Record<string, number> = {};
    for (const r of this.revenues) {
      revenueBreakdown[r.source] = (revenueBreakdown[r.source] || 0) + r.amount;
    }

    const avgCostPerCycle = this.cyclesRun > 0 ? totalInferenceCost / this.cyclesRun : 0;
    const avgRevenuePerCycle = this.cyclesRun > 0 ? totalRevenue / this.cyclesRun : 0;
    const selfSustaining = totalRevenue >= totalInferenceCost && this.cyclesRun > 0;
    const runwayCycles =
      avgCostPerCycle > 0 && avgRevenuePerCycle > avgCostPerCycle
        ? Infinity
        : avgCostPerCycle > 0
          ? Math.max(0, Math.floor((totalRevenue - totalInferenceCost) / avgCostPerCycle))
          : 0;

    return {
      totalInferenceCost,
      totalRevenue,
      netPnl,
      roi,
      costBreakdown,
      revenueBreakdown,
      cyclesRun: this.cyclesRun,
      decisionsExecuted: this.decisionsExecuted,
      avgCostPerCycle,
      avgRevenuePerCycle,
      selfSustaining,
      runwayCycles: runwayCycles === Infinity ? 9999 : runwayCycles,
    };
  }

  getCosts(): InferenceCostEntry[] {
    return [...this.costs];
  }

  getRevenues(): RevenueEntry[] {
    return [...this.revenues];
  }

  getRecentCosts(n: number = 20): InferenceCostEntry[] {
    return this.costs.slice(-n);
  }

  getRecentRevenues(n: number = 20): RevenueEntry[] {
    return this.revenues.slice(-n);
  }

  reset() {
    this.costs = [];
    this.revenues = [];
    this.cyclesRun = 0;
    this.decisionsExecuted = 0;
  }
}

export const economics = new EconomicsTracker();
