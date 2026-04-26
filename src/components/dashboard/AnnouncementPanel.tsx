'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, X } from 'lucide-react'
import { useState } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success'
  date: string
}

// Mock announcements for static UI
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'System Update',
    content: 'New features have been added to the quote builder. Check it out!',
    type: 'info',
    date: '2024-01-15',
  },
  {
    id: '2',
    title: 'Holiday Schedule',
    content: 'Office will be closed on January 20th for the holiday.',
    type: 'warning',
    date: '2024-01-14',
  },
]

const typeStyles = {
  info: 'bg-blue-500/10 text-blue-600 border-blue-200',
  warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  success: 'bg-green-500/10 text-green-600 border-green-200',
}

const badgeStyles = {
  info: 'info',
  warning: 'warning',
  success: 'success',
} as const

export function AnnouncementPanel() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements)

  const dismissAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  if (announcements.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4" />
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`relative rounded-lg border p-3 ${typeStyles[announcement.type]}`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6"
              onClick={() => dismissAnnouncement(announcement.id)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="flex items-start gap-2">
              <Badge variant={badgeStyles[announcement.type]} className="shrink-0">
                {announcement.type}
              </Badge>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium">{announcement.title}</h4>
                <p className="mt-1 text-sm opacity-90">{announcement.content}</p>
                <p className="mt-2 text-xs opacity-70">{announcement.date}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

