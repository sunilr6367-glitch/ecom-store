export function getServerApiUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  );
}

export function getApiBaseUrl(): string {
  return globalThis.window === undefined ? getServerApiUrl() : '/api';
}
