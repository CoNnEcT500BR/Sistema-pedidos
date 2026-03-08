// Utility functions for API calls
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  get: async <TResponse = unknown>(path: string): Promise<TResponse> => {
    const response = await fetch(`${API_URL}${path}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json() as Promise<TResponse>;
  },

  post: async <TResponse = unknown, TBody = unknown>(
    path: string,
    data: TBody,
  ): Promise<TResponse> => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json() as Promise<TResponse>;
  },

  put: async <TResponse = unknown, TBody = unknown>(
    path: string,
    data: TBody,
  ): Promise<TResponse> => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json() as Promise<TResponse>;
  },

  delete: async <TResponse = unknown>(path: string): Promise<TResponse> => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json() as Promise<TResponse>;
  },
};
