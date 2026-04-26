'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CalendarEvent } from './mockCalendarEvents'
import { EVENT_TYPES } from './constants'
import { formatDateDisplay, formatTimeDisplay } from './utils'
import { parseCalendarDateTime } from './utils'
import { Clock, MapPin, User, Building2, Globe, Phone, Mail, FileText, Trash2, Edit, CheckCircle2 } from 'lucide-react'
import { mockCustomers } from './mockCustomers'
import { mockPartners } from './mockPartners'
import { MOCK_TEAM_MEMBERS } from './constants'

interface EventDetailsModalProps {
  event: CalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (eventId: string) => void
  onEdit?: (event: CalendarEvent) => void
  onConfirm?: (eventId: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function EventDetailsModal({
  event,
  open,
  onOpenChange,
  onDelete,
  onEdit,
  onConfirm,
  canEdit,
  canDelete,
}: EventDetailsModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  if (!event) return null

  const eventTypeConfig = EVENT_TYPES[event.type]
  const customer = event.customerId
    ? mockCustomers.find(c => c.id === event.customerId)
    : null
  const partner = event.partnerId
    ? mockPartners.find(p => p.id === event.partnerId)
    : null

  const startDate = parseCalendarDateTime(event.start)
  const endDate = parseCalendarDateTime(event.end)

  const handleDeleteClick = () => setDeleteConfirmOpen(true)

  const handleConfirmDelete = async () => {
    onDelete(event.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
              <DialogDescription className="mt-2">
                Event details and information
              </DialogDescription>
            </div>
            <Badge
              style={{
                backgroundColor: eventTypeConfig.bgColor,
                color: eventTypeConfig.color,
                borderColor: eventTypeConfig.color,
              }}
            >
              {eventTypeConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date & Time */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">Start</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateDisplay(startDate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{formatTimeDisplay(startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateDisplay(endDate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{formatTimeDisplay(endDate)}</p>
              </div>
            </div>
            {event.commuteTime && (
              <div className="pl-6">
                <p className="text-xs text-muted-foreground">Commute Time</p>
                <p className="text-sm text-gray-900 dark:text-white">{event.commuteTime}</p>
              </div>
            )}
            <div className="pl-6">
              <p className="text-xs text-muted-foreground">Assigned To</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {MOCK_TEAM_MEMBERS.find(m => m.id === event.assignedTo)?.name || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Status */}
          {event.status && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status</h3>
              <Badge variant="outline" className="ml-6">
                {event.status}
              </Badge>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 pl-6">{event.location}</p>
            </div>
          )}

          {/* Customer Information */}
          {customer && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>
                {customer.sideMark && (
                  <div>
                    <p className="text-xs text-muted-foreground">Side Mark</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{customer.sideMark}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Company Information */}
          {event.isCompany && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4 pl-6">
                {event.companyName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Company Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.companyName}</p>
                  </div>
                )}
                {event.website && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Website
                    </p>
                    <a
                      href={event.website.startsWith('http') ? event.website : `https://${event.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {event.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lead Source */}
          {event.leadSource && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lead Source</h3>
              <div className="pl-6 space-y-2">
                <p className="text-sm text-gray-900 dark:text-white">{event.leadSource}</p>
                {event.referralName && (
                  <p className="text-xs text-muted-foreground">
                    Referred by: {event.referralName}
                  </p>
                )}
                {partner && (
                  <p className="text-xs text-muted-foreground">
                    Partner: {partner.name} ({partner.type})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Side Mark */}
          {event.sideMark && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Side Mark</h3>
              <p className="text-sm font-mono text-gray-900 dark:text-white pl-6">{event.sideMark}</p>
            </div>
          )}

          {/* Products & Windows */}
          {(event.productsOfInterest?.length || event.numberOfWindows || event.numberOfOpenings) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Products & Windows</h3>
              <div className="pl-6 space-y-2">
                {event.productsOfInterest && event.productsOfInterest.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Products of Interest</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {event.productsOfInterest.map((product, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {event.numberOfWindows && (
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Number of Windows</p>
                    <p className="text-sm text-gray-900 dark:text-white">{event.numberOfWindows}</p>
                  </div>
                )}
                {event.numberOfOpenings && (
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Number of Openings</p>
                    <p className="text-sm text-gray-900 dark:text-white">{event.numberOfOpenings}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 pl-6 whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {onConfirm && event.status !== 'Confirmed' && (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => { onConfirm(event.id); onOpenChange(false) }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm Appointment
            </Button>
          )}
          {canEdit && onEdit && (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                if (event && onEdit) {
                  onOpenChange(false)
                  onEdit(event)
                }
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
          )}
          {canDelete && (
            <Button type="button" variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Event
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </Dialog>
  )
}

