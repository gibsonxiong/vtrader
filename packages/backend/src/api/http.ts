export interface HttpClient {
  post<T>(url: string, data?: unknown): Promise<T>;
  get<T>(url: string, params?: unknown): Promise<T>;
}

let _http: HttpClient | null = null;

export function configure(http: HttpClient) {
  _http = http;
}

export function getHttp(): HttpClient {
  if (!_http) throw new Error('API client not configured. Call configure() first.');
  return _http;
}
