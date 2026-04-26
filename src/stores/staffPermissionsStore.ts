import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StaffPermissions } from '@/lib/permissions'
import { defaultStaffPermissions } from '@/lib/permissions'

interface StaffPermissionsState {
  permissions: Record<string, StaffPermissions>
  setPermissions: (userId: string, permissions: StaffPermissions) => void
  getPermissions: (userId: string) => StaffPermissions
}

export const useStaffPermissionsStore = create<StaffPermissionsState>()(
  persist(
    (set, get) => ({
      permissions: {},
      
      setPermissions: (userId, permissions) => set((state) => ({
        permissions: {
          ...state.permissions,
          [userId]: permissions,
        },
      })),
      
      getPermissions: (userId) => {
        const state = get()
        return state.permissions[userId] || defaultStaffPermissions
      },
    }),
    {
      name: 'staff-permissions-storage',
    }
  )
)

