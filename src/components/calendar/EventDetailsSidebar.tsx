'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Edit, 
  Trash2,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface EventDetails {
  id: string
  title: string
  type: string
  start: Date | string
  end: Date | string
  allDay?: boolean
  customer?: {
    id: string
    name: string
    sideMark: string
  }
  location?: string
  description?: string
}

interface EventDetailsSidebarProps {
  event: EventDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
}

const eventTypeColors: Record<string, string> = {
  CONSULTATION: 'bg-blue-500',
  INSTALLATION: 'bg-green-500',
  DELIVERY: 'bg-purple-500',
  FOLLOW_UP: 'bg-yellow-500',
  MEETING: 'bg-gray-500',
  OTHER: 'bg-gray-400',
}

export function EventDetailsSidebar({ 
  event, 
  open, 
  onOpenChange,
  onEdit,
  onDelete 
}: EventDetailsSidebarProps) {
  if (!event) return null

  const startDate = new Date(event.start)
  const endDate = new Date(event.end)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${eventTypeColors[event.type] || 'bg-gray-400'}`} />
            <Badge variant="outline">{event.type}</Badge>
          </div>
          <SheetTitle className="text-xl">{event.title}</SheetTitle>
          <SheetDescription>Event details and information</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </p>
                {!event.allDay && (
                  <p className="text-sm text-muted-foreground">
                    to {format(endDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>

            {!event.allDay && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p>
                  {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Location */}
          {event.location && (
            <>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                  <Button variant="link" className="h-auto p-0 text-sm" asChild>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View in Maps
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Customer */}
          {event.customer && (
            <>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Customer</p>
                  <p className="text-sm">{event.customer.name}</p>
                  <p className="text-xs text-muted-foreground">{event.customer.sideMark}</p>
                  <Link href={`/customers/${event.customer.id}`}>
                    <Button variant="link" className="h-auto p-0 text-sm">
                      View Customer Profile
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="mb-2 font-medium">Notes</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" className="flex-1" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

