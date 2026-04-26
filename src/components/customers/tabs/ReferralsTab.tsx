'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, ArrowRight, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { getInitials } from '@/lib/utils'

interface Referral {
  id: string
  name: string
  sideMark: string
  status: string
  type: string
  createdAt: Date
  purchasedAt?: Date
}

// Mock referrals
const mockReferrals: Referral[] = [
  {
    id: '1',
    name: 'Sarah Williams',
    sideMark: 'SH-RRF67890',
    status: 'BOUGHT',
    type: 'RESIDENTIAL',
    createdAt: new Date('2024-01-20'),
    purchasedAt: new Date('2025-01-10'),
  },
  {
    id: '2',
    name: 'Tech Solutions Inc',
    sideMark: 'SH-CRF78901',
    status: 'QUALIFIED',
    type: 'COMMERCIAL',
    createdAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    name: 'Michael Johnson',
    sideMark: 'SH-RRF78902',
    status: 'BOUGHT',
    type: 'RESIDENTIAL',
    createdAt: new Date('2024-12-15'),
    purchasedAt: new Date('2025-01-05'),
  },
]

const statusStyles: Record<string, string> = {
  LEAD: 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  CONTACTED: 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  QUALIFIED: 'bg-purple-500/10 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  CUSTOMER: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  BOUGHT: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  INACTIVE: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

interface ReferralsTabProps {
  customerId: string
}

export function ReferralsTab({ customerId }: ReferralsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Referrals ({mockReferrals.length})</h3>
          <p className="text-sm text-muted-foreground">
            Customers referred by this contact
          </p>
        </div>
      </div>

      {mockReferrals.length > 0 ? (
        <div className="space-y-2">
          {mockReferrals.map((referral) => (
            <Link
              key={referral.id}
              href={`/customers/${referral.id}`}
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <Avatar>
                <AvatarFallback>
                  {getInitials(referral.name.split(' ')[0], referral.name.split(' ')[1])}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{referral.name}</p>
                <p className="text-sm text-muted-foreground">
                  {referral.sideMark} • {referral.type}
                  {referral.purchasedAt && (
                    <span className="ml-2">• Purchased {format(referral.purchasedAt, 'MMM dd, yyyy')}</span>
                  )}
                </p>
              </div>
              <Badge variant="outline" className={statusStyles[referral.status]}>
                {referral.status === 'BOUGHT' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {referral.status}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No referrals yet</p>
          <p className="text-sm text-muted-foreground">
            Referred customers will appear here
          </p>
        </div>
      )}
    </div>
  )
}

