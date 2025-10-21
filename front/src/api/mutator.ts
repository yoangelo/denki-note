// 共通HTTPクライアント（React Query用のmutator）
// - Base URLは .env の VITE_API_ORIGIN
// - JSON / エラー処理 / 認証ヘッダ（必要になれば差し込み）
// - 将来Auth0導入時はここでBearerトークン付与

export type HttpClientOptions = {
  url: string;
  method?: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  data?: any; // body
  signal?: AbortSignal;
};

const BASE_URL = import.meta.env.VITE_API_ORIGIN || '';

const toQuery = (params?: Record<string, any>) => {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
};

export const httpClient = async <TData = unknown>({
  url,
  method = 'GET',
  params,
  headers = {},
  data,
  signal,
}: HttpClientOptions): Promise<TData> => {
  const res = await fetch(`${BASE_URL}${url}${toQuery(params)}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}`, // Auth0 等を入れるならここ
      ...headers,
    },
    body: data != null ? JSON.stringify(data) : undefined,
    signal,
    credentials: 'include', // 必要に応じて
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    // OpenAPIFirst のエラーもJSONになる想定
    const err = new Error(
      `HTTP ${res.status} ${res.statusText} - ${isJson ? JSON.stringify(payload) : payload}`
    );
    throw err;
  }
  return payload as TData;
};
