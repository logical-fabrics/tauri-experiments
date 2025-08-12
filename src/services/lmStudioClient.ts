import { LMStudioClient, LLM } from '@lmstudio/sdk';

// Re-export LLM type for use in components
export type { LLM } from '@lmstudio/sdk';

class LMStudioService {
  private client: LMStudioClient | null = null;
  private model: LLM | null = null;
  private currentModelId: string | null = null;

  async connect(): Promise<boolean> {
    try {
      // Initialize client - SDK supports browser environment
      this.client = new LMStudioClient({
        baseUrl: 'ws://localhost:1234'  // Use WebSocket for browser compatibility
      });
      console.log('Successfully connected to LM Studio!');
      return true;
    } catch (error: any) {
      console.error('Failed to connect to LM Studio:', error);
      throw new Error(this.getDetailedErrorMessage(error));
    }
  }

  async getAvailableModels(): Promise<LLM[]> {
    if (!this.client) {
      throw new Error('Not connected to LM Studio');
    }

    try {
      console.log('Fetching loaded models from LM Studio SDK...');
      
      // Get list of loaded models - returns LLM[]
      const loadedModels = await this.client.llm.listLoaded();
      console.log('Loaded models:', loadedModels);
      
      if (!loadedModels || loadedModels.length === 0) {
        console.log('No loaded models found');
        return [];
      }
      
      return loadedModels;
    } catch (error: any) {
      console.error('Failed to fetch models from LM Studio:', error);
      return [];
    }
  }

  async loadModel(modelId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to LM Studio');
    }

    try {
      // Load the specified model using SDK
      this.model = await this.client.llm.model(modelId);
      this.currentModelId = modelId;
      console.log(`Loaded model: ${modelId}`);
    } catch (error: any) {
      console.error(`Failed to load model ${modelId}:`, error);
      throw new Error(`Failed to load model: ${error.message}`);
    }
  }

  getCurrentModel(): string | null {
    return this.currentModelId;
  }

  private getDetailedErrorMessage(error: any): string {
    const baseMessage = 'Failed to connect to LM Studio. ';
    
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      return baseMessage + 
        'Please ensure:\n' +
        '1. LM Studio is running\n' +
        '2. The local server is enabled in LM Studio settings\n' +
        '3. The model "google/gemma-3n-e4b" is loaded';
    }
    
    if (error.message?.includes('model') || error.message?.includes('not found')) {
      return baseMessage + 'Model "google/gemma-3n-e4b" not found. Please load this model in LM Studio first.';
    }
    
    return baseMessage + (error.message || 'Unknown error occurred');
  }

  async streamChat(
    message: string,
    onChunk: (text: string) => void
  ): Promise<void> {
    if (!this.model) {
      throw new Error('No model loaded');
    }

    try {
      // Use SDK for streaming - respond returns an async iterable
      const prediction = this.model.respond([{
        role: 'user',
        content: message
      }], {
        temperature: 0.7,
        maxTokens: 2000
      });

      // Stream the response
      for await (const fragment of prediction) {
        if (fragment.content) {
          onChunk(fragment.content);
        }
      }
      
      // Wait for completion
      await prediction;
    } catch (error: any) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  async getResponse(message: string): Promise<string> {
    if (!this.model) {
      throw new Error('No model loaded');
    }

    try {
      // Use SDK for non-streaming response
      const result = await this.model.respond([{
        role: 'user',
        content: message
      }], {
        temperature: 0.7,
        maxTokens: 2000
      });
      return result.content;
    } catch (error: any) {
      console.error('Response error:', error);
      throw error;
    }
  }

  disconnect(): void {
    this.client = null;
    this.model = null;
    this.currentModelId = null;
  }

  isConnected(): boolean {
    return this.client !== null && this.model !== null;
  }
}

export default new LMStudioService();