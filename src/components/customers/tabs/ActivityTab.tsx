'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText,
  Plus,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  type: 'NOTE' | 'CALL' | 'TEXT' | 'EMAIL'
  content: string
  createdBy: string
  createdAt: Date
}

// Mock activities
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'NOTE',
    content: 'Customer expressed interest in motorized roller shades for the living room and bedroom. Prefers light-filtering fabric.',
    createdBy: 'Admin User',
    createdAt: new Date('2024-01-15T14:30:00'),
  },
  {
    id: '2',
    type: 'CALL',
    content: 'Discussed quote #1234. Customer requested a 10% discount. Will follow up with manager approval.',
    createdBy: 'Sarah Johnson',
    createdAt: new Date('2024-01-14T11:00:00'),
  },
  {
    id: '3',
    type: 'EMAIL',
    content: 'Sent follow-up email with product catalog and fabric samples information.',
    createdBy: 'Admin User',
    createdAt: new Date('2024-01-12T09:15:00'),
  },
  {
    id: '4',
    type: 'NOTE',
    content: 'Initial consultation completed. Customer has 12 windows. Budget approximately $5,000-$7,000.',
    createdBy: 'Mike Williams',
    createdAt: new Date('2024-01-10T16:45:00'),
  },
]

const activityIcons = {
  NOTE: MessageSquare,
  CALL: Phone,
  TEXT: MessageSquare,
  EMAIL: Mail,
}

const activityColors = {
  NOTE: 'bg-blue-500/10 text-blue-600',
  CALL: 'bg-green-500/10 text-green-600',
  TEXT: 'bg-purple-500/10 text-purple-600',
  EMAIL: 'bg-orange-500/10 text-orange-600',
}

interface ActivityTabProps {
  customerId: string
}

export function ActivityTab({ customerId }: ActivityTabProps) {
  const [activities] = useState<Activity[]>(mockActivities)
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<'NOTE' | 'CALL' | 'TEXT' | 'EMAIL'>('NOTE')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddActivity = () => {
    if (!newNote.trim()) return
    // Will connect to API later
    setNewNote('')
    setIsAdding(false)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="space-y-4">
      {/* Add Activity */}
      {isAdding ? (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Select 
              value={noteType} 
              onValueChange={(v) => setNoteType(v as typeof noteType)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOTE">Note</SelectItem>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Log a {noteType.toLowerCase()}
            </span>
          </div>
          <Textarea
            placeholder={`Add a ${noteType.toLowerCase()}...`}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddActivity}>
              Add Activity
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      )}

      {/* Activity Timeline */}
      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        {activities.map((activity) => {
          const Icon = activityIcons[activity.type]
          return (
            <div key={activity.id} className="relative flex gap-4 pl-12">
              {/* Icon */}
              <div className={cn(
                'absolute left-0 flex h-10 w-10 items-center justify-center rounded-full',
                activityColors[activity.type]
              )}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('border-0', activityColors[activity.type])}>
                      {activity.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      by {activity.createdBy}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
                <p className="text-sm">{activity.content}</p>
              </div>
            </div>
          )
        })}

        {activities.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            No activities yet. Add a note to get started.
          </div>
        )}
      </div>
    </div>
  )
}

