import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { MODELS, type ModelConfig } from './types';

if (!process.env.BANKR_API_KEY) {
  console.error('[BankrGateway] BANKR_API_KEY is not set — LLM calls will fail');
}

function createLLM() {
  return createOpenAICompatible({
    name: 'bankr',
    baseURL: 'https://llm.bankr.bot/v1',
    headers: {
      'X-API-Key': process.env.BANKR_API_KEY || '',
    },
  });
}

let _llm: ReturnType<typeof createOpenAICompatible> | null = null;
function getLLM() {
  if (!_llm) _llm = createLLM();
  return _llm;
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

      const { text, usage } = await generateText({
        model: getLLM()(modelId),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
      });

      const latencyMs = Date.now() - start;
      const inputTokens = usage?.inputTokens ?? 0;
      const outputTokens = usage?.outputTokens ?? 0;
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
