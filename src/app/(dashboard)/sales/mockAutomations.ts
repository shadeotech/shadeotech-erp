export type AutomationTrigger = 'Quote Pending Reminder' | 'Overdue Invoice Reminder' | 'Remaining Balance Reminder'

export type TriggerCondition = 
  | 'after_days'
  | 'on_due_date'
  | 'after_expiry'
  | 'when_overdue'

export type MessageType = 'email' | 'sms'

export interface AutomationRule {
  id: string
  name: AutomationTrigger
  enabled: boolean
  triggerCondition: TriggerCondition
  delay: number // days
  messageType: MessageType
  messageTemplate: string
  lastTriggered?: string
  triggeredCount: number
}

export const mockAutomations: AutomationRule[] = [
  {
    id: 'auto_001',
    name: 'Quote Pending Reminder',
    enabled: true,
    triggerCondition: 'after_days',
    delay: 2,
    messageType: 'email',
    messageTemplate: 'Hi {{customerName}}, we noticed your quote {{quoteNumber}} is still pending. Would you like to discuss any questions?',
    triggeredCount: 3,
    lastTriggered: '2025-01-20',
  },
  {
    id: 'auto_002',
    name: 'Overdue Invoice Reminder',
    enabled: true,
    triggerCondition: 'when_overdue',
    delay: 0,
    messageType: 'sms',
    messageTemplate: 'Reminder: Invoice {{invoiceNumber}} for {{amount}} is overdue. Please make payment to avoid late fees.',
    triggeredCount: 5,
    lastTriggered: '2025-01-22',
  },
  {
    id: 'auto_003',
    name: 'Remaining Balance Reminder',
    enabled: false,
    triggerCondition: 'after_days',
    delay: 7,
    messageType: 'email',
    messageTemplate: 'Hi {{customerName}}, your invoice {{invoiceNumber}} has a remaining balance of {{balance}}. Payment due by {{dueDate}}.',
    triggeredCount: 0,
  },
]

export const triggerConditionOptions: { value: TriggerCondition; label: string }[] = [
  { value: 'after_days', label: 'After X days' },
  { value: 'on_due_date', label: 'On due date' },
  { value: 'after_expiry', label: 'After expiry' },
  { value: 'when_overdue', label: 'When overdue' },
]

