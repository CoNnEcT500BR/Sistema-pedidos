// Utility functions for API calls
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = {
  get: async (path: string) => {
    const response = await fetch(`${API_URL}${path}`)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },

  post: async (path: string, data: any) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },

  put: async (path: string, data: any) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },

  delete: async (path: string) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  },
}
