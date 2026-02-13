import { TMDB_API_KEY } from 'src/consts';
import { Api } from './tmdb.v3.openapi';

export const TMDB_API = 'TMDB_API_V3';
export const TMDB_API_V4 = 'TMDB_API_V4';

export type TmdbApi = Api<object>;

type TmdbApiInterceptor = (
  methodName: string,
  originalFn: (...args: any[]) => any,
  ...args: any[]
) => any;

const RATE_LIMIT_PER_SECOND = 20;
const RATE_LIMIT_WINDOW_MS = 1000;
const RETRY_AFTER_DEFAULT_MS = 3000;
const MAX_RETRIES = 3;

const requestTimestamps: number[] = [];

function waitForSlot(): Promise<void> {
  const now = Date.now();
  // Remove timestamps older than the window
  while (
    requestTimestamps.length > 0 &&
    requestTimestamps[0]! <= now - RATE_LIMIT_WINDOW_MS
  ) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length < RATE_LIMIT_PER_SECOND) {
    requestTimestamps.push(now);
    return Promise.resolve();
  }

  // Wait until the oldest request in the window expires
  const oldestTimestamp = requestTimestamps[0]!;
  const delay = oldestTimestamp + RATE_LIMIT_WINDOW_MS - now;

  return new Promise((resolve) => {
    setTimeout(() => {
      // Recurse to re-check after the delay
      resolve(waitForSlot());
    }, delay);
  });
}

function getRetryAfterMs(error: any): number {
  const retryAfterHeader = error?.response?.headers?.['retry-after'];
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }
  }
  return RETRY_AFTER_DEFAULT_MS;
}

async function rateLimitedCall(
  methodName: string,
  originalFn: (...args: any[]) => any,
  ...args: any[]
): Promise<any> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForSlot();

    try {
      return await originalFn(...args);
    } catch (error: any) {
      if (error?.response?.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = getRetryAfterMs(error);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        continue;
      }
      throw error;
    }
  }
}

let tmdbApiInterceptor: TmdbApiInterceptor = rateLimitedCall;

export function setTmdbApiInterceptor(interceptor: TmdbApiInterceptor) {
  tmdbApiInterceptor = interceptor;
}

export const tmdbProviders = [
  {
    provide: TMDB_API,
    useFactory: async () => {
      const api = new Api({
        baseURL: 'https://api.themoviedb.org',
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });

      api.v3 = new Proxy(api.v3, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
          if (typeof value === 'function') {
            return (...args: any[]) =>
              tmdbApiInterceptor(String(prop), value.bind(target), ...args);
          }
          return value;
        },
      });

      return api;
    },
  },
];
