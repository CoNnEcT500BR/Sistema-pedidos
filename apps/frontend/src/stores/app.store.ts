import { create } from 'zustand'

interface AppStore {
  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // User
  user: any | null
  setUser: (user: any) => void
  logout: () => void

  // Theme (dark mode ready)
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // User
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),

  // Theme
  isDarkMode: false,
  toggleDarkMode: () =>
    set((state) => ({ isDarkMode: !state.isDarkMode })),
}))
