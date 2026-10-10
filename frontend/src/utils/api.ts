// Configurable API base URL: prioritized by VITE_API_BASE_URL, fallback to VITE_BACKEND_URL
const rawBase: string =
  ((import.meta as any).env?.VITE_API_BASE_URL as string) ||
  ((import.meta as any).env?.VITE_BACKEND_URL as string) ||
  '';

export const API_BASE = rawBase.replace(/\/+$/, '');

if ((import.meta as any).env?.PROD && !API_BASE) {
  console.warn(
    '[FlowFetch] VITE_API_BASE_URL is not set. API calls will use relative paths.'
  );
}

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};

export interface NormalizedFormat {
  id: string;
  type: 'video+audio' | 'video' | 'audio';
  resolution: string;
  ext: string;
  videoFormatId?: string;
  audioFormatId?: string;
  filesize?: number;
  fps?: number;
  note?: string;
}

export interface Metadata {
  analysisId: string;
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  site: string;
  description?: string;
  age_limit?: number;
  formats: NormalizedFormat[];
}

export const analyzeUrl = async (url: string): Promise<Metadata> => {
  const res = await fetch(getApiUrl('/api/analyze'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to analyze URL');
  }

  return data.data;
};

export const startDownload = async (
  analysisId: string,
  formatId: string
): Promise<{ jobId: string; streamMode: string }> => {
  const res = await fetch(getApiUrl('/api/download'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, formatId })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to start download');
  }

  return { jobId: data.jobId, streamMode: data.streamMode };
};

export const getDownloadUrl = (jobId: string): string => {
  return `${API_BASE}/api/download/${jobId}`;
};

export const getProgressUrl = (jobId: string): string => {
  return `${API_BASE}/api/progress/${jobId}`;
};