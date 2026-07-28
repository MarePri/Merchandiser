/**
 * HTTP Fetcher with rate limiting and retry logic.
 * Isolated from the rest of the app — only responsible for making HTTP requests.
 */
import type { ScraperConfig } from './config';

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with rate limiting, retries, and configurable headers.
 */
export async function fetchWithRateLimit(
  url: string,
  config: ScraperConfig,
  retries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: config.headers,
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries) {
        // Exponential backoff: 1s, 2s
        await sleep(1000 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Fetch and parse JSON with rate limiting.
 */
export async function fetchJson<T>(
  url: string,
  config: ScraperConfig,
  retries?: number
): Promise<T> {
  const response = await fetchWithRateLimit(url, config, retries);
  return response.json() as Promise<T>;
}
