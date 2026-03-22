import { MODELS, type ModelConfig } from './types';

const BANKR_API_KEY = process.env.BANKR_API_KEY || '';
if (!BANKR_API_KEY) {
  console.error('[BankrGateway] BANKR_API_KEY is not set — LLM calls will fail');
}

export interface LLMCallResult {
  text: string;
  model: string;
  role: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export async function callModel(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<LLMCallResult> {
  const config = MODELS[modelId];
  if (!config) throw new Error(`Unknown model: ${modelId}`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const start = Date.now();

      const res = await fetch('https://llm.bankr.bot/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BANKR_API_KEY,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 2048,
          max_completion_tokens: options?.maxTokens ?? 2048,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Bankr API ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const latencyMs = Date.now() - start;
      const text = data.choices?.[0]?.message?.content || '';
      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      const estimatedCost =
        inputTokens * config.costPerInputToken +
        outputTokens * config.costPerOutputToken;

      console.log(
        `[LLM] ${modelId} | ${inputTokens}in/${outputTokens}out | $${estimatedCost.toFixed(6)} | ${latencyMs}ms`
      );

      return {
        text,
        model: modelId,
        role: config.role,
        inputTokens,
        outputTokens,
        estimatedCost,
        latencyMs,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[LLM] ${modelId} attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`${modelId} call failed after ${MAX_RETRIES + 1} attempts`);
}

export async function getUsageSummary(days: number = 30) {
  const res = await fetch(`https://llm.bankr.bot/v1/usage?days=${days}`, {
    headers: { 'X-API-Key': process.env.BANKR_API_KEY! },
  });
  if (!res.ok) throw new Error(`Usage API error: ${res.status}`);
  return res.json();
}

export function getModelConfig(modelId: string): ModelConfig {
  const config = MODELS[modelId];
  if (!config) throw new Error(`Unknown model: ${modelId}`);
  return config;
}

export function getAllModels(): ModelConfig[] {
  return Object.values(MODELS);
}
