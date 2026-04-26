import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavItem {
  title: string
  href: string
}

interface UIState {
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  sidebarOpen: boolean
  searchOpen: boolean
  theme: 'light' | 'dark' | 'system'
  recentlyViewed: NavItem[]
  favorites: NavItem[]

  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setLeftSidebarCollapsed: (collapsed: boolean) => void
  setRightSidebarCollapsed: (collapsed: boolean) => void
  setSidebarOpen: (open: boolean) => void
  toggleSearch: () => void
  setSearchOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  addRecentlyViewed: (item: NavItem) => void
  toggleFavorite: (item: NavItem) => void
  isFavorite: (href: string) => boolean
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: true,
      sidebarOpen: false,
      searchOpen: false,
      theme: 'light',
      recentlyViewed: [],
      favorites: [],

      toggleLeftSidebar: () => set((s) => ({ leftSidebarCollapsed: !s.leftSidebarCollapsed })),
      toggleRightSidebar: () => set((s) => ({ rightSidebarCollapsed: !s.rightSidebarCollapsed })),
      setLeftSidebarCollapsed: (collapsed) => set({ leftSidebarCollapsed: collapsed }),
      setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setTheme: (theme) => set({ theme }),

      addRecentlyViewed: (item) =>
        set((s) => {
          const filtered = s.recentlyViewed.filter((r) => r.href !== item.href)
          return { recentlyViewed: [item, ...filtered].slice(0, 3) }
        }),

      toggleFavorite: (item) =>
        set((s) => {
          const exists = s.favorites.some((f) => f.href === item.href)
          return {
            favorites: exists
              ? s.favorites.filter((f) => f.href !== item.href)
              : [...s.favorites, item],
          }
        }),

      isFavorite: (href) => get().favorites.some((f) => f.href === href),
    }),
    {
      name: 'ui-store',
      partialState: (state: UIState) => ({
        recentlyViewed: state.recentlyViewed,
        favorites: state.favorites,
        theme: state.theme,
      }),
    } as any
  )
)
