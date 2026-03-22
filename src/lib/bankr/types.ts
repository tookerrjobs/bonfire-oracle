export interface BankrConfig {
  apiKey: string;
  agentApiKey: string;
  llmBaseUrl: string;
  agentBaseUrl: string;
}

export interface ModelConfig {
  id: string;
  provider: string;
  role: 'scanner' | 'quantitative' | 'synthesizer' | 'fallback';
  costPerInputToken: number;
  costPerOutputToken: number;
}

export const MODELS: Record<string, ModelConfig> = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'google',
    role: 'scanner',
    costPerInputToken: 0.000000075,
    costPerOutputToken: 0.0000003,
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    provider: 'openai',
    role: 'quantitative',
    costPerInputToken: 0.0000004,
    costPerOutputToken: 0.0000016,
  },
  'claude-sonnet-4.6': {
    id: 'claude-sonnet-4.6',
    provider: 'anthropic',
    role: 'synthesizer',
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
  },
};

export interface AgentPromptResponse {
  success: boolean;
  jobId: string;
  threadId: string;
  status: string;
  message: string;
}

export interface AgentJobResponse {
  success: boolean;
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  prompt: string;
  response?: string;
  createdAt: string;
  completedAt?: string;
  processingTime?: number;
}

export interface UsageSummary {
  object: string;
  days: number;
  totals: {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
  };
  byModel: Array<{
    model: string;
    provider: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  }>;
}
