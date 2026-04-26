'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  FileText, 
  CreditCard, 
  UserPlus, 
  Calendar,
  CheckCircle,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  type: 'quote' | 'payment' | 'customer' | 'appointment' | 'task' | 'email'
  description: string
  user: string
  time: string
}

const activityIcons = {
  quote: FileText,
  payment: CreditCard,
  customer: UserPlus,
  appointment: Calendar,
  task: CheckCircle,
  email: Mail,
}

const activityColors = {
  quote: 'bg-blue-500/10 text-blue-600',
  payment: 'bg-green-500/10 text-green-600',
  customer: 'bg-purple-500/10 text-purple-600',
  appointment: 'bg-orange-500/10 text-orange-600',
  task: 'bg-emerald-500/10 text-emerald-600',
  email: 'bg-pink-500/10 text-pink-600',
}

// Mock recent activities
const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'quote',
    description: 'Created quote #1234 for ABC Corp',
    user: 'Admin',
    time: '5 min ago',
  },
  {
    id: '2',
    type: 'payment',
    description: 'Payment of $2,500 received from XYZ Inc',
    user: 'System',
    time: '30 min ago',
  },
  {
    id: '3',
    type: 'customer',
    description: 'New lead added: John Smith',
    user: 'Sarah',
    time: '1 hour ago',
  },
  {
    id: '4',
    type: 'appointment',
    description: 'Consultation scheduled with Jane Doe',
    user: 'Mike',
    time: '2 hours ago',
  },
  {
    id: '5',
    type: 'task',
    description: 'Follow-up task completed for Lead #567',
    user: 'Admin',
    time: '3 hours ago',
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activityIcons[activity.type]
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  activityColors[activity.type]
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {activity.user.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

