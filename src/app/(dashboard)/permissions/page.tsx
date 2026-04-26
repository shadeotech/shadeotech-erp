'use client'

import { PermissionsPanel } from '@/components/permissions/PermissionsPanel'

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Staff Permissions Management</h2>
        <p className="text-sm text-muted-foreground">
          Grant granular permissions to staff members. Control which pages they can access.
        </p>
      </div>
      <PermissionsPanel />
    </div>
  )
}
