import type { AgentPromptResponse, AgentJobResponse } from './types';

const AGENT_BASE_URL = 'https://api.bankr.bot';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

if (!process.env.BANKR_AGENT_API_KEY && !process.env.BANKR_API_KEY) {
  console.error('[BankrAgentAPI] Neither BANKR_AGENT_API_KEY nor BANKR_API_KEY is set — agent API calls will fail');
}

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.BANKR_AGENT_API_KEY || process.env.BANKR_API_KEY || '',
  };
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;

      const body = await res.text().catch(() => '');
      const err = new Error(`${label}: HTTP ${res.status} ${body.slice(0, 200)}`);

      if (res.status >= 500) {
        lastError = err;
        console.warn(`[Agent] ${label} attempt ${attempt + 1} server error, retrying...`);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
          continue;
        }
      }
      throw err;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith(label)) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Agent] ${label} attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`${label} failed after ${MAX_RETRIES + 1} attempts`);
}

export async function submitPrompt(prompt: string): Promise<AgentPromptResponse> {
  console.log(`[Agent] Submitting prompt: ${prompt.slice(0, 80)}...`);
  const res = await fetchWithRetry(
    `${AGENT_BASE_URL}/agent/prompt`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify({ prompt }) },
    'submitPrompt'
  );
  return res.json();
}

export async function pollJob(
  jobId: string,
  maxWaitMs: number = 90000,
  pollIntervalMs: number = 2000
): Promise<AgentJobResponse> {
  const deadline = Date.now() + maxWaitMs;
  let pollCount = 0;

  while (Date.now() < deadline) {
    const res = await fetch(`${AGENT_BASE_URL}/agent/job/${jobId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      console.warn(`[Agent] Job poll ${jobId} HTTP ${res.status}, retrying...`);
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      continue;
    }

    const job: AgentJobResponse = await res.json();
    pollCount++;

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      console.log(`[Agent] Job ${jobId} ${job.status} after ${pollCount} polls`);
      return job;
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error(`Job ${jobId} timed out after ${maxWaitMs}ms (${pollCount} polls)`);
}

export async function executePrompt(prompt: string): Promise<string> {
  const { jobId } = await submitPrompt(prompt);
  console.log(`[Agent] Job created: ${jobId}`);
  const result = await pollJob(jobId);

  if (result.status === 'failed') {
    throw new Error(`Job failed: ${result.response || 'unknown error'}`);
  }

  console.log(`[Agent] Job ${jobId} response: ${(result.response ?? '').slice(0, 100)}`);
  return result.response ?? '';
}

export async function getBalances(): Promise<string> {
  return executePrompt('what are my current token balances on base?');
}

export async function getTokenPrice(symbol: string): Promise<string> {
  return executePrompt(`what is the current price of ${symbol}?`);
}

export async function executeTrade(
  action: 'buy' | 'sell',
  amountUsd: number,
  token: string,
  chain: string = 'base'
): Promise<string> {
  const prompt = `${action} $${amountUsd.toFixed(2)} worth of ${token} on ${chain}`;
  console.log(`[Agent] Executing trade: ${prompt}`);
  return executePrompt(prompt);
}

export async function launchToken(name: string, symbol?: string): Promise<string> {
  const prompt = symbol
    ? `deploy a new token called ${name} with symbol ${symbol} on base`
    : `deploy a new token called ${name} on base`;
  console.log(`[Agent] Launching token: ${prompt}`);
  return executePrompt(prompt);
}

export async function claimFees(): Promise<string> {
  return executePrompt('claim all my available token trading fees');
}
