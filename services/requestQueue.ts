/**
 * Request queue to prevent rate limiting
 * Ensures only one AI request is processed at a time with delays
 */

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly MIN_DELAY_MS = 2000; // 2 seconds between requests

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Wait if we made a request recently
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_DELAY_MS) {
        const delay = this.MIN_DELAY_MS - timeSinceLastRequest;
        console.log(`⏳ Rate limit protection: waiting ${delay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const request = this.queue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

export const aiRequestQueue = new RequestQueue();
