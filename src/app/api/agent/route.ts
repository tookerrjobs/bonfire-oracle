import { NextRequest, NextResponse } from 'next/server';
import { agent } from '@/lib/agent/orchestrator';

function isAuthorized(req: NextRequest): boolean {
  const token = process.env.AGENT_API_TOKEN;
  if (!token) return true; // no token configured = auth disabled
  const authHeader = req.headers.get('Authorization');
  return authHeader === `Bearer ${token}`;
}

export async function GET() {
  return NextResponse.json({ ...agent.getState(), demoMode: agent.isDemoMode() });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action, config } = body;

  switch (action) {
    case 'start':
      await agent.start(config);
      return NextResponse.json({ ok: true, state: agent.getState() });

    case 'stop':
      agent.stop();
      return NextResponse.json({ ok: true, state: agent.getState() });

    case 'cycle': {
      // Rate limit: only allow 1 cycle per 45 seconds (shared across all visitors)
      const now = Date.now();
      const lastCycle = agent.getLastCycleTimestamp();
      if (lastCycle && now - lastCycle < 45000) {
        // Return cached state from last cycle — don't run again
        return NextResponse.json({ ok: true, state: agent.getState(), cached: true });
      }

      // 50s timeout to stay within Vercel's 60s limit
      const cyclePromise = agent.runSingleCycle();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cycle timed out after 50s')), 50000)
      );
      try {
        await Promise.race([cyclePromise, timeoutPromise]);
      } catch (err) {
        console.error('[API] Cycle error:', err);
      }
      return NextResponse.json({ ok: true, state: agent.getState() });
    }

    case 'config':
      agent.updateConfig(config);
      return NextResponse.json({ ok: true, config: agent.getConfig() });

    case 'launch-token':
      try {
        const result = await agent.launchAgentToken(
          body.tokenName || 'BonfireOracle',
          body.tokenSymbol || 'ORACLE'
        );
        return NextResponse.json({ ok: true, result, state: agent.getState() });
      } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
      }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// Debug: check env
export async function PUT() {
  const key = process.env.BANKR_API_KEY || 'NOT_SET';
  const hasKey = key.length > 10;
  return Response.json({ 
    hasKey, 
    keyPrefix: key.slice(0, 8) + '...', 
    keyLength: key.length 
  });
}
