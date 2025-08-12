import { LMStudioClient } from '@lmstudio/sdk';

export interface ModelInfo {
  path: string;
  identifier: string;
  name?: string;
}

class LMStudioService {
  private client: LMStudioClient | null = null;
  private model: any = null;
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

  async getAvailableModels(): Promise<ModelInfo[]> {
    if (!this.client) {
      throw new Error('Not connected to LM Studio');
    }

    try {
      console.log('Fetching loaded models from LM Studio SDK...');
      
      // Get list of loaded models
      const loadedModels = await this.client.llm.listLoaded();
      console.log('Loaded models:', loadedModels);
      
      if (!loadedModels || loadedModels.length === 0) {
        console.log('No loaded models found');
        return [];
      }
      
      // Process loaded models
      const models: ModelInfo[] = [];
      for (const model of loadedModels) {
        // Get model info
        let modelInfo: ModelInfo;
        
        if (typeof model === 'string') {
          modelInfo = {
            path: model,
            identifier: model,
            name: model.split('/').pop() || model
          };
        } else if (model && typeof model === 'object') {
          // Try to get model info
          const info = await model.getInfo?.();
          modelInfo = {
            path: info?.modelKey || model.modelKey || model.id || 'unknown',
            identifier: info?.modelKey || model.modelKey || model.id || 'unknown',
            name: info?.displayName || model.displayName || model.name || 'unknown'
          };
        } else {
          continue;
        }
        
        models.push(modelInfo);
        console.log('Added model:', modelInfo);
      }
      
      return models;
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
      // Use SDK for streaming
      const stream = this.model.respond(message, {
        stream: true,
        temperature: 0.7,
        maxTokens: 2000
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          onChunk(chunk.content);
        }
      }
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
      const result = await this.model.respond(message, {
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