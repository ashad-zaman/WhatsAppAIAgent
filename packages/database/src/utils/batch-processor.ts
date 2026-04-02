export interface BatchOptions {
  concurrency?: number;
  maxBatchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}

export interface BatchResult<T> {
  results: T[];
  errors: Array<{ index: number; error: Error }>;
  duration: number;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

export interface QueueItem<T> {
  id: string;
  data: T;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: Error;
}

export class BatchProcessor<T, R> {
  private queue: QueueItem<T>[] = [];
  private results: Map<string, R> = new Map();
  private errors: Map<string, Error> = new Map();
  private options: Required<BatchOptions>;
  private isProcessing: boolean = false;
  private abortController: AbortController | null = null;

  constructor(options: BatchOptions = {}) {
    this.options = {
      concurrency: options.concurrency || 5,
      maxBatchSize: options.maxBatchSize || 100,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      onProgress: options.onProgress || (() => {}),
      signal: options.signal || undefined as AbortSignal | undefined,
    };

    if (this.options.signal) {
      this.options.signal.addEventListener('abort', () => {
        this.abort();
      });
    }
  }

  add(id: string, data: T): void {
    if (this.queue.length >= this.options.maxBatchSize) {
      throw new Error(`Batch queue is full. Max size: ${this.options.maxBatchSize}`);
    }

    this.queue.push({
      id,
      data,
      retries: 0,
      status: 'pending',
    });
  }

  async process(processorFn: (item: T, id: string) => Promise<R>): Promise<BatchResult<R>> {
    if (this.isProcessing) {
      throw new Error('Batch processor is already processing');
    }

    this.isProcessing = true;
    this.abortController = new AbortController();
    const startTime = Date.now();

    try {
      const batches = this.chunkArray(this.queue, this.options.concurrency);
      let processed = 0;

      for (const batch of batches) {
        if (this.abortController.signal.aborted) {
          break;
        }

        await Promise.all(
          batch.map(async (item) => {
            try {
              const result = await this.processWithRetry(
                () => processorFn(item.data, item.id),
                item
              );
              this.results.set(item.id, result);
              item.status = 'completed';
            } catch (error) {
              this.errors.set(item.id, error as Error);
              item.status = 'failed';
            }
          })
        );

        processed += batch.length;
        this.options.onProgress(processed, this.queue.length);
      }

      const duration = Date.now() - startTime;
      const resultsArray = Array.from(this.results.values());
      const errorsArray = Array.from(this.errors.entries()).map(([id, error]) => {
        const index = this.queue.findIndex(item => item.id === id);
        return { index, error };
      });

      return {
        results: resultsArray,
        errors: errorsArray,
        duration,
        totalProcessed: this.queue.length,
        successCount: this.results.size,
        errorCount: this.errors.size,
      };
    } finally {
      this.isProcessing = false;
      this.clear();
    }
  }

  private async processWithRetry<T>(
    fn: () => Promise<T>,
    item: QueueItem<unknown>
  ): Promise<T> {
    while (item.retries < this.options.retryAttempts) {
      try {
        return await fn();
      } catch (error) {
        item.retries++;
        if (item.retries < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * item.retries);
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  clear(): void {
    this.queue = [];
    this.results.clear();
    this.errors.clear();
  }

  get pendingCount(): number {
    return this.queue.filter(item => item.status === 'pending').length;
  }

  get processingCount(): number {
    return this.queue.filter(item => item.status === 'processing').length;
  }

  get completedCount(): number {
    return this.queue.filter(item => item.status === 'completed').length;
  }

  get failedCount(): number {
    return this.queue.filter(item => item.status === 'failed').length;
  }
}

export async function batchProcess<T, R>(
  items: T[],
  processorFn: (item: T) => Promise<R>,
  options: BatchOptions = {}
): Promise<BatchResult<R>> {
  const processor = new BatchProcessor<T, R>(options);
  
  items.forEach((item, index) => {
    processor.add(String(index), item);
  });

  return processor.process((data) => processorFn(data));
}

export function createBatchProcessor<T, R>(
  processorFn: (item: T) => Promise<R>,
  options?: BatchOptions
): {
  add: (id: string, data: T) => void;
  process: () => Promise<BatchResult<R>>;
  abort: () => void;
  clear: () => void;
  pendingCount: number;
} {
  const processor = new BatchProcessor<T, R>(options);
  
  return {
    add: (id: string, data: T) => processor.add(id, data),
    process: () => processor.process(processorFn),
    abort: () => processor.abort(),
    clear: () => processor.clear(),
    get pendingCount() { return processor.pendingCount; },
  };
}
