'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Loader2, Edit, Copy, Package, UserCheck, UserPlus, Camera, Paperclip, Check, X, ImagePlus } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useQuotesStore, QuoteItem, type Quote, type QuoteAddOn } from '@/stores/quotesStore'
import { usePricingChartStore, type CollectionId } from '@/stores/pricingChartStore'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'
import { FabricSelectionDialog } from './FabricSelectionDialog'
import { CassetteSelectionDialog, type CassetteSelectionResult } from './CassetteSelectionDialog'
import type { Fabric } from '@/types/fabric'
import { getFabricImageUrl } from '@/constants/fabrics'
import Image from 'next/image'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DECIMAL_FRACTIONS, QUOTE_COLLECTIONS } from '@/lib/quoteConstants'
import { sanitizePhoneInput, validatePhone } from '@/lib/phoneValidation'
import { AddressAutocomplete, type AddressSelection } from '@/components/shared/AddressAutocomplete'
import { useQuickQuoteStore, type QuickQuoteItem } from '@/stores/quickQuoteStore'
import { useQuoteOptionsStore } from '@/stores/quoteOptionsStore'

const decimalFractions = DECIMAL_FRACTIONS
const DECIMAL_VALUES = decimalFractions.map((d) => parseFloat(d.value))

// Convert inches (number) to whole + decimal form values (decimal rounded to nearest fraction)
function inchesToFormValues(inches: number): { whole: string; decimal: string } {
  const whole = Math.floor(inches)
  const frac = inches - whole
  const closest = DECIMAL_VALUES.reduce((prev, curr) =>
    Math.abs(curr - frac) < Math.abs(prev - frac) ? curr : prev
  )
  return { whole: String(whole), decimal: String(closest) }
}

// Product configuration options (Room Type, Operation, Mount, B Rail, Brackets, Spring Assist)
const ROOM_TYPES = ['TV ROOM', 'Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Bathroom', 'Nursery', 'Other']
const SEQUENCE_OPTIONS = ['L', 'R', 'Middle', 'Top', 'Down', 'L2', 'R2']

// Operation dropdown options (grouped)
const MOTORIZED_OPERATIONS = ['Motorized', 'Battery Powered', 'AC 12V/24V', 'AC 110 V', 'Wand Motor']
const MANUAL_OPERATIONS = ['Chain', 'Cord', 'Cordless', 'Wand']
const ALL_OPERATIONS = [...MOTORIZED_OPERATIONS, ...MANUAL_OPERATIONS]

// Exterior-specific operation options
const EXTERIOR_MOTORIZED_OPERATIONS = ['AC 110V Motor', 'Battery powered motor']
const EXTERIOR_MANUAL_OPERATIONS = ['Crank']
const ALL_EXTERIOR_OPERATIONS = [...EXTERIOR_MOTORIZED_OPERATIONS, ...EXTERIOR_MANUAL_OPERATIONS]

// 2nd dropdown options per operation type
const MOTOR_CHANNELS = ['CH', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16']
const REMOTE_OPTIONS = ['Yes', 'No']
const BEADED_CHAIN_COLORS = ['Default', 'White', 'Black', 'Anodized', 'Stainless Steel']
const CORD_COLORS = ['Default', 'White', 'Grey', 'Black', 'Ivory']
const WAND_TYPES = ['Standard', 'Custom Length']

// Helper to check if an operation is motorized
const isMotorizedOperation = (op: string) => MOTORIZED_OPERATIONS.includes(op) || EXTERIOR_MOTORIZED_OPERATIONS.includes(op) // kept for module-level compatibility

const MOUNT_TYPES = [
  { value: 'Inside', label: 'Inside Mount' },
  { value: 'Outside', label: 'Outside Mount' },
]
const BOTTOM_RAIL_TYPES = ['Exposed', 'Wrapped', 'Sealed']
const BOTTOM_RAIL_EXPOSED_COLORS = ['Default', 'White', 'Ivory', 'Anodized', 'Brown', 'Black']
const EXTERIOR_COMPONENT_COLORS = ['White', 'Black', 'Bronze', 'Beige', 'Anodized', 'Brown', 'Dark Grey', 'Light Grey', 'Ivory']
const BOTTOM_RAIL_WRAPPED_OPTIONS = ['Same as cassette', 'Other']
const BOTTOM_RAIL_SEAL_TYPES = ['Brush S', 'Brush L', 'Rubber']
const SIDE_CHANNEL_OPTIONS = [
  { value: 'Right', label: 'Side Channel: R' },
  { value: 'Left', label: 'Side Channel: L' },
  { value: 'Both', label: 'Side Channel: RL' },
  { value: 'Bottom', label: 'Side Channel: Bottom' },
]
const SIDE_CHANNEL_COLORS = ['White', 'Ivory', 'Black', 'Anodized', 'Brown']
const ROLL_OPTIONS = ['Standard', 'Reverse']
const BRACKET_OPTIONS = ['Select Brackets', 'Standard', 'Extended', 'Custom']
const SPRING_ASSIST_OPTIONS = ['Yes', 'No']

// Side mark preview: mirrors server-side logic for a live preview
const SIDE_MARK_TYPE_CODES: Record<string, string> = { FRANCHISEE: 'A', RESIDENTIAL: 'R', COMMERCIAL: 'C', PARTNER: 'P' }
const SIDE_MARK_SOURCE_CODES: Record<string, string> = { META: 'MT', GOOGLE: 'GL', REFERRAL: 'RF', PARTNER_REFERRAL: 'PR', DOOR_HANGER: 'DH', DOOR_TO_DOOR: 'DD', LINKEDIN: 'LK', VEHICLE: 'VH', WALK_IN: 'WI', OTHER_PAID: 'OP', OTHER_ORGANIC: 'OO' }
function sideMarkPreview(customerType: string, leadSource: string) {
  const t = SIDE_MARK_TYPE_CODES[customerType] || 'R'
  const s = SIDE_MARK_SOURCE_CODES[leadSource] || 'XX'
  return `SH${t}-${s}#####`
}

interface QuoteBuilderProps {
  customerId?: string
  /** When editing, the quote to preload */
  initialQuote?: Quote
  /** When set, form submits via update (PUT) instead of create (POST) */
  quoteId?: string
  /** When true, hide customer selection and add-customer UI (e.g. when opened from customer details page) */
  customerLocked?: boolean
  /** Customer name to display when customerLocked - used for quote creation */
  customerName?: string
  /** Side mark when customerLocked */
  customerSideMark?: string
  /** Pre-fill contact & address when customerLocked (e.g. from customer details page) */
  customerContact?: {
    email?: string
    phone?: string
    mobile?: string
    street?: string
    town?: string
    city?: string
    country?: string
    postcode?: string
  }
  /** When true, customer does not pay the 8% tax (tax exempt) */
  customerTaxExempt?: boolean
  /** When set, pre-populate line items from this quick quote ID and remove it from the store */
  fromQuickQuoteId?: string
  /** When true: hide customer/address/settings cards and show "Place Order" instead of "Create Quote" */
  dealerMode?: boolean
  onComplete: (quoteId: string) => void
}

interface User {
  id: string
  _id: string
  name: string
  email: string
  role?: 'CUSTOMER' | 'DEALER' | 'ADMIN' | 'STAFF' | 'FRANCHISEE'
  phone?: string
  mobile?: string
  street?: string
  town?: string
  city?: string
  country?: string
  postcode?: string
  sideMark?: string
  source?: 'user' | 'customer' // 'customer' = from CRM Customer model
  customerType?: string
  taxExempt?: boolean
}

interface CustomerTaxFile {
  _id?: string
  name: string
  url: string
  category: 'tax_exemption' | 'contract' | 'invoice' | 'other'
  uploadedAt?: string | Date
}

export function QuoteBuilder({ customerId, initialQuote, quoteId, customerLocked, customerName, customerSideMark, customerContact, customerTaxExempt, fromQuickQuoteId, dealerMode, onComplete }: QuoteBuilderProps) {
  const { globalAdjust, addQuote, updateQuote, setGlobalAdjust } = useQuotesStore()
  const { token } = useAuthStore()
  const { getChart, fetchCharts } = usePricingChartStore()
  const { quickQuotes, removeQuickQuote } = useQuickQuoteStore()

  // Quote options from settings store
  const qopts = useQuoteOptionsStore()
  const isMotorizedOp = (op: string) => qopts.motorizedOperations.includes(op) || qopts.exteriorMotorizedOperations.includes(op)

  // Loading states
  const [creatingQuote, setCreatingQuote] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  // Customer state: users (role CUSTOMER) + CRM customers from /api/customers
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '')
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('')
  const [newCustomerLastName, setNewCustomerLastName] = useState('')
  const [newCustomerCompanyName, setNewCustomerCompanyName] = useState('')
  const [newCustomerCompanyType, setNewCustomerCompanyType] = useState('')
  const [addNewCompanyTypeMode, setAddNewCompanyTypeMode] = useState(false)
  const [newCompanyTypeInput, setNewCompanyTypeInput] = useState('')
  const [remeasurementRequired, setRemeasurementRequired] = useState<'NO' | 'YES'>('NO')
  const [newCustomerSideMark, setNewCustomerSideMark] = useState('')
  const [newCustomerType, setNewCustomerType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'FRANCHISEE' | 'PARTNER'>('RESIDENTIAL')
  const [newCustomerSource, setNewCustomerSource] = useState<string>('WALK_IN')
  const [newCustomerTaxExempt, setNewCustomerTaxExempt] = useState(false)
  // Track selected existing customer's type (editable)
  const [selectedCustomerType, setSelectedCustomerType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'FRANCHISEE' | 'PARTNER' | ''>('')

  // Tax exempt state — driven by selected existing customer or new customer toggle
  const [isTaxExempt, setIsTaxExempt] = useState(customerTaxExempt ?? false)
  const [taxExemptionFiles, setTaxExemptionFiles] = useState<CustomerTaxFile[]>([])
  const [taxExemptionLoading, setTaxExemptionLoading] = useState(false)
  const [taxExemptionUploading, setTaxExemptionUploading] = useState(false)
  const [pendingTaxExemptionFile, setPendingTaxExemptionFile] = useState<File | null>(null)
  const taxExemptionInputRef = useRef<HTMLInputElement>(null)

  // Contact & address (auto-filled from selected customer or empty for new customer)
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [phoneError, setPhoneError] = useState<string | undefined>()
  const [mobileError, setMobileError] = useState<string | undefined>()
  const [customerStreet, setCustomerStreet] = useState('')
  const [customerTown, setCustomerTown] = useState('')
  const [customerCity, setCustomerCity] = useState('')
  const [customerCountry, setCustomerCountry] = useState('')
  const [customerPostcode, setCustomerPostcode] = useState('')

  // Fabric gallery for cascade dropdowns
  const [fabricGallery, setFabricGallery] = useState<Fabric[]>([])
  const [fabricGalleryLoading, setFabricGalleryLoading] = useState(false)

  // Quote state - using tabs instead of steps (default to products when customer is locked)
  const [activeTab, setActiveTab] = useState(customerLocked ? 'products' : 'customer')
  const [quoteStatus, setQuoteStatus] = useState<'DRAFT' | 'SENT'>('DRAFT')
  const [items, setItems] = useState<QuoteItem[]>([])
  const [taxRate, setTaxRate] = useState(8.25)
  const [notes, setNotes] = useState('')
  const [expiryDate, setExpiryDate] = useState(format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd'))
  const [contractType, setContractType] = useState<'INTERIOR' | 'EXTERIOR' | 'INTERIOR_AND_EXTERIOR' | ''>('')

  // New header fields
  const [saleAgent, setSaleAgent] = useState('')
  const [discountType, setDiscountType] = useState('No discount')
  const [discountValue, setDiscountValue] = useState(0)
  const [adminNote, setAdminNote] = useState('')
  const [installationAmount, setInstallationAmount] = useState(0)
  const [manualInstallationAmount, setManualInstallationAmount] = useState<number | null>(null)
  const [isEditingInstallation, setIsEditingInstallation] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<'PICK_UP' | 'SHIPPED' | 'INSTALLED'>('INSTALLED')
  const [shippingCost, setShippingCost] = useState(0)
  // Ship To address
  const [shipToStreet, setShipToStreet] = useState('')
  const [shipToSuite, setShipToSuite] = useState('')
  const [shipToCity, setShipToCity] = useState('')
  const [shipToState, setShipToState] = useState('')
  const [shipToPostcode, setShipToPostcode] = useState('')
  const [shipToCountry, setShipToCountry] = useState('')
  const [shipToManuallyEdited, setShipToManuallyEdited] = useState(false)
  const [billSameAsShip, setBillSameAsShip] = useState(true)
  const [customerSuite, setCustomerSuite] = useState('')
  // Staff list for Sale Agent dropdown
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([])

  // Price override and chart display state
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null)
  const [editPriceValue, setEditPriceValue] = useState('')
  const [newItemPriceOverride, setNewItemPriceOverride] = useState<number | null>(null)
  const [isEditingNewItemPrice, setIsEditingNewItemPrice] = useState(false)
  // When set, the form is in "edit mode" and Update will replace this item
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  // Custom area input when "Other" is selected in room type
  const [customAreaInput, setCustomAreaInput] = useState('')
  const [addNewAreaMode, setAddNewAreaMode] = useState(false)
  const [addNewAreaInput, setAddNewAreaInput] = useState('')

  // New item form
  const [newItem, setNewItem] = useState({
    productName: '',
    category: '',
    subcategory: '',
    subSubcategory: '',
    collectionId: '' as CollectionId | '',
    widthWhole: '',
    widthDecimal: '0',
    lengthWhole: '',
    lengthDecimal: '0',
    quantity: '1',
    fabricId: '',
    fabricImage: '',
    fabricCategory: '', // Store fabric category for chart mapping
    cassetteType: '',
    cassetteImage: '',
    cassetteColor: '',
    fabricWrap: 'none' as 'same' | 'other' | 'none',
    fabricWrapId: '',
    fabricWrapImage: '',
    // Product configuration options
    roomType: '',
    sequence: '',
    controlType: 'Chain',
    controlChain: 'Default',
    controlChainColor: '',
    controlChainSide: 'R',
    mountType: 'Inside',
    bottomRailType: 'Exposed',
    bottomRailColor: '',
    bottomRailSealType: 'Brush S',
    sideChannel: 'None',
    sideChannelColor: '',
    solarPanel: 'No',
    sequenceImage: '',
    roll: 'Standard',
    brackets: '',
    brackets2: '',
    stacks: '',
    springAssist: 'Yes',
    exteriorType: '',
    remoteNumber: '',
  })

  // Remeasurement: set of item IDs flagged for remeasure + their pending new sizes
  const [remeasureFlags, setRemeasureFlags] = useState<Record<string, boolean>>({})
  const [remeasureSizes, setRemeasureSizes] = useState<Record<string, { width: string; length: string }>>({})

  const toggleRemeasure = (itemId: string, on: boolean) => {
    setRemeasureFlags((prev) => ({ ...prev, [itemId]: on }))
    if (on && !remeasureSizes[itemId]) {
      const item = items.find((i) => i.id === itemId)
      if (item) {
        const wf = inchesToFormValues(item.width)
        const lf = inchesToFormValues(item.length)
        setRemeasureSizes((prev) => ({ ...prev, [itemId]: { width: `${wf.whole}.${wf.decimal}`, length: `${lf.whole}.${lf.decimal}` } }))
      }
    }
  }

  const remeasureItems = items.filter((i) => remeasureFlags[i.id])

  // Helper functions to get full width and length (never negative)
  const getFullWidth = useMemo(() => {
    const whole = parseFloat(newItem.widthWhole) || 0
    const decimal = parseFloat(newItem.widthDecimal) || 0
    return Math.max(0, whole + decimal)
  }, [newItem.widthWhole, newItem.widthDecimal])

  const getFullLength = useMemo(() => {
    const whole = parseFloat(newItem.lengthWhole) || 0
    const decimal = parseFloat(newItem.lengthDecimal) || 0
    return Math.max(0, whole + decimal)
  }, [newItem.lengthWhole, newItem.lengthDecimal])

  // Dialog states
  const [fabricWrapDialogOpen, setFabricWrapDialogOpen] = useState(false)
  const [cassetteDialogOpen, setCassetteDialogOpen] = useState(false)

  // Upgrades (formerly Add-ons): list from API and selected with optional quantity
  const [availableAddOns, setAvailableAddOns] = useState<{ id: string; name: string; price: number; description?: string }[]>([])
  const [addOnsLoading, setAddOnsLoading] = useState(false)
  const [selectedAddOns, setSelectedAddOns] = useState<{ addOnId: string; quantity?: number }[]>([])
  // Additional Services (Blinds Removal / Disposal)
  const [additionalServices, setAdditionalServices] = useState<string[]>([])
  // User overrides for upgrade quantities and prices
  const [upgradeQtyOverrides, setUpgradeQtyOverrides] = useState<Record<string, number>>({})
  const [upgradePriceOverrides, setUpgradePriceOverrides] = useState<Record<string, number>>({})
  const [editingUpgradeQty, setEditingUpgradeQty] = useState<string | null>(null)
  const [editingUpgradePrice, setEditingUpgradePrice] = useState<string | null>(null)

  const isObjectId = (value?: string) => Boolean(value && /^[a-f\d]{24}$/i.test(value))
  const effectiveCustomerForFiles = customerLocked ? (customerId || selectedCustomerId) : selectedCustomerId

  const uploadTaxExemptionCertificate = async (targetCustomerId: string, file: File) => {
    if (!token) throw new Error('Authentication required')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'tax_exemption')

    const response = await fetch(`/api/customers/${targetCustomerId}/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to upload exemption certificate')
    }

    const data = await response.json()
    const uploaded = data?.file as CustomerTaxFile | undefined
    if (uploaded) {
      setTaxExemptionFiles((prev) => [uploaded, ...prev])
    }
    return uploaded
  }

  // Fetch users (role CUSTOMER) and CRM customers from /api/customers
  useEffect(() => {
    const fetchUsersAndCustomers = async () => {
      if (!token) return
      try {
        setUsersLoading(true)
        const [usersRes, customersRes] = await Promise.all([
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const fetchedUsers: User[] = []
        if (usersRes.ok) {
          const data = await usersRes.json()
          const fromUsers = (data.users || []).map((user: any) => ({
            id: user._id || user.id,
            _id: user._id || user.id,
            name: user.name || `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            phone: user.phone,
            mobile: user.mobile,
          street: user.street,
          town: user.town,
          city: user.city,
          country: user.country,
          postcode: user.postcode,
          sideMark: user.sideMark,
          source: 'user' as const,
          }))
          fetchedUsers.push(...fromUsers)
        }
        if (customersRes.ok) {
          const custData = await customersRes.json()
          const fromCustomers = (custData.customers || []).map((c: any) => ({
            id: c.id || c._id,
            _id: c.id || c._id,
            name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.sideMark || 'Unknown',
            email: c.email || '',
            role: 'CUSTOMER' as const,
            phone: c.phone,
            mobile: c.mobile,
            street: c.street,
            town: c.town,
            city: c.city,
            country: c.country,
            postcode: c.postcode,
            sideMark: c.sideMark,
            source: 'customer' as const,
            customerType: c.customerType,
            taxExempt: c.taxExempt ?? false,
          }))
          fetchedUsers.push(...fromCustomers)
        }
        // Deduplicate by email: customer-source entries win over user-source entries
        const fromCustomers = fetchedUsers.filter((u) => u.source === 'customer')
        const fromUsers = fetchedUsers.filter((u) => u.source === 'user')
        const seenEmails = new Set<string>()
        const seenIds = new Set<string>()
        const deduped: User[] = []
        for (const entry of [...fromCustomers, ...fromUsers]) {
          const emailKey = entry.email?.toLowerCase()
          if (seenIds.has(entry.id)) continue
          if (emailKey && seenEmails.has(emailKey)) continue
          seenIds.add(entry.id)
          if (emailKey) seenEmails.add(emailKey)
          deduped.push(entry)
        }
        setUsers(deduped)
      } catch (error) {
        console.error('Error fetching users/customers:', error)
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsersAndCustomers()
  }, [token])

  // Fetch staff list for Sale Agent dropdown
  useEffect(() => {
    if (!token) return
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.users) return
        const staff = (data.users as any[])
          .filter((u: any) => u.role === 'ADMIN' || u.role === 'STAFF')
          .map((u: any) => ({ id: u._id || u.id, name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email }))
        setStaffList(staff)
      })
      .catch(() => {})
  }, [token])

  // Auto-fill contact/address when a customer is selected; clear when dropdown is cleared
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerEmail('')
      setCustomerPhone('')
      setCustomerMobile('')
      setPhoneError(undefined)
      setMobileError(undefined)
      setCustomerStreet('')
      setCustomerTown('')
      setIsTaxExempt(false)
      setSelectedCustomerType('')
      setCustomerCity('')
      setCustomerCountry('')
      setCustomerPostcode('')
      return
    }
    if (selectedCustomerId.startsWith('temp_')) {
      // New customer: leave fields as-is (user is typing)
      return
    }
    const user = users.find((u) => u.id === selectedCustomerId)
    if (user) {
      setCustomerEmail(user.email || '')
      setCustomerPhone(user.phone || '')
      setCustomerMobile(user.mobile || '')
      setPhoneError(undefined)
      setMobileError(undefined)
      // Populate ship-to; bill-to auto-syncs from ship-to
      setShipToStreet(user.street || '')
      setShipToCity(user.city || '')
      setShipToState(user.town || '')
      setShipToPostcode(user.postcode || '')
      setShipToCountry(user.country || '')
      setCustomerStreet(user.street || '')
      setCustomerTown(user.town || '')
      setCustomerCity(user.city || '')
      setCustomerCountry(user.country || '')
      setCustomerPostcode(user.postcode || '')
      setNewCustomerName('')
      setNewCustomerSideMark('')
      // Set customer type and tax exempt from customer record
      setSelectedCustomerType((user.customerType as any) || '')
      setIsTaxExempt(user.taxExempt ?? false)
    }
  }, [selectedCustomerId, users])

  // Fetch already uploaded tax exemption certificates for the active customer.
  useEffect(() => {
    const fetchTaxExemptionFiles = async () => {
      if (!token) return
      if (!effectiveCustomerForFiles || !isObjectId(effectiveCustomerForFiles)) {
        setTaxExemptionFiles([])
        return
      }

      try {
        setTaxExemptionLoading(true)
        const response = await fetch(`/api/customers/${effectiveCustomerForFiles}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          setTaxExemptionFiles([])
          return
        }
        const data = await response.json()
        const files = (data?.files || data?.customer?.files || []) as CustomerTaxFile[]
        const taxFiles = files
          .filter((f) => f.category === 'tax_exemption')
          .sort((a, b) => {
            const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
            const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
            return bTime - aTime
          })
        setTaxExemptionFiles(taxFiles)
      } catch {
        setTaxExemptionFiles([])
      } finally {
        setTaxExemptionLoading(false)
      }
    }

    fetchTaxExemptionFiles()
  }, [token, effectiveCustomerForFiles])

  // Pre-fill contact & address when customerLocked and customerContact provided
  useEffect(() => {
    if (!customerLocked || !customerContact) return
    if (customerContact.email !== undefined) setCustomerEmail(customerContact.email)
    if (customerContact.phone !== undefined) setCustomerPhone(customerContact.phone)
    if (customerContact.mobile !== undefined) setCustomerMobile(customerContact.mobile)
    // Populate ship-to; bill-to auto-syncs from ship-to
    if (customerContact.street !== undefined) setShipToStreet(customerContact.street)
    if (customerContact.town !== undefined) setShipToState(customerContact.town)
    if (customerContact.city !== undefined) setShipToCity(customerContact.city)
    if (customerContact.country !== undefined) setShipToCountry(customerContact.country)
    if (customerContact.postcode !== undefined) setShipToPostcode(customerContact.postcode)
    if (customerContact.street !== undefined) setCustomerStreet(customerContact.street)
    if (customerContact.town !== undefined) setCustomerTown(customerContact.town)
    if (customerContact.city !== undefined) setCustomerCity(customerContact.city)
    if (customerContact.country !== undefined) setCustomerCountry(customerContact.country)
    if (customerContact.postcode !== undefined) setCustomerPostcode(customerContact.postcode)
  }, [customerLocked, customerContact])

  // Auto-sync ship-to → bill-to address when "same" checkbox is on
  useEffect(() => {
    if (!billSameAsShip) return
    setCustomerStreet(shipToStreet)
    setCustomerCity(shipToCity)
    setCustomerTown(shipToState)
    setCustomerPostcode(shipToPostcode)
    setCustomerCountry(shipToCountry)
  }, [shipToStreet, shipToCity, shipToState, shipToPostcode, shipToCountry, billSameAsShip])

  // Preload form when editing (initialQuote + quoteId)
  useEffect(() => {
    if (!initialQuote || !quoteId) return
    setSelectedCustomerId(initialQuote.customerId)
    setNewCustomerSideMark(initialQuote.sideMark || '')
    setItems((initialQuote.items || []).map((item: any) => ({
      ...item,
      id: item.id || Math.random().toString(36).substring(7),
    })))
    setTaxRate(initialQuote.taxRate ?? 8)
    setQuoteStatus((initialQuote.status === 'SENT' ? 'SENT' : 'DRAFT') as 'DRAFT' | 'SENT')
    setNotes(initialQuote.notes || '')
    setExpiryDate(initialQuote.expiryDate ? initialQuote.expiryDate.slice(0, 10) : format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd'))
    setContractType((initialQuote.contractType as 'INTERIOR' | 'EXTERIOR' | 'INTERIOR_AND_EXTERIOR') || '')
    setGlobalAdjust(initialQuote.priceAdjustPercent ?? 0, initialQuote.priceAdjustFlat ?? 0)
    if (initialQuote.addOns && initialQuote.addOns.length > 0) {
      setSelectedAddOns(
        initialQuote.addOns.map((a) => ({
          addOnId: a.addOnId,
          quantity: a.quantity != null && a.quantity > 0 ? a.quantity : undefined,
        }))
      )
    }
    // Preload new fields
    setSaleAgent((initialQuote as any).saleAgent || '')
    setDiscountType((initialQuote as any).discountType || 'No discount')
    setDiscountValue((initialQuote as any).discountValue || 0)
    setAdminNote((initialQuote as any).adminNote || '')
    setInstallationAmount((initialQuote as any).installationAmount || 0)
    setDeliveryMethod((initialQuote as any).deliveryMethod || 'INSTALLED')
    setShippingCost((initialQuote as any).shippingCost || 0)
    setShipToStreet((initialQuote as any).shipToStreet || '')
    setShipToCity((initialQuote as any).shipToCity || '')
    setShipToState((initialQuote as any).shipToState || '')
    setShipToPostcode((initialQuote as any).shipToPostcode || '')
    setShipToCountry((initialQuote as any).shipToCountry || '')
  }, [quoteId, initialQuote, setGlobalAdjust])

  // Pre-populate line items when converting from a Quick Quote
  useEffect(() => {
    if (!fromQuickQuoteId) return
    const qq = quickQuotes.find((q) => q.id === fromQuickQuoteId)
    if (!qq) return

    const mapped: QuoteItem[] = qq.items.map((qqItem: QuickQuoteItem) => {
      const collectionId = QUOTE_COLLECTIONS.find((c) => c.name === qqItem.product)?.id
      return {
        id: qqItem.id,
        productName: qqItem.product,
        category: 'roller_shades',
        collectionId,
        width: qqItem.width,
        length: qqItem.length,
        area: (qqItem.width * qqItem.length) / 144,
        quantity: qqItem.quantity,
        unitPrice: qqItem.unitPrice,
        totalPrice: qqItem.totalPrice,
        controlType: qqItem.operation,
      }
    })

    setItems(mapped)
    setActiveTab('products')
    removeQuickQuote(fromQuickQuoteId)
  }, [fromQuickQuoteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch fabric gallery for cascade dropdowns
  useEffect(() => {
    const fetchFabricGallery = async () => {
      if (!token) return
      try {
        setFabricGalleryLoading(true)
        const res = await fetch('/api/fabric-gallery', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setFabricGallery(data.fabrics || [])
        }
      } catch (error) {
        console.error('Error fetching fabric gallery:', error)
      } finally {
        setFabricGalleryLoading(false)
      }
    }
    fetchFabricGallery()
  }, [token])

  // Fetch pricing charts
  useEffect(() => {
    if (token) {
      fetchCharts(token)
    }
  }, [token, fetchCharts])

  // Fetch add-ons (no auth required for GET)
  useEffect(() => {
    const fetchAddOns = async () => {
      setAddOnsLoading(true)
      try {
        const res = await fetch('/api/addons')
        if (res.ok) {
          const data = await res.json()
          setAvailableAddOns(data.addOns || [])
        }
      } catch (e) {
        console.error('Error fetching add-ons:', e)
      } finally {
        setAddOnsLoading(false)
      }
    }
    fetchAddOns()
  }, [])

  const motorizedLineCount = useMemo(
    () => items.filter((i) => isMotorizedOp(i.controlType || '')).length,
    [items]
  )

  // When items have motorized lines, ensure a motor add-on is selected and quantity matches motorized count
  useEffect(() => {
    if (motorizedLineCount === 0) return
    setSelectedAddOns((prev) => {
      const motorAddOn = availableAddOns.find((a) => a.name.toLowerCase().includes('motor'))
      if (!motorAddOn) return prev
      const motorEntry = prev.find((e) => {
        const ao = availableAddOns.find((a) => a.id === e.addOnId)
        return ao && ao.name.toLowerCase().includes('motor')
      })
      if (!motorEntry) {
        return [...prev, { addOnId: motorAddOn.id, quantity: motorizedLineCount }]
      }
      if (motorEntry.quantity === motorizedLineCount) return prev
      return prev.map((e) => {
        const ao = availableAddOns.find((a) => a.id === e.addOnId)
        if (ao && ao.name.toLowerCase().includes('motor')) return { ...e, quantity: motorizedLineCount }
        return e
      })
    })
  }, [motorizedLineCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-add Solar Panel add-on when line items have solarPanel === 'Yes'
  const solarPanelLineCount = useMemo(
    () => items.filter((i) => i.solarPanel === 'Yes').length,
    [items]
  )

  useEffect(() => {
    const solarAddOn = availableAddOns.find((a) => a.name === 'Solar Panel')
    if (!solarAddOn) return
    setSelectedAddOns((prev) => {
      if (solarPanelLineCount === 0) {
        return prev.filter((e) => e.addOnId !== solarAddOn.id)
      }
      const entry = prev.find((e) => e.addOnId === solarAddOn.id)
      if (!entry) return [...prev, { addOnId: solarAddOn.id, quantity: solarPanelLineCount }]
      if (entry.quantity === solarPanelLineCount) return prev
      return prev.map((e) => e.addOnId === solarAddOn.id ? { ...e, quantity: solarPanelLineCount } : e)
    })
  }, [solarPanelLineCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-set contract type based on items (Exterior vs Interior)
  useEffect(() => {
    if (items.length === 0) return
    const hasExt = items.some((i) => i.category === 'Exterior' || i.category?.startsWith('Exterior'))
    const hasInt = items.some((i) => i.category !== 'Exterior' && !i.category?.startsWith('Exterior'))
    if (hasExt && hasInt) setContractType('INTERIOR_AND_EXTERIOR')
    else if (hasExt) setContractType('EXTERIOR')
    else setContractType('INTERIOR')
  }, [items])

  // Computed upgrades based on line item selections
  const computedUpgrades = useMemo(() => {
    const upgrades: { addOnId: string; name: string; quantity: number; unitPrice: number; total: number; removable: boolean }[] = []
    const motorizedItems = items.filter((i) => isMotorizedOp(i.controlType || ''))
    const motorizedCount = motorizedItems.reduce((sum, i) => sum + i.quantity, 0)
    const solarCount = items.filter((i) => i.solarPanel === 'Yes').reduce((sum, i) => sum + i.quantity, 0)
    const remoteEnabledMotorizedItems = motorizedItems.filter((i) => (i.controlChainColor || 'Yes') !== 'No')
    const uniqueMotorizedRoomsWithRemote = new Set(remoteEnabledMotorizedItems.map((i) => i.roomType || 'default'))
    const hasAC12V = motorizedItems.some((i) => i.controlType === 'AC 12V/24V')
    const allAC110orHardWired = motorizedItems.length > 0 && motorizedItems.every((i) => ['AC 110 V', 'AC 110V Motor', 'Hard Wired Motor'].includes(i.controlType || ''))
    const totalShadeCount = items.reduce((sum, i) => sum + i.quantity, 0)

    // Motors
    if (motorizedCount > 0) {
      const motorAddOn = availableAddOns.find((a) => a.name.toLowerCase().includes('motor') && !a.name.toLowerCase().includes('uni'))
      if (motorAddOn) {
        const qty = upgradeQtyOverrides[motorAddOn.id] ?? motorizedCount
        const price = upgradePriceOverrides[motorAddOn.id] ?? motorAddOn.price
        const HARD_WIRED_TYPES = ['AC 110 V', 'AC 110V Motor']
        const RECHARGEABLE_TYPES = ['Motorized', 'Battery Powered', 'Battery powered motor', 'Wand Motor']
        const hasHardWired = motorizedItems.some((i) => HARD_WIRED_TYPES.includes(i.controlType || ''))
        const hasRechargeable = motorizedItems.some((i) => RECHARGEABLE_TYPES.includes(i.controlType || ''))
        let motorName = motorAddOn.name
        if (motorAddOn.name.toLowerCase().includes('motor') && !motorAddOn.name.toLowerCase().includes('uni')) {
          if (hasRechargeable && !hasHardWired) motorName = 'Rechargeable Motor'
          else if (hasHardWired && !hasRechargeable) motorName = 'Hard Wired Motor'
        }
        upgrades.push({ addOnId: motorAddOn.id, name: motorName, quantity: qty, unitPrice: price, total: price * qty, removable: false })
      }
    }

    // Remote: 1 per room with motorized where Remote = Yes
    if (uniqueMotorizedRoomsWithRemote.size > 0 && motorizedCount > 0) {
      const remoteAddOn = availableAddOns.find((a) => a.name === 'Remote')
      if (remoteAddOn) {
        const qty = upgradeQtyOverrides[remoteAddOn.id] ?? uniqueMotorizedRoomsWithRemote.size
        const price = upgradePriceOverrides[remoteAddOn.id] ?? remoteAddOn.price
        upgrades.push({ addOnId: remoteAddOn.id, name: 'Remote', quantity: qty, unitPrice: price, total: price * qty, removable: false })
      }
    }

    // Charger: 1 per order if motorized AND no solar panel AND not all AC 110V/hard wired
    if (motorizedCount > 0 && solarCount === 0 && !allAC110orHardWired && !hasAC12V) {
      const chargerAddOn = availableAddOns.find((a) => a.name === 'Charger')
      if (chargerAddOn) {
        const qty = upgradeQtyOverrides[chargerAddOn.id] ?? 1
        const price = upgradePriceOverrides[chargerAddOn.id] ?? chargerAddOn.price
        upgrades.push({ addOnId: chargerAddOn.id, name: 'Charger', quantity: qty, unitPrice: price, total: price * qty, removable: false })
      }
    }

    // Distribution Box: for AC 12V/24V
    if (hasAC12V) {
      const distBox = availableAddOns.find((a) => a.name === 'Distribution Box')
      if (distBox) {
        const qty = upgradeQtyOverrides[distBox.id] ?? 1
        const price = upgradePriceOverrides[distBox.id] ?? distBox.price
        upgrades.push({ addOnId: distBox.id, name: 'Distribution Box', quantity: qty, unitPrice: price, total: price * qty, removable: false })
      }
    }

    // Solar Panel
    if (solarCount > 0) {
      const solarAddOn = availableAddOns.find((a) => a.name === 'Solar Panel')
      if (solarAddOn) {
        const qty = upgradeQtyOverrides[solarAddOn.id] ?? solarCount
        const price = upgradePriceOverrides[solarAddOn.id] ?? solarAddOn.price
        upgrades.push({ addOnId: solarAddOn.id, name: 'Solar Panel', quantity: qty, unitPrice: price, total: price * qty, removable: false })
      }
    }

    // Smart Hub: 1 per order if motorized (removable)
    if (motorizedCount > 0) {
      const hubAddOn = availableAddOns.find((a) => a.name === 'Smart Hub')
      if (hubAddOn) {
        const qty = upgradeQtyOverrides[hubAddOn.id] ?? 1
        const price = upgradePriceOverrides[hubAddOn.id] ?? hubAddOn.price
        upgrades.push({ addOnId: hubAddOn.id, name: 'Smart Hub', quantity: qty, unitPrice: price, total: price * qty, removable: true })
      }
    }

    // Additional Services: Blinds Removal / Disposal
    if (additionalServices.includes('blinds_removal')) {
      const removalAddOn = availableAddOns.find((a) => a.name === 'Blinds Removal')
      if (removalAddOn) {
        const qty = upgradeQtyOverrides[removalAddOn.id] ?? totalShadeCount
        const price = upgradePriceOverrides[removalAddOn.id] ?? removalAddOn.price
        upgrades.push({ addOnId: removalAddOn.id, name: 'Blinds Removal', quantity: qty, unitPrice: price, total: price * qty, removable: false })
      }
    }
    if (additionalServices.includes('blinds_disposal')) {
      const disposalAddOn = availableAddOns.find((a) => a.name === 'Blinds Disposal')
      if (disposalAddOn) {
        const qty = upgradeQtyOverrides[disposalAddOn.id] ?? totalShadeCount
        const price = upgradePriceOverrides[disposalAddOn.id] ?? disposalAddOn.price
        upgrades.push({ addOnId: disposalAddOn.id, name: 'Blinds Disposal', quantity: qty, unitPrice: price, total: price * qty, removable: false })
      }
    }

    return upgrades
  }, [items, availableAddOns, upgradeQtyOverrides, upgradePriceOverrides, additionalServices])

  // Filter to show: users with role CUSTOMER + CRM customers (from Quick Quote conversion, etc.)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => u.role === 'CUSTOMER' || u.source === 'customer')
  }, [users])

  // Resolved side mark: from selected customer, locked prop, or new customer creation
  const resolvedSideMark = useMemo(() => {
    if (customerLocked && customerSideMark) return customerSideMark
    if (newCustomerSideMark) return newCustomerSideMark
    const sel = users.find((u) => u.id === selectedCustomerId)
    return sel?.sideMark || ''
  }, [customerLocked, customerSideMark, newCustomerSideMark, selectedCustomerId, users])

  // Cascade options derived from fabric gallery
  const productOptions = useMemo(() => {
    const cats = Array.from(new Set(fabricGallery.map((f) => f.category))).sort()
    // Group all "Exterior - ..." categories under a single "Exterior" option
    const hasExterior = cats.some((c) => c.startsWith('Exterior'))
    const filtered = cats.filter((c) => !c.startsWith('Exterior'))
    if (hasExterior) filtered.push('Exterior')
    return filtered.sort()
  }, [fabricGallery])

  // Sub-types available when "Exterior" is selected
  const exteriorTypeOptions = useMemo(() => {
    if (newItem.category !== 'Exterior') return []
    const extCats = Array.from(new Set(fabricGallery.filter((f) => f.category.startsWith('Exterior')).map((f) => f.category)))
    return extCats.map((c) => c.replace('Exterior - ', '')).filter(Boolean).sort()
  }, [fabricGallery, newItem.category])

  // Resolve the actual fabric category for filtering (maps "Exterior" + exteriorType back to full category)
  const resolvedCategory = useMemo(() => {
    if (newItem.category === 'Exterior' && newItem.exteriorType) {
      return `Exterior - ${newItem.exteriorType}`
    }
    return newItem.category
  }, [newItem.category, newItem.exteriorType])

  const opennessOptions = useMemo(() => {
    if (!resolvedCategory) return []
    return Array.from(new Set(fabricGallery.filter((f) => f.category === resolvedCategory).map((f) => f.subcategory))).filter(Boolean).sort()
  }, [fabricGallery, resolvedCategory])

  const collectionOptions = useMemo(() => {
    if (!resolvedCategory || !newItem.subcategory) return []
    return Array.from(new Set(
      fabricGallery
        .filter((f) => f.category === resolvedCategory && f.subcategory === newItem.subcategory)
        .map((f) => f.collection)
    )).filter(Boolean).sort()
  }, [fabricGallery, resolvedCategory, newItem.subcategory])

  const fabricOptions = useMemo(() => {
    if (!resolvedCategory || !newItem.subcategory) return []
    // For Exterior items skip the collection step — show fabrics directly by category + subcategory
    const skipCollection = newItem.category === 'Exterior' || newItem.category.startsWith('Exterior') || collectionOptions.length === 0
    if (skipCollection) {
      return fabricGallery.filter(
        (f) => f.category === resolvedCategory && f.subcategory === newItem.subcategory
      )
    }
    if (!newItem.subSubcategory) return []
    return fabricGallery.filter(
      (f) => f.category === resolvedCategory && f.subcategory === newItem.subcategory && f.collection === newItem.subSubcategory
    )
  }, [fabricGallery, resolvedCategory, newItem.category, newItem.subcategory, newItem.subSubcategory, collectionOptions.length])

  // Validate width against selected fabric's max width
  const selectedFabricMaxWidth = useMemo(() => {
    if (!newItem.fabricId) return null
    const fabric = fabricGallery.find((f) => f.id === newItem.fabricId)
    if (!fabric?.maxWidth) return null
    return parseFloat(fabric.maxWidth)
  }, [fabricGallery, newItem.fabricId])

  const widthExceedsMax = selectedFabricMaxWidth !== null && getFullWidth > selectedFabricMaxWidth

  // Duo Shades: disable fabric wrap if fabricWidth < 3"
  const disableFabricWrap = useMemo(() => {
    if (!newItem.fabricId) return false
    const fabric = fabricGallery.find((f) => f.id === newItem.fabricId)
    if (!fabric) return false
    return fabric.category === 'Duo Shades' && typeof (fabric as any).fabricWidth === 'number' && (fabric as any).fabricWidth < 3
  }, [fabricGallery, newItem.fabricId])

  // Open Roll cassette option is available for Roller Shades and Exterior products
  const isRollerOrExterior = (cat: string) => cat === 'Roller Shades' || cat === 'Exterior' || cat.startsWith('Exterior -')
  // Roller Custom column only for Roller Shades
  const showRollerColumn = newItem.category === 'Roller Shades' || items.some((item) => item.category === 'Roller Shades')

  // ── Exclusion rules ──
  // Exterior: no fabric wrap, no side channel
  const isExteriorCategory = newItem.category === 'Exterior' || newItem.category.startsWith('Exterior')
  // Duo shades: no Sealed bottom rail option
  const isDuoShadeCategory = resolvedCategory?.startsWith('Duo') || newItem.collectionId?.startsWith('duo')
  // Product field visibility rules from settings store
  const productFieldRules = qopts.getProductRules(newItem.category)

  const gridCols = showRollerColumn
    ? 'grid-cols-[150px_85px_85px_1fr_1fr_1fr_90px_95px_95px_95px_40px]'
    : 'grid-cols-[150px_85px_85px_1fr_1fr_1fr_95px_95px_95px_40px]'

  // Validate width/length against pricing chart min/max range
  const dimensionWarning = useMemo(() => {
    if (!newItem.collectionId || !newItem.widthWhole || !newItem.lengthWhole) return null
    const chart = getChart(newItem.collectionId as CollectionId)
    if (!chart) return null

    const width = Math.round(getFullWidth)
    const length = Math.round(getFullLength)
    const widths = chart.mainTable.widthValues
    const lengths = chart.mainTable.lengthValues
    if (!widths.length || !lengths.length) return null

    const minW = Math.min(...widths)
    const maxW = Math.max(...widths)
    const minL = Math.min(...lengths)
    const maxL = Math.max(...lengths)

    const issues: string[] = []
    if (width < minW) issues.push(`Width ${width}" is below the minimum (${minW}")`)
    if (width > maxW) issues.push(`Width ${width}" exceeds the maximum (${maxW}")`)
    if (length < minL) issues.push(`Length ${length}" is below the minimum (${minL}")`)
    if (length > maxL) issues.push(`Length ${length}" exceeds the maximum (${maxL}")`)

    return issues.length > 0 ? issues : null
  }, [newItem.collectionId, newItem.widthWhole, newItem.lengthWhole, getFullWidth, getFullLength, getChart])

  // Calculate base price from pricing chart (before adjustments)
  const computedBasePrice = useMemo(() => {
    // If manual override is set, use that as base price
    if (newItemPriceOverride !== null) {
      return newItemPriceOverride
    }

    if (!newItem.collectionId || !newItem.widthWhole || !newItem.lengthWhole) return 0

    const chart = getChart(newItem.collectionId as CollectionId)
    if (!chart) return 0

    const width = Math.round(getFullWidth)
    const length = Math.round(getFullLength)

    // Return 0 if dimensions are outside the pricing chart range
    const widths = chart.mainTable.widthValues
    const lengths = chart.mainTable.lengthValues
    if (widths.length && lengths.length) {
      if (width < Math.min(...widths) || width > Math.max(...widths) ||
          length < Math.min(...lengths) || length > Math.max(...lengths)) {
        return 0
      }
    }

    // Find closest width and length values
    const findClosest = (value: number, array: number[]) => {
      return array.reduce((prev, curr) =>
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
      )
    }

    const closestWidth = findClosest(width, chart.mainTable.widthValues)
    const closestLength = findClosest(length, chart.mainTable.lengthValues)

    // Lookup base price
    const basePrice = chart.mainTable.prices[String(closestLength)]?.[String(closestWidth)] || 0

    // Add cassette price if selected (not for open roll)
    let cassettePrice = 0
    if (newItem.cassetteType && newItem.cassetteType !== 'OPEN_ROLL' && chart.cassetteTable) {
      const cassettePriceValue =
        chart.cassetteTable.prices[newItem.cassetteType]?.[String(closestWidth)] || 0
      cassettePrice = cassettePriceValue
    }

    // Add $30 fabric wrap surcharge if wrap is Same or Other
    const wrapSurcharge = (newItem.fabricWrap === 'same' || newItem.fabricWrap === 'other') ? 30 : 0

    // Add $75 side channel surcharge if any side channel is selected
    const sideChannelSurcharge = (newItem.sideChannel && newItem.sideChannel !== 'None') ? 75 : 0

    return basePrice + cassettePrice + wrapSurcharge + sideChannelSurcharge
  }, [newItem.collectionId, getFullWidth, getFullLength, newItem.cassetteType, newItem.fabricWrap, newItem.sideChannel, getChart, newItemPriceOverride])

  // Calculate final price (base + adjustments)
  const computedPrice = useMemo(() => {
    const basePrice = computedBasePrice
    // Apply global adjustments
    return basePrice * (1 + globalAdjust.percent / 100) + globalAdjust.flat
  }, [computedBasePrice, globalAdjust])

  const addItem = () => {
    const width = getFullWidth
    const length = getFullLength
    const quantity = parseInt(newItem.quantity)
    if (
      !newItem.productName ||
      !newItem.collectionId ||
      isNaN(width) ||
      width <= 0 ||
      isNaN(length) ||
      length <= 0 ||
      isNaN(quantity)
    )
      return

    // Calculate base price (before adjustments)
    const basePrice = computedBasePrice
    
    // Apply global adjustments to get unit price
    const unitPrice = computedPrice
    const area = (width * length) / 144 // Convert square inches to square feet for display
    const totalPrice = unitPrice * quantity

    // Determine fabric wrap image - use fabricWrapImage if "other" was selected, none if "none", otherwise use fabricImage
    const fabricWrapImage = newItem.fabricWrap === 'none'
      ? ''
      : newItem.fabricWrap === 'other' && newItem.fabricWrapImage
        ? newItem.fabricWrapImage
        : newItem.fabricImage

    const itemId = editingItemId ?? Math.random().toString(36).substring(7)
    const item: QuoteItem = {
      id: itemId,
      productName: newItem.productName,
      category: resolvedCategory || '',
      subcategory: newItem.subcategory || undefined,
      subSubcategory: newItem.subSubcategory || undefined,
      width,
      length,
      area,
      unitPrice,
      quantity,
      totalPrice,
      basePrice,
      manualPriceOverride: newItemPriceOverride !== null ? newItemPriceOverride : undefined,
      fabricImage: newItem.fabricImage,
      cassetteImage: newItem.cassetteImage,
      collectionId: newItem.collectionId,
      fabricId: newItem.fabricId,
      cassetteType: newItem.cassetteType,
      cassetteColor: newItem.cassetteColor,
      fabricWrap: newItem.fabricWrap,
      fabricWrapImage: fabricWrapImage,
      roomType: newItem.roomType || undefined,
      sequence: newItem.sequence || undefined,
      controlType: newItem.controlType || undefined,
      controlChain: newItem.controlChain || undefined,
      controlChainColor: newItem.controlChainColor || undefined,
      controlChainSide: newItem.controlChainSide || undefined,
      mountType: newItem.mountType || undefined,
      bottomRailType: newItem.bottomRailType || undefined,
      bottomRailColor: newItem.bottomRailColor || undefined,
      sideChannel: newItem.sideChannel || undefined,
      sideChannelColor: newItem.sideChannelColor || undefined,
      solarPanel: newItem.solarPanel || undefined,
      bottomRailSealType: resolvedCategory === 'Roller Shades' ? (newItem.bottomRailSealType || undefined) : undefined,
      sequenceImage: newItem.sequenceImage || undefined,
      roll: newItem.roll || undefined,
      brackets: newItem.brackets || undefined,
      brackets2: newItem.brackets2 || undefined,
      stacks: newItem.stacks || undefined,
      springAssist: newItem.springAssist || undefined,
      remoteNumber: newItem.remoteNumber || undefined,
    }

    if (editingItemId) {
      setItems(items.map((i) => (i.id === editingItemId ? item : i)))
      setEditingItemId(null)
      const newOverrides = { ...priceOverrides }
      delete newOverrides[editingItemId]
      if (item.manualPriceOverride !== undefined) {
        newOverrides[item.id] = item.manualPriceOverride
      }
      setPriceOverrides(newOverrides)
    } else {
      setItems([...items, item])
    }

    // Reset form — clear product/fabric selection, keep sensible operation defaults
    setNewItem({
      productName: '',
      category: '',
      subcategory: '',
      subSubcategory: '',
      collectionId: '' as CollectionId | '',
      widthWhole: '',
      widthDecimal: '0',
      lengthWhole: '',
      lengthDecimal: '0',
      quantity: '1',
      fabricId: '',
      fabricImage: '',
      fabricCategory: '',
      cassetteType: '',
      cassetteImage: '',
      cassetteColor: '',
      fabricWrap: 'none',
      fabricWrapId: '',
      fabricWrapImage: '',
      roomType: '',
      sequence: '',
      controlType: 'Chain',
      controlChain: 'Default',
      controlChainColor: '',
      controlChainSide: 'R',
      mountType: 'Inside',
      bottomRailType: 'Exposed',
      bottomRailColor: '',
      bottomRailSealType: 'Brush S',
      sideChannel: 'None',
      sideChannelColor: '',
      solarPanel: 'No',
      sequenceImage: '',
      roll: 'Standard',
      brackets: '',
      brackets2: '',
      stacks: '',
      springAssist: '',
      exteriorType: '',
      remoteNumber: '',
    })

    setNewItemPriceOverride(null)
    setIsEditingNewItemPrice(false)
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
    // Remove price override if exists
    const newOverrides = { ...priceOverrides }
    delete newOverrides[id]
    setPriceOverrides(newOverrides)
  }

  const loadItemIntoForm = (item: QuoteItem) => {
    const widthForm = inchesToFormValues(item.width)
    const lengthForm = inchesToFormValues(item.length)
    // When editing, if category is "Exterior - X", split into category "Exterior" + exteriorType "X"
    const isExteriorItem = (item.category || '').startsWith('Exterior - ')
    const editCategory = isExteriorItem ? 'Exterior' : (item.category || '')
    const editExteriorType = isExteriorItem ? (item.category || '').replace('Exterior - ', '') : ''
    const exteriorCollectionMap: Record<string, CollectionId> = { 'Zip Track': 'zip', 'Wire Guide': 'wire_guide' }
    const editCollectionId = (item.collectionId || (isExteriorItem ? exteriorCollectionMap[editExteriorType] : '') || '') as CollectionId | ''

    setNewItem({
      productName: item.productName,
      category: editCategory,
      exteriorType: editExteriorType,
      subcategory: item.subcategory || '',
      subSubcategory: item.subSubcategory || '',
      collectionId: editCollectionId,
      widthWhole: widthForm.whole,
      widthDecimal: widthForm.decimal,
      lengthWhole: lengthForm.whole,
      lengthDecimal: lengthForm.decimal,
      quantity: String(item.quantity),
      fabricId: item.fabricId || '',
      fabricImage: item.fabricImage || '',
      fabricCategory: '',
      cassetteType: item.cassetteType || '',
      cassetteImage: item.cassetteImage || '',
      cassetteColor: item.cassetteColor || '',
      fabricWrap: (item.fabricWrap || 'none') as 'same' | 'other' | 'none',
      fabricWrapId: '',
      fabricWrapImage: item.fabricWrapImage || '',
      roomType: item.roomType || '',
      sequence: item.sequence || '',
      controlType: item.controlType || 'Chain',
      controlChain: item.controlChain || 'Default',
      controlChainColor: item.controlChainColor || '',
      controlChainSide: item.controlChainSide || 'R',
      mountType: item.mountType || 'Inside',
      bottomRailType: item.bottomRailType || 'Exposed',
      bottomRailColor: item.bottomRailColor || '',
      bottomRailSealType: item.bottomRailSealType || 'Brush S',
      sideChannel: item.sideChannel || 'None',
      sideChannelColor: item.sideChannelColor || '',
      solarPanel: item.solarPanel || 'No',
      sequenceImage: item.sequenceImage || '',
      roll: item.roll || 'Standard',
      brackets: item.brackets || '',
      brackets2: item.brackets2 || '',
      stacks: item.stacks || '',
      springAssist: item.springAssist || 'Yes',
      remoteNumber: item.remoteNumber || '',
    })
    setNewItemPriceOverride(item.manualPriceOverride ?? null)
    setIsEditingNewItemPrice(item.manualPriceOverride !== undefined)
    setActiveTab('products')
  }

  const duplicateItem = (item: QuoteItem) => {
    const newId = Math.random().toString(36).substring(7)
    const duplicate: QuoteItem = { ...item, id: newId }
    setItems([...items, duplicate])
    if (item.manualPriceOverride !== undefined) {
      setPriceOverrides((prev) => ({ ...prev, [newId]: item.manualPriceOverride! }))
    }
    setEditingItemId(newId)
    loadItemIntoForm(duplicate)
  }

  const handleEditItem = (item: QuoteItem) => {
    setEditingItemId(item.id)
    loadItemIntoForm(item)
  }

  // Apply to All handlers — applies current form values to all existing items
  const applyToAllOperation = () => {
    if (items.length === 0) return
    const motorized = isMotorizedOp(newItem.controlType)
    setItems(items.map((item) => ({
      ...item,
      controlType: newItem.controlType,
      controlChain: newItem.controlChain,
      controlChainColor: newItem.controlChainColor,
      controlChainSide: newItem.controlChainSide,
      mountType: newItem.mountType,
      solarPanel: motorized ? newItem.solarPanel : 'No',
    })))
  }

  const applyToAllCassette = () => {
    if (items.length === 0) return
    setItems(items.map((item) => {
      // Recalculate price with new wrap + side channel surcharges
      const oldWrapSurcharge = (item.fabricWrap === 'same' || item.fabricWrap === 'other') ? 30 : 0
      const newWrapSurcharge = (newItem.fabricWrap === 'same' || newItem.fabricWrap === 'other') ? 30 : 0
      const oldSideChannelSurcharge = (item.sideChannel && item.sideChannel !== 'None') ? 75 : 0
      const newSideChannelSurcharge = (newItem.sideChannel && newItem.sideChannel !== 'None') ? 75 : 0
      const priceDiff = (newWrapSurcharge - oldWrapSurcharge) + (newSideChannelSurcharge - oldSideChannelSurcharge)
      const newUnitPrice = item.unitPrice + priceDiff
      return {
        ...item,
        cassetteType: newItem.cassetteType,
        cassetteColor: newItem.cassetteColor,
        cassetteImage: newItem.cassetteImage,
        fabricWrap: newItem.fabricWrap,
        bottomRailType: newItem.bottomRailType,
        bottomRailColor: newItem.bottomRailColor,
        bottomRailSealType: newItem.bottomRailSealType,
        sideChannel: newItem.sideChannel,
        sideChannelColor: newItem.sideChannelColor,
        unitPrice: newUnitPrice,
        totalPrice: newUnitPrice * item.quantity,
      }
    }))
  }

  const applyToAllItem = () => {
    if (items.length === 0) return
    setItems(items.map((item) => ({
      ...item,
      roomType: newItem.roomType,
      sequence: newItem.sequence || item.sequence,
    })))
  }

  const applyToAllRoller = () => {
    if (items.length === 0) return
    setItems(items.map((item) => ({
      ...item,
      roll: newItem.roll,
      springAssist: newItem.springAssist,
    })))
  }

  const handleEditPrice = (item: QuoteItem) => {
    setEditingPriceItemId(item.id)
    setEditPriceValue(item.manualPriceOverride !== undefined ? String(item.manualPriceOverride) : String(item.basePrice || item.unitPrice))
  }

  const handleSavePriceEdit = () => {
    if (!editingPriceItemId) return
    
    const overrideValue = parseFloat(editPriceValue)
    if (isNaN(overrideValue) || overrideValue < 0) {
      alert('Please enter a valid price')
      return
    }

    // Update the item with new price override
    setItems(items.map((item) => {
      if (item.id === editingPriceItemId) {
        const basePrice = overrideValue
        const unitPrice = basePrice * (1 + globalAdjust.percent / 100) + globalAdjust.flat
        const totalPrice = unitPrice * item.quantity
        
        return {
          ...item,
          basePrice,
          manualPriceOverride: overrideValue,
          unitPrice,
          totalPrice,
        }
      }
      return item
    }))

    // Update price overrides state
    setPriceOverrides({
      ...priceOverrides,
      [editingPriceItemId]: overrideValue,
    })

    setEditingPriceItemId(null)
    setEditPriceValue('')
  }

  const handleCancelPriceEdit = () => {
    setEditingPriceItemId(null)
    setEditPriceValue('')
  }

  const handleCassetteSelect = (result: CassetteSelectionResult) => {
    if (result.cassetteType === 'OPEN_ROLL') {
      setNewItem({
        ...newItem,
        cassetteType: 'OPEN_ROLL',
        cassetteImage: '/images/fascia/default.jpg', // Fascia image for open roll
        cassetteColor: '',
        fabricWrap: 'same',
      })
    } else {
      setNewItem({
        ...newItem,
        cassetteType: result.cassetteType,
        cassetteColor: result.cassetteColor || '',
        fabricWrap: result.fabricWrap,
        // Note: Cassette image would need to be fetched from inventory or set based on type
        cassetteImage: result.cassetteType === 'ROUND CASETTE' ? '/images/cassettes/round.jpg' : '/images/cassettes/square.jpg',
      })
    }
  }

  const handleFabricWrapOther = () => {
    // Open fabric selection dialog for fabric wrap
    setFabricWrapDialogOpen(true)
  }

  const handleFabricWrapFabricSelect = (fabric: Fabric) => {
    setNewItem({
      ...newItem,
      fabricWrapId: fabric.id,
      fabricWrapImage: getFabricImageUrl(fabric) ?? '',
    })
    setFabricWrapDialogOpen(false)
  }

  const fabricCount = items.length
  // Auto-calculate installation cost when delivery method is INSTALLED
  const autoInstallationCost = useMemo(() => {
    if (deliveryMethod !== 'INSTALLED') return 0
    const exteriorQty = items
      .filter((i) => i.category === 'Exterior' || i.category?.startsWith('Exterior'))
      .reduce((sum, i) => sum + i.quantity, 0)
    const interiorQty = items
      .filter((i) => i.category !== 'Exterior' && !i.category?.startsWith('Exterior'))
      .reduce((sum, i) => sum + i.quantity, 0)
    let cost = 0
    if (interiorQty > 0) cost += 300
    if (exteriorQty === 1) cost += 500
    else if (exteriorQty > 1) cost += exteriorQty * 350
    return cost
  }, [deliveryMethod, items])

  const effectiveInstallationAmount = deliveryMethod === 'INSTALLED'
    ? (manualInstallationAmount !== null ? manualInstallationAmount : autoInstallationCost)
    : 0
  const effectiveShippingCost = deliveryMethod === 'SHIPPED' ? shippingCost : 0

  const itemsSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const getAddOnLineTotal = (price: number, quantity: number | undefined) =>
    quantity != null && quantity > 0 ? price * quantity : price * fabricCount
  const addOnsTotal = computedUpgrades.reduce((sum, u) => sum + u.total, 0)
  const subtotal = itemsSubtotal + addOnsTotal

  // Discount calculation
  const discountAmount = discountType === 'Percentage'
    ? subtotal * (discountValue / 100)
    : discountType === 'Fixed'
      ? discountValue
      : 0
  const afterDiscount = subtotal - discountAmount
  const effectiveTaxRate = (customerTaxExempt || isTaxExempt) ? 0 : taxRate
  const taxAmount = afterDiscount * (effectiveTaxRate / 100)
  const total = afterDiscount + taxAmount + effectiveInstallationAmount + effectiveShippingCost
  const effectiveAdminNote = [adminNote, remeasurementRequired === 'YES' ? 'Remeasurement Required: Yes' : ''].filter(Boolean).join('\n')

  // Footer counters
  const totalShades = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalMotors = items.filter((i) => isMotorizedOp(i.controlType || '')).reduce((sum, i) => sum + i.quantity, 0)
  const totalRemote = items
    .filter((i) => isMotorizedOp(i.controlType || '') && (i.controlChainColor || 'Yes') !== 'No')
    .reduce((sum, i) => sum + i.quantity, 0)
  const totalCharger = computedUpgrades.find((u) => u.name?.toLowerCase().includes('charger'))?.quantity ?? 0
  const totalHub = computedUpgrades.find((u) => u.name?.toLowerCase().includes('hub'))?.quantity ?? 0

  const handleCreateCustomer = async (): Promise<boolean> => {
    if (!newCustomerFirstName.trim() || !newCustomerLastName.trim()) {
      alert('Please enter first and last name.')
      return false
    }
    const pErr = validatePhone(customerPhone)
    const mErr = validatePhone(customerMobile)
    if (pErr || mErr) {
      setPhoneError(pErr)
      setMobileError(mErr)
      alert(pErr || mErr)
      return false
    }

    setCreatingCustomer(true)
    const fullName = `${newCustomerFirstName.trim()} ${newCustomerLastName.trim()}`
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName,
          type: newCustomerType,
          email: customerEmail.trim() || undefined,
          phone: customerPhone.trim() || undefined,
          mobile: customerMobile.trim() || undefined,
          street: [customerStreet.trim(), customerSuite.trim()].filter(Boolean).join(', ') || undefined,
          town: customerTown.trim() || undefined,
          city: customerCity.trim() || undefined,
          country: customerCountry.trim() || undefined,
          postcode: customerPostcode.trim() || undefined,
          source: newCustomerSource,
          companyName: newCustomerType === 'COMMERCIAL' ? newCustomerCompanyName.trim() || undefined : undefined,
          companyType: newCustomerType === 'COMMERCIAL' ? newCustomerCompanyType || undefined : undefined,
          taxExempt: newCustomerType === 'COMMERCIAL' ? newCustomerTaxExempt : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create customer')
      }

      const data = await response.json()
      const newCustomerId = data.customer.id || data.customer._id

      if (newCustomerType === 'COMMERCIAL' && newCustomerTaxExempt && pendingTaxExemptionFile) {
        setTaxExemptionUploading(true)
        try {
          await uploadTaxExemptionCertificate(newCustomerId, pendingTaxExemptionFile)
          setPendingTaxExemptionFile(null)
        } catch (uploadError) {
          console.error('Error uploading tax exemption certificate:', uploadError)
          alert(uploadError instanceof Error ? uploadError.message : 'Customer created, but exemption certificate upload failed.')
        } finally {
          setTaxExemptionUploading(false)
        }
      }

      setUsers(prev => [...prev, {
        id: newCustomerId,
        _id: newCustomerId,
        name: data.customer.name,
        email: data.customer.email,
        role: 'CUSTOMER',
        phone: data.customer.phone,
        mobile: customerMobile,
        street: [customerStreet, customerSuite].filter(Boolean).join(', '),
        town: customerTown,
        city: customerCity,
        country: customerCountry,
        postcode: customerPostcode,
        sideMark: data.customer.sideMark,
        customerType: newCustomerType,
        taxExempt: newCustomerType === 'COMMERCIAL' ? newCustomerTaxExempt : false,
      }])

      setSelectedCustomerId(newCustomerId)
      // Switch back to existing-customer mode so the dropdown shows the newly created customer
      setCustomerMode('existing')
      // Auto-populate ship-to from entered address
      setShipToStreet(customerStreet)
      setShipToCity(customerCity)
      setShipToState(customerTown)
      setShipToPostcode(customerPostcode)
      setShipToCountry(customerCountry)
      setNewCustomerFirstName('')
      setNewCustomerLastName('')
      setNewCustomerName('')
      setNewCustomerCompanyName('')
      setNewCustomerCompanyType('')
      setNewCustomerSideMark('')
      setNewCustomerTaxExempt(false)

      return true
    } catch (error) {
      console.error('Error creating customer:', error)
      alert(error instanceof Error ? error.message : 'Failed to create customer')
      return false
    } finally {
      setCreatingCustomer(false)
    }
  }

  const handleCreateAndContinue = async () => {
    const success = await handleCreateCustomer()
    if (success) {
      setActiveTab('products')
    }
  }

  const handleComplete = async () => {
    if (!token) return
    
    // Validate expiry date
    if (expiryDate && expiryDate < format(new Date(), 'yyyy-MM-dd')) {
      alert('Expiry date cannot be before today.')
      return
    }

    // Validation for creating new quotes
    if (!quoteId) {
      // Check if customer is selected
      const effectiveCustomerId = customerLocked ? (customerId || selectedCustomerId) : selectedCustomerId
      if (!effectiveCustomerId) {
        alert('Please select a customer before creating the quote.')
        return
      }
      
      // Check if quote has items
      if (items.length === 0) {
        alert('Please add at least one item to the quote.')
        return
      }
      
      // Check if all items have valid pricing
      const invalidItems = items.filter(item => item.totalPrice <= 0)
      if (invalidItems.length > 0) {
        alert('Please ensure all items have valid pricing.')
        return
      }

      // Contract type is required
      if (!contractType) {
        alert('Please select a contract type before creating the quote.')
        return
      }
    }
    
    setCreatingQuote(true)

    if (quoteId) {
      try {
        const updateAddOnsPayload: QuoteAddOn[] = computedUpgrades
          .filter((u) => u.quantity > 0)
          .map((u) => ({
            addOnId: u.addOnId,
            name: u.name,
            pricePerFabric: u.unitPrice,
            fabricCount: items.length,
            total: u.total,
            quantity: u.quantity,
          }))
        await updateQuote(
          quoteId,
          {
            items,
            addOns: updateAddOnsPayload,
            subtotal: afterDiscount,
            taxRate: effectiveTaxRate,
            taxAmount,
            totalAmount: total,
            expiryDate,
            notes: notes || undefined,
            priceAdjustPercent: globalAdjust.percent,
            priceAdjustFlat: globalAdjust.flat,
            contractType: contractType || undefined,
            visuals: {
              fabricImage: items[0]?.fabricImage,
              cassetteImage: items[0]?.cassetteImage,
            },
            referenceNumber: resolvedSideMark || undefined,
            saleAgent: saleAgent || undefined,
            discountType: discountType !== 'No discount' ? discountType : undefined,
            discountValue: discountAmount > 0 ? discountValue : undefined,
            adminNote: effectiveAdminNote || undefined,
            installationAmount: effectiveInstallationAmount || undefined,
            deliveryMethod: deliveryMethod,
            shippingCost: effectiveShippingCost || undefined,
            shipToStreet: [shipToStreet, shipToSuite].filter(Boolean).join(', ') || undefined,
            shipToCity: shipToCity || undefined,
            shipToState: shipToState || undefined,
            shipToPostcode: shipToPostcode || undefined,
            shipToCountry: shipToCountry || undefined,
          } as any,
          token
        )
        onComplete(quoteId)
      } catch (error) {
        console.error('Error updating quote:', error)
        alert('Failed to update quote. Please try again.')
      } finally {
        setCreatingQuote(false)
      }
      return
    }
    
    const effectiveCustomerId = customerLocked ? (customerId || selectedCustomerId) : selectedCustomerId
    const selectedUser = users.find((u) => u.id === effectiveCustomerId)
    try {
      // Generate unique quote number
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const quoteNumber = `QT-${String(new Date().getFullYear()).slice(-2)}-${timestamp.toString().slice(-4)}${random}`
      
      const addOnsPayload: QuoteAddOn[] = computedUpgrades
        .filter((u) => u.quantity > 0)
        .map((u) => ({
          addOnId: u.addOnId,
          name: u.name,
          pricePerFabric: u.unitPrice,
          fabricCount: items.length,
          total: u.total,
          quantity: u.quantity,
        }))
      const newQuoteId = await addQuote(
        {
          id: '',
          quoteNumber,
          customerId: effectiveCustomerId,
          customerName: customerLocked ? (customerName || selectedUser?.name || 'Customer') : (selectedUser?.name || newCustomerName || 'New Customer'),
          sideMark: customerLocked ? (customerSideMark || undefined) : (selectedUser?.sideMark || newCustomerSideMark || undefined),
          status: 'SENT',
          items,
          subtotal: afterDiscount,
          taxRate: effectiveTaxRate,
          taxAmount,
          totalAmount: total,
          createdAt: format(new Date(), 'yyyy-MM-dd'),
          expiryDate,
          notes,
          priceAdjustPercent: globalAdjust.percent,
          priceAdjustFlat: globalAdjust.flat,
          contractType: contractType || undefined,
          visuals: {
            fabricImage: items[0]?.fabricImage,
            cassetteImage: items[0]?.cassetteImage,
          },
          addOns: addOnsPayload,
          referenceNumber: resolvedSideMark || undefined,
          saleAgent: saleAgent || undefined,
          discountType: discountType !== 'No discount' ? discountType : undefined,
          discountValue: discountAmount > 0 ? discountValue : undefined,
          adminNote: adminNote || undefined,
          installationAmount: effectiveInstallationAmount || undefined,
            deliveryMethod: deliveryMethod,
            shippingCost: effectiveShippingCost || undefined,
          shipToStreet: shipToStreet || undefined,
          shipToCity: shipToCity || undefined,
          shipToState: shipToState || undefined,
          shipToPostcode: shipToPostcode || undefined,
          shipToCountry: shipToCountry || undefined,
        } as any,
        token
      )
      onComplete(newQuoteId)
    } catch (error) {
      console.error('Error creating quote:', error)
      alert('Failed to create quote. Please try again.')
    } finally {
      setCreatingQuote(false)
    }
  }

  const handleDealerPlaceOrder = async () => {
    if (!token) return
    if (items.length === 0) {
      alert('Please add at least one item to the order.')
      return
    }
    const invalidItems = items.filter((item) => item.totalPrice <= 0)
    if (invalidItems.length > 0) {
      alert('Please ensure all items have valid pricing before placing the order.')
      return
    }
    setCreatingQuote(true)
    try {
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const quoteNumber = `QT-${String(new Date().getFullYear()).slice(-2)}-${timestamp.toString().slice(-4)}${random}`
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quoteNumber,
          items,
          subtotal: afterDiscount,
          taxRate: effectiveTaxRate,
          taxAmount,
          totalAmount: total,
          notes: notes || undefined,
          installationAmount: effectiveInstallationAmount || undefined,
            deliveryMethod: deliveryMethod,
            shippingCost: effectiveShippingCost || undefined,
          shipToStreet: shipToStreet || undefined,
          shipToCity: shipToCity || undefined,
          shipToState: shipToState || undefined,
          shipToPostcode: shipToPostcode || undefined,
          shipToCountry: shipToCountry || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to place order')
      }
      const data = await res.json()
      onComplete(data.quote.id)
    } catch (error) {
      console.error('Error placing dealer order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setCreatingQuote(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!token) return

    if (editingItemId) {
      alert('You have unsaved changes to a line item. Please save (✓) or cancel (✕) the current edit before saving the quote.')
      return
    }

    // Validate each item has all required fields filled in
    const incompleteItems: string[] = []
    items.forEach((item, idx) => {
      const isExterior = (item.category || '').startsWith('Exterior')
      const missing: string[] = []

      if (!item.controlType) missing.push('Operation')
      if (!isExterior) {
        if (!item.mountType) missing.push('Mount Type')
        if (!item.bottomRailType) missing.push('Bottom Rail')
      }

      if (missing.length > 0) {
        const label = item.roomType ? `"${item.roomType}"` : `Item ${idx + 1}`
        const fabric = item.productName?.split(' - ')[1] || item.productName || 'unnamed'
        incompleteItems.push(`• ${label} — ${fabric}: ${missing.join(', ')}`)
      }
    })

    if (incompleteItems.length > 0) {
      alert(`Cannot save — the following items are missing required fields:\n\n${incompleteItems.join('\n')}`)
      return
    }

    // Validation for drafts
    if (!quoteId) {
      const effectiveCustomerId = customerLocked ? (customerId || selectedCustomerId) : selectedCustomerId
      if (!effectiveCustomerId) {
        alert('Please select a customer before saving the draft.')
        return
      }
    }
    
    if (quoteId) {
      try {
        const draftAddOns: QuoteAddOn[] = computedUpgrades
          .filter((u) => u.quantity > 0)
          .map((u) => ({
            addOnId: u.addOnId,
            name: u.name,
            pricePerFabric: u.unitPrice,
            fabricCount: items.length,
            total: u.total,
            quantity: u.quantity,
          }))
        await updateQuote(
          quoteId,
          {
            items,
            subtotal: afterDiscount,
            taxRate: effectiveTaxRate,
            taxAmount,
            totalAmount: total,
            expiryDate,
            notes: notes || undefined,
            priceAdjustPercent: globalAdjust.percent,
            priceAdjustFlat: globalAdjust.flat,
            contractType: contractType || undefined,
            visuals: {
              fabricImage: items[0]?.fabricImage,
              cassetteImage: items[0]?.cassetteImage,
            },
            addOns: draftAddOns,
            referenceNumber: resolvedSideMark || undefined,
            saleAgent: saleAgent || undefined,
            discountType: discountType !== 'No discount' ? discountType : undefined,
            discountValue: discountAmount > 0 ? discountValue : undefined,
            adminNote: effectiveAdminNote || undefined,
            installationAmount: effectiveInstallationAmount || undefined,
            deliveryMethod: deliveryMethod,
            shippingCost: effectiveShippingCost || undefined,
            shipToStreet: [shipToStreet, shipToSuite].filter(Boolean).join(', ') || undefined,
            shipToCity: shipToCity || undefined,
            shipToState: shipToState || undefined,
            shipToPostcode: shipToPostcode || undefined,
            shipToCountry: shipToCountry || undefined,
          } as any,
          token
        )
        onComplete(quoteId)
      } catch (error) {
        console.error('Error updating quote:', error)
        alert('Failed to update quote. Please try again.')
      }
      return
    }
    
    const effectiveCustomerId = customerLocked ? (customerId || selectedCustomerId) : selectedCustomerId
    const selectedUser = users.find((u) => u.id === effectiveCustomerId)
    const draftAddOnsPayload: QuoteAddOn[] = computedUpgrades
      .filter((u) => u.quantity > 0)
      .map((u) => ({
        addOnId: u.addOnId,
        name: u.name,
        pricePerFabric: u.unitPrice,
        fabricCount: items.length,
        total: u.total,
        quantity: u.quantity,
      }))
    try {
      const newQuoteId = await addQuote(
        {
          id: '',
          quoteNumber: `QT-${String(new Date().getFullYear()).slice(-2)}-${String(Date.now()).slice(-4)}`,
          customerId: effectiveCustomerId,
          customerName: customerLocked ? (customerName || selectedUser?.name || 'Customer') : (selectedUser?.name || newCustomerName || 'New Customer'),
          sideMark: customerLocked ? (customerSideMark || undefined) : (selectedUser?.sideMark || newCustomerSideMark || undefined),
          status: 'DRAFT',
          items,
          subtotal: afterDiscount,
          taxRate: effectiveTaxRate,
          taxAmount,
          totalAmount: total,
          createdAt: format(new Date(), 'yyyy-MM-dd'),
          expiryDate,
          notes,
          priceAdjustPercent: globalAdjust.percent,
          priceAdjustFlat: globalAdjust.flat,
          contractType: contractType || undefined,
          visuals: {
            fabricImage: items[0]?.fabricImage,
            cassetteImage: items[0]?.cassetteImage,
          },
          addOns: draftAddOnsPayload,
          referenceNumber: resolvedSideMark || undefined,
          saleAgent: saleAgent || undefined,
          discountType: discountType !== 'No discount' ? discountType : undefined,
          discountValue: discountAmount > 0 ? discountValue : undefined,
          adminNote: adminNote || undefined,
          installationAmount: effectiveInstallationAmount || undefined,
            deliveryMethod: deliveryMethod,
            shippingCost: effectiveShippingCost || undefined,
          shipToStreet: shipToStreet || undefined,
          shipToCity: shipToCity || undefined,
          shipToState: shipToState || undefined,
          shipToPostcode: shipToPostcode || undefined,
          shipToCountry: shipToCountry || undefined,
        } as any,
        token
      )
      onComplete(newQuoteId)
    } catch (error) {
      console.error('Error creating draft:', error)
      alert('Failed to save draft. Please try again.')
    }
  }

  const renderEntryRow = () => (
    <div className={cn('grid gap-0 border-x border-b', gridCols, editingItemId ? 'bg-amber-50/30 dark:bg-amber-950/20 ring-2 ring-inset ring-amber-500' : 'bg-muted/5')}>
      {/* Area / QTY: qty first, then room type + sequence + photos */}
      <div className="px-1.5 py-1.5 border-r space-y-1 overflow-hidden">
        <Input type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} className="h-7 w-full text-center text-xs" title="Quantity" placeholder="QTY" />
        <Select
          value={newItem.roomType ? (qopts.roomTypes.includes(newItem.roomType) ? newItem.roomType : 'Other') : undefined}
          onValueChange={(v) => {
            if (v === '__add_new__') { setAddNewAreaMode(true); setAddNewAreaInput(''); return }
            setNewItem({ ...newItem, roomType: v })
            if (v !== 'Other') setCustomAreaInput('')
            setAddNewAreaMode(false)
          }}
        >
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Area" /></SelectTrigger>
          <SelectContent>
            {qopts.roomTypes.map((rt) => (<SelectItem key={rt} value={rt}>{rt}</SelectItem>))}
            {!qopts.roomTypes.includes('Other') && <SelectItem value="Other">Other</SelectItem>}
            <SelectItem value="__add_new__" className="text-primary font-medium">+ Add New</SelectItem>
          </SelectContent>
        </Select>
        {addNewAreaMode && (
          <div className="flex gap-1">
            <Input
              value={addNewAreaInput}
              onChange={(e) => setAddNewAreaInput(e.target.value)}
              placeholder="New area name…"
              className="h-7 text-xs flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const t = addNewAreaInput.trim()
                  if (t && !qopts.roomTypes.includes(t)) {
                    const withoutOther = qopts.roomTypes.filter(r => r !== 'Other')
                    qopts.setRoomTypes([...withoutOther, t, ...(qopts.roomTypes.includes('Other') ? ['Other'] : [])])
                  }
                  if (t) setNewItem({ ...newItem, roomType: t })
                  setAddNewAreaMode(false); setAddNewAreaInput('')
                }
                if (e.key === 'Escape') { setAddNewAreaMode(false); setAddNewAreaInput('') }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const t = addNewAreaInput.trim()
                if (t && !qopts.roomTypes.includes(t)) {
                  const withoutOther = qopts.roomTypes.filter(r => r !== 'Other')
                  qopts.setRoomTypes([...withoutOther, t, ...(qopts.roomTypes.includes('Other') ? ['Other'] : [])])
                }
                if (t) setNewItem({ ...newItem, roomType: t })
                setAddNewAreaMode(false); setAddNewAreaInput('')
              }}
              className="h-7 w-7 flex items-center justify-center rounded border bg-background hover:bg-muted shrink-0"
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
            </button>
          </div>
        )}
        {!addNewAreaMode && (newItem.roomType === 'Other' || (!qopts.roomTypes.includes(newItem.roomType) && newItem.roomType)) && (
          <Input
            value={customAreaInput || (newItem.roomType !== 'Other' ? newItem.roomType : '')}
            onChange={(e) => { setCustomAreaInput(e.target.value); setNewItem({ ...newItem, roomType: e.target.value || 'Other' }) }}
            placeholder="Custom area name…"
            className="h-7 text-xs w-full"
          />
        )}
        <Select value={newItem.sequence || undefined} onValueChange={(v) => setNewItem({ ...newItem, sequence: v })}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Sequence" /></SelectTrigger>
          <SelectContent>{qopts.sequenceOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
        </Select>
        <div className="flex gap-1">
          {/* Upload from gallery */}
          <label className="cursor-pointer flex h-7 flex-1 items-center justify-center gap-1 rounded border bg-background hover:bg-muted text-[10px] text-muted-foreground" title="Upload photo">
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !token) return; const fd = new FormData(); fd.append('file', file); try { const res = await fetch('/api/quotes/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }); if (res.ok) { const data = await res.json(); setNewItem((prev) => ({ ...prev, sequenceImage: data.url })) } } catch {} e.target.value = '' }} />
            <ImagePlus className="h-3 w-3" />
          </label>
          {/* Take photo with camera */}
          <label className="cursor-pointer flex h-7 flex-1 items-center justify-center gap-1 rounded border bg-background hover:bg-muted text-[10px] text-muted-foreground" title="Take photo">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !token) return; const fd = new FormData(); fd.append('file', file); try { const res = await fetch('/api/quotes/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }); if (res.ok) { const data = await res.json(); setNewItem((prev) => ({ ...prev, sequenceImage: data.url })) } } catch {} e.target.value = '' }} />
            <Camera className="h-3 w-3" />
          </label>
        </div>
        {newItem.sequenceImage && <div className="relative h-7 w-7 border rounded overflow-hidden"><Image src={newItem.sequenceImage} alt="" fill className="object-cover" sizes="28px" unoptimized /></div>}
      </div>
      {/* Width */}
      <div className="px-1.5 py-1.5 border-r space-y-1">
        <Input type="number" min={0} value={newItem.widthWhole || ''} onChange={(e) => { const v = e.target.value; if (v === '' || parseFloat(v) >= 0) setNewItem({ ...newItem, widthWhole: v }) }} placeholder="Whole" className="h-7 text-xs w-full" />
        <Select value={newItem.widthDecimal} onValueChange={(v) => setNewItem({ ...newItem, widthDecimal: v })}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{decimalFractions.map((frac) => (<SelectItem key={frac.value} value={frac.value}>{frac.label}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      {/* Length */}
      <div className="px-1.5 py-1.5 border-r space-y-1">
        <Input type="number" min={0} value={newItem.lengthWhole || ''} onChange={(e) => { const v = e.target.value; if (v === '' || parseFloat(v) >= 0) setNewItem({ ...newItem, lengthWhole: v }) }} placeholder="Whole" className="h-7 text-xs w-full" />
        <Select value={newItem.lengthDecimal} onValueChange={(v) => setNewItem({ ...newItem, lengthDecimal: v })}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{decimalFractions.map((frac) => (<SelectItem key={frac.value} value={frac.value}>{frac.label}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      {/* Item: category cascade → fabric */}
      <div className="px-1.5 py-1.5 border-r space-y-1">
        {fabricGalleryLoading ? (
          <div className="h-7 flex items-center text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin mr-1" />Loading</div>
        ) : (
          <Select value={newItem.category || undefined} onValueChange={(v) => setNewItem({ ...newItem, category: v, exteriorType: '', subcategory: '', subSubcategory: '', collectionId: '' as CollectionId | '', fabricId: '', fabricImage: '', productName: '', bottomRailSealType: v === 'Roller Shades' ? (newItem.bottomRailSealType || 'Brush S') : '' })}>
            <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Product" /></SelectTrigger>
            <SelectContent>{productOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        )}
        {newItem.category === 'Exterior' && (
          <Select value={newItem.exteriorType || undefined} onValueChange={(v) => setNewItem({ ...newItem, exteriorType: v, subcategory: '', subSubcategory: '', collectionId: '' as CollectionId | '', fabricId: '', fabricImage: '', productName: '' })}>
            <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Ext. Type" /></SelectTrigger>
            <SelectContent>{exteriorTypeOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        )}
        <Select value={newItem.subcategory || undefined} onValueChange={(v) => setNewItem({ ...newItem, subcategory: v, subSubcategory: '', collectionId: '' as CollectionId | '', fabricId: '', fabricImage: '', productName: '' })} disabled={!(newItem.category === 'Exterior' ? newItem.exteriorType : newItem.category) || opennessOptions.length === 0}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Openness" /></SelectTrigger>
          <SelectContent>{opennessOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
        </Select>
        {!isExteriorCategory && collectionOptions.length > 0 && (
          <Select value={newItem.subSubcategory || undefined} onValueChange={(v) => setNewItem({ ...newItem, subSubcategory: v, collectionId: '' as CollectionId | '', fabricId: '', fabricImage: '', productName: '' })} disabled={!newItem.subcategory}>
            <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Collection" /></SelectTrigger>
            <SelectContent>{collectionOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        )}
        <div className="flex gap-1 items-center">
          <Select value={newItem.fabricId || undefined} onValueChange={(v) => { const fabric = fabricOptions.find((f) => f.id === v); if (!fabric) return; const namePrefix = newItem.exteriorType || newItem.subSubcategory || newItem.subcategory || ''; const exteriorCollectionMap: Record<string, CollectionId> = { 'Zip Track': 'zip', 'Wire Guide': 'wire_guide' }; const derivedCollectionId = (fabric.pricingCollectionId || (isExteriorCategory ? exteriorCollectionMap[newItem.exteriorType || ''] : '') || '') as CollectionId | ''; setNewItem({ ...newItem, productName: `${namePrefix} - ${fabric.color}`, collectionId: derivedCollectionId, fabricId: fabric.id, fabricImage: getFabricImageUrl(fabric) ?? '', fabricCategory: fabric.category }) }} disabled={(!isExteriorCategory && collectionOptions.length > 0 && !newItem.subSubcategory) || fabricOptions.length === 0}>
            <SelectTrigger className="h-7 flex-1 text-xs"><SelectValue placeholder="Fabric" /></SelectTrigger>
            <SelectContent>{fabricOptions.map((f) => (<SelectItem key={f.id} value={f.id}>{f.color}</SelectItem>))}</SelectContent>
          </Select>
          {newItem.fabricImage && <div className="relative h-7 w-7 border rounded overflow-hidden shrink-0"><Image src={newItem.fabricImage} alt="Fabric" fill className="object-contain p-0.5" sizes="28px" unoptimized onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /></div>}
        </div>
      </div>
      {/* Operation & Mount */}
      <div className="px-1.5 py-1.5 border-r space-y-1">
        <Select value={newItem.controlType || (isExteriorCategory ? undefined : 'Chain')} onValueChange={(v) => { let dc = ''; if (isMotorizedOp(v)) dc = 'CH'; else if (v === 'Chain') dc = 'Default'; else if (v === 'Cord') dc = 'Default'; else if (v === 'Wand') dc = 'Standard'; const ds = (v === 'Chain' || v === 'Cord') ? 'Standard' : 'R'; setNewItem({ ...newItem, controlType: v, controlChain: dc, controlChainColor: isMotorizedOp(v) ? 'Yes' : '', controlChainSide: ds, solarPanel: (isMotorizedOp(v) && !['AC 110 V', 'AC 110V Motor', 'AC 12V/24V', 'Hard Wired Motor'].includes(v)) ? newItem.solarPanel : 'No', remoteNumber: '' }) }}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Operation" /></SelectTrigger>
          <SelectContent>
            {isExteriorCategory ? (
              <>
                <SelectGroup>
                  <SelectLabel className="text-[10px] px-2 py-1">Motorized</SelectLabel>
                  {qopts.exteriorMotorizedOperations.map((op) => (<SelectItem key={op} value={op}>{op}</SelectItem>))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="text-[10px] px-2 py-1">Manual</SelectLabel>
                  {qopts.exteriorManualOperations.map((op) => (<SelectItem key={op} value={op}>{op}</SelectItem>))}
                </SelectGroup>
              </>
            ) : (
              <>
                <SelectGroup>
                  <SelectLabel className="text-[10px] px-2 py-1">Motorized</SelectLabel>
                  {qopts.motorizedOperations.filter(op => op !== 'Motorized').map((op) => (
                    <SelectItem key={op} value={op} className="pl-5">{op}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="text-[10px] px-2 py-1">Manual</SelectLabel>
                  {qopts.manualOperations.map((op) => (<SelectItem key={op} value={op}>{op}</SelectItem>))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>
        {isMotorizedOp(newItem.controlType) ? (
          <div className="space-y-1">
            <div className="flex gap-1">
              <Select value={newItem.controlChainColor || 'Yes'} onValueChange={(v) => setNewItem({ ...newItem, controlChainColor: v, remoteNumber: v === 'No' ? '' : newItem.remoteNumber })}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>{REMOTE_OPTIONS.map((r) => (<SelectItem key={r} value={r}>{r === 'Yes' ? 'Remote: Yes' : 'Remote: No'}</SelectItem>))}</SelectContent>
              </Select>
              {newItem.controlChainColor !== 'No' && (
                <Input placeholder="Remote#" value={newItem.remoteNumber} onChange={(e) => setNewItem({ ...newItem, remoteNumber: e.target.value })} className="h-7 w-16 text-xs" />
              )}
            </div>
            <div className="flex gap-1">
              <Select value={newItem.controlChain || 'CH'} onValueChange={(v) => setNewItem({ ...newItem, controlChain: v })}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MOTOR_CHANNELS.map((ch) => (<SelectItem key={ch} value={ch}>{ch === 'CH' ? 'Ch #' : `CH ${ch}`}</SelectItem>))}</SelectContent>
              </Select>
              <Select value={newItem.controlChainSide || 'R'} onValueChange={(v) => setNewItem({ ...newItem, controlChainSide: v })}>
                <SelectTrigger className="h-7 text-xs w-12"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="R">R</SelectItem><SelectItem value="L">L</SelectItem></SelectContent>
              </Select>
              {!['AC 110 V', 'AC 110V Motor', 'AC 12V/24V', 'Hard Wired Motor'].includes(newItem.controlType || '') && (
                <Select value={newItem.solarPanel || 'No'} onValueChange={(v) => setNewItem({ ...newItem, solarPanel: v })}>
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="No">Solar: No</SelectItem><SelectItem value="Yes">Solar: Yes</SelectItem></SelectContent>
                </Select>
              )}
            </div>
          </div>
        ) : newItem.controlType === 'Chain' || newItem.controlType === 'Cord' ? (
          <div className="flex gap-1">
            <Select value={newItem.controlChain || 'Default'} onValueChange={(v) => setNewItem({ ...newItem, controlChain: v })}>
              <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>{(newItem.controlType === 'Chain' ? qopts.beadedChainColors : qopts.cordColors).map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={newItem.controlChainSide === 'R' || newItem.controlChainSide === 'L' || newItem.controlChainSide === '' ? 'Standard' : newItem.controlChainSide} onValueChange={(v) => setNewItem({ ...newItem, controlChainSide: v })}>
              <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Standard">Standard</SelectItem><SelectItem value="Custom Length">Custom</SelectItem></SelectContent>
            </Select>
          </div>
        ) : newItem.controlType === 'Wand' ? (
          <div className="flex gap-1">
            <Select value={newItem.controlChain || 'Standard'} onValueChange={(v) => setNewItem({ ...newItem, controlChain: v })}>
              <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>{WAND_TYPES.map((w) => (<SelectItem key={w} value={w}>{w}</SelectItem>))}</SelectContent>
            </Select>
            {newItem.controlChain === 'Custom Length' && (
              <Input placeholder="e.g. 48in" value={newItem.controlChainSide || ''} onChange={(e) => setNewItem({ ...newItem, controlChainSide: e.target.value })} className="h-7 text-xs flex-1" />
            )}
          </div>
        ) : <div className="text-xs text-muted-foreground py-1">N/A</div>}
        <Select value={newItem.mountType || undefined} onValueChange={(v) => setNewItem({ ...newItem, mountType: v })}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Mount" /></SelectTrigger>
          <SelectContent>{MOUNT_TYPES.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      {/* Cassette & Bottom Rail */}
      <div className="px-1.5 py-1.5 border-r space-y-1">
        {isExteriorCategory ? (
          <>
            {/* Exterior: Cassette Color + Bottom Rail Color */}
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground px-0.5">Cassette Color</p>
              <Select value={newItem.cassetteColor || undefined} onValueChange={(v) => setNewItem({ ...newItem, cassetteColor: v, bottomRailColor: newItem.bottomRailColor || v })}>
                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Select color…" /></SelectTrigger>
                <SelectContent>{qopts.exteriorComponentColors.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground px-0.5">Bottom Rail Color</p>
              <Select value={newItem.bottomRailColor || newItem.cassetteColor || undefined} onValueChange={(v) => setNewItem({ ...newItem, bottomRailColor: v })}>
                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Same as cassette" /></SelectTrigger>
                <SelectContent>{qopts.exteriorComponentColors.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            {productFieldRules.showCassette && (
              <div className="flex gap-1">
                <Select value={newItem.cassetteType || undefined} onValueChange={(v) => setNewItem({ ...newItem, cassetteType: v, cassetteColor: '', cassetteImage: v === 'OPEN_ROLL' ? '/images/fascia/default.jpg' : v === 'ROUND CASETTE' ? '/images/cassettes/round.jpg' : '/images/cassettes/square.jpg' })}>
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Cass." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SQUARE CASETTE">Square</SelectItem>
                    <SelectItem value="ROUND CASETTE">Round</SelectItem>
                    {isRollerOrExterior(newItem.category) && <SelectItem value="OPEN_ROLL">Open Roll</SelectItem>}
                  </SelectContent>
                </Select>
                <Select value={newItem.cassetteColor || undefined} onValueChange={(v) => setNewItem({ ...newItem, cassetteColor: v })} disabled={!newItem.cassetteType || newItem.cassetteType === 'OPEN_ROLL'}>
                  <SelectTrigger className="h-7 text-xs w-16"><SelectValue placeholder="Col." /></SelectTrigger>
                  <SelectContent>{(newItem.cassetteType === 'SQUARE CASETTE' ? ['Default', 'White', 'Ivory', 'Bronze', 'Anodized', 'Black'] : ['Default', 'White', 'Ivory', 'Grey', 'Bronze', 'Black']).map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            {productFieldRules.showWrap && (
              <div className="space-y-1">
                <Select value={newItem.fabricWrap} onValueChange={(v: 'same' | 'other' | 'none') => { setNewItem({ ...newItem, fabricWrap: v }); if (v === 'other') setFabricWrapDialogOpen(true) }}>
                  <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="C. Wrap" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">C. Wrap</SelectItem>
                    <SelectItem value="same">C. Wrap: Same Fabric</SelectItem>
                    <SelectItem value="other">C. Wrap: Other Fabric</SelectItem>
                  </SelectContent>
                </Select>
                {newItem.fabricWrap === 'other' && (
                  <div className="flex items-center gap-1.5">
                    {newItem.fabricWrapImage ? (
                      <div className="relative h-7 w-7 border rounded overflow-hidden shrink-0">
                        <Image src={newItem.fabricWrapImage} alt="Wrap fabric" fill className="object-cover" sizes="28px" unoptimized />
                      </div>
                    ) : null}
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs flex-1 px-2" onClick={() => setFabricWrapDialogOpen(true)}>
                      {newItem.fabricWrapImage ? 'Change Fabric' : 'Pick Fabric'}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Select value={newItem.bottomRailType || undefined} onValueChange={(v) => setNewItem({ ...newItem, bottomRailType: v, bottomRailColor: '' })}>
                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Bottom Rail" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wrapped">BR. Wrapped</SelectItem>
                  <SelectItem value="Exposed">BR. Exposed</SelectItem>
                  {!productFieldRules.hideSealed && <SelectItem value="Sealed">Sealed</SelectItem>}
                </SelectContent>
              </Select>
              {newItem.bottomRailType === 'Exposed' && (
                <Select value={newItem.bottomRailColor || undefined} onValueChange={(v) => setNewItem({ ...newItem, bottomRailColor: v })}>
                  <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Br Color" /></SelectTrigger>
                  <SelectContent>
                    {['White', 'Gray', 'Anodized', 'Ivory', 'Brown', 'Black'].map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
              {newItem.bottomRailType === 'Wrapped' && (
                <Select value={newItem.bottomRailColor || undefined} onValueChange={(v) => { setNewItem({ ...newItem, bottomRailColor: v }); if (v === 'Other Fabric') setFabricWrapDialogOpen(true) }}>
                  <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="BR. Wrap Fabric" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Same Fabric">Same Fabric</SelectItem>
                    <SelectItem value="Other Fabric">Other Fabric</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {productFieldRules.showBottomRailSeal && (
              <Select value={newItem.bottomRailSealType || undefined} onValueChange={(v) => setNewItem({ ...newItem, bottomRailSealType: v })}>
                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Seal Type" /></SelectTrigger>
                <SelectContent>{BOTTOM_RAIL_SEAL_TYPES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
              </Select>
            )}
            {productFieldRules.showSideChannel && (() => {
              const scSelected = newItem.sideChannel && newItem.sideChannel !== 'None'
                ? newItem.sideChannel.split(',').filter(Boolean)
                : []
              const scToggle = (val: string) => {
                const next = scSelected.includes(val) ? scSelected.filter(v => v !== val) : [...scSelected, val]
                setNewItem({ ...newItem, sideChannel: next.length ? next.join(',') : 'None' })
              }
              const scLabel = scSelected.length === 0 ? 'SC: None' : 'SC: ' + scSelected.map(v => SIDE_CHANNEL_OPTIONS.find(o => o.value === v)?.label.replace('Side Channel: ', '') ?? v).join(', ')
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs w-full justify-between font-normal">
                      <span className="truncate">{scLabel}</span>
                      <Plus className="h-3 w-3 ml-1 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-2 space-y-1" align="start">
                    {SIDE_CHANNEL_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer rounded px-1.5 py-1 hover:bg-muted text-xs">
                        <Checkbox checked={scSelected.includes(opt.value)} onCheckedChange={() => scToggle(opt.value)} className="h-3.5 w-3.5" />
                        {opt.label}
                      </label>
                    ))}
                    {scSelected.length > 0 && (
                      <button onClick={() => setNewItem({ ...newItem, sideChannel: 'None' })} className="w-full text-left text-[10px] text-muted-foreground hover:text-destructive pt-1 border-t mt-1 px-1.5">
                        Clear
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
              )
            })()}
          </>
        )}
      </div>
      {/* Roller Custom (conditional) */}
      {showRollerColumn && (
        <div className="px-1.5 py-1.5 border-r space-y-1">
          <Select value={newItem.roll || 'Standard'} onValueChange={(v) => setNewItem({ ...newItem, roll: v })}>
            <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLL_OPTIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={newItem.springAssist || 'Yes'} onValueChange={(v) => setNewItem({ ...newItem, springAssist: v })}>
            <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{SPRING_ASSIST_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      )}
      {/* Before Discount */}
      <div className="px-1.5 py-1.5 border-r flex items-start justify-end">
        {computedPrice > 0 ? <span className="text-xs text-muted-foreground line-through">{formatCurrency(computedPrice * 1.5)}</span> : <span className="text-xs text-muted-foreground">—</span>}
      </div>
      {/* Unit Price */}
      <div className="px-1.5 py-1.5 border-r flex flex-col items-end justify-start">
        {isEditingNewItemPrice ? (
          <Input type="number" step="0.01" value={newItemPriceOverride !== null ? newItemPriceOverride : computedBasePrice} onChange={(e) => { const v = parseFloat(e.target.value); setNewItemPriceOverride(isNaN(v) ? null : v) }} onBlur={() => { if (!newItemPriceOverride || newItemPriceOverride <= 0) setNewItemPriceOverride(null); setIsEditingNewItemPrice(false) }} autoFocus className="h-7 w-full text-right text-xs" />
        ) : (
          <button onClick={() => setIsEditingNewItemPrice(true)} className="text-xs font-medium text-gray-900 dark:text-white hover:text-amber-600 transition-colors">
            {computedPrice > 0 ? formatCurrency(computedPrice) : '—'}
          </button>
        )}
        {newItemPriceOverride !== null && <div className="text-[9px] text-orange-500">Override</div>}
      </div>
      {/* Total */}
      <div className="px-1.5 py-1.5 border-r flex items-start justify-end">
        <span className="text-xs font-semibold text-gray-900 dark:text-white">
          {computedPrice > 0 ? formatCurrency(computedPrice * (parseInt(newItem.quantity) || 1)) : '—'}
        </span>
      </div>
      {/* Actions: Add / Save + Cancel */}
      <div className="px-0.5 py-1.5 flex flex-col items-center gap-1">
        <Button
          size="icon"
          className="h-7 w-7 bg-amber-600 hover:bg-amber-700 text-white"
          onClick={addItem}
          disabled={!newItem.productName || !newItem.collectionId || !newItem.widthWhole || !newItem.lengthWhole || widthExceedsMax || !!dimensionWarning}
          title={editingItemId ? 'Save Changes' : 'Add Item'}
        >
          {editingItemId ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
        {editingItemId && (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => { setEditingItemId(null); setNewItem({ productName: '', category: '', subcategory: '', subSubcategory: '', collectionId: '' as CollectionId | '', widthWhole: '', widthDecimal: '0', lengthWhole: '', lengthDecimal: '0', quantity: '1', fabricId: '', fabricImage: '', fabricCategory: '', cassetteType: '', cassetteImage: '', cassetteColor: '', fabricWrap: 'none', fabricWrapId: '', fabricWrapImage: '', roomType: '', controlType: 'Chain', controlChain: 'Default', controlChainColor: '', controlChainSide: 'Standard', mountType: 'Inside', bottomRailType: 'Exposed', bottomRailColor: '', bottomRailSealType: 'Brush S', sideChannel: 'None', sideChannelColor: '', solarPanel: 'No', sequenceImage: '', roll: 'Standard', brackets: '', brackets2: '', stacks: '', springAssist: 'Yes', sequence: '', exteriorType: '', remoteNumber: '' }); setNewItemPriceOverride(null); setIsEditingNewItemPrice(false) }} title="Cancel">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  // THIS IS JUST THE RETURN BLOCK - will be copied into QuoteBuilder.tsx
  return (
    <div className="space-y-4">
      {/* ── HEADER SECTION ── */}
      {!dealerMode && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Customer + Bill To / Ship To */}
        <div className="space-y-4">
          {/* Customer Selector */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {customerLocked ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {(customerName || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimate for</p>
                    <p className="text-sm font-semibold">{customerName || selectedCustomerId || 'Customer'}</p>
                  </div>
                </div>
              ) : (
                <>
                  {customerMode === 'existing' ? (
                    <div className="space-y-1">
                      {usersLoading ? (
                        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                        </div>
                      ) : (
                        <Select
                          value={selectedCustomerId.startsWith('temp_') ? '' : selectedCustomerId}
                          onValueChange={(v) => {
                            if (v === '__new_customer__') {
                              setCustomerMode('new')
                              setShipToManuallyEdited(false)
                            } else {
                              setSelectedCustomerId(v || '')
                              setShipToManuallyEdited(false)
                            }
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Search and select a customer…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__new_customer__">
                              <div className="flex items-center gap-1.5 text-primary font-medium">
                                <UserPlus className="h-3.5 w-3.5" />
                                Add New Customer
                              </div>
                            </SelectItem>
                            {filteredUsers.length === 0 ? (
                              <div className="py-3 text-center text-sm text-muted-foreground">No customers found</div>
                            ) : (
                              filteredUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className="flex flex-col py-0.5">
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {selectedCustomerId && !selectedCustomerId.startsWith('temp_') && (
                        <>
                          <div className="grid gap-2 sm:grid-cols-2 mt-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Customer Type</Label>
                              <Select
                                value={selectedCustomerType || 'RESIDENTIAL'}
                                onValueChange={(v: any) => {
                                  setSelectedCustomerType(v)
                                  // Update local users array (type immediately, sidemark after API responds)
                                  setUsers(prev => prev.map(u => u.id === selectedCustomerId ? { ...u, customerType: v } : u))
                                  // Reset tax exempt if switching away from COMMERCIAL
                                  if (v !== 'COMMERCIAL') setIsTaxExempt(false)
                                  // Persist to DB and get regenerated sidemark
                                  const sel = users.find(u => u.id === selectedCustomerId)
                                  if (token && sel?.source === 'customer') {
                                    fetch(`/api/customers/${selectedCustomerId}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ type: v }),
                                    })
                                      .then(r => r.ok ? r.json() : null)
                                      .then(data => {
                                        if (data?.customer?.sideMark) {
                                          setUsers(prev => prev.map(u => u.id === selectedCustomerId ? { ...u, sideMark: data.customer.sideMark } : u))
                                        }
                                      })
                                      .catch(() => {})
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                                  <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                                  <SelectItem value="FRANCHISEE">Franchisee</SelectItem>
                                  <SelectItem value="PARTNER">Partner</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {resolvedSideMark && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Side Mark</Label>
                                <div className="flex items-center h-9 rounded-md border bg-primary/5 px-3">
                                  <span className="text-sm font-mono font-semibold tracking-wide">{resolvedSideMark}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setCustomerMode('existing')}>
                        &larr; Back to existing customers
                      </Button>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">First Name *</Label>
                          <Input placeholder="Jane" value={newCustomerFirstName} onChange={(e) => { setNewCustomerFirstName(e.target.value); setNewCustomerName(`${e.target.value} ${newCustomerLastName}`.trim()) }} className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Last Name *</Label>
                          <Input placeholder="Smith" value={newCustomerLastName} onChange={(e) => { setNewCustomerLastName(e.target.value); setNewCustomerName(`${newCustomerFirstName} ${e.target.value}`.trim()) }} className="h-9" />
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Customer Type *</Label>
                          <Select value={newCustomerType} onValueChange={(v: any) => setNewCustomerType(v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                              <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                              <SelectItem value="FRANCHISEE">Franchisee</SelectItem>
                              <SelectItem value="PARTNER">Partner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Side Mark (Preview)</Label>
                          <Input value={sideMarkPreview(newCustomerType, newCustomerSource)} readOnly className="h-9 bg-muted/50 font-mono text-xs" />
                        </div>
                      </div>
                      {newCustomerType === 'COMMERCIAL' && (
                        <>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Company Name</Label>
                              <Input placeholder="Company name" value={newCustomerCompanyName} onChange={(e) => setNewCustomerCompanyName(e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Company Type</Label>
                              {addNewCompanyTypeMode ? (
                                <div className="flex gap-1">
                                  <Input
                                    value={newCompanyTypeInput}
                                    onChange={(e) => setNewCompanyTypeInput(e.target.value)}
                                    placeholder="Enter company type…"
                                    className="h-9 text-xs"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && newCompanyTypeInput.trim()) {
                                        setNewCustomerCompanyType(newCompanyTypeInput.trim())
                                        setAddNewCompanyTypeMode(false)
                                        setNewCompanyTypeInput('')
                                      }
                                      if (e.key === 'Escape') { setAddNewCompanyTypeMode(false); setNewCompanyTypeInput('') }
                                    }}
                                  />
                                  <Button size="sm" variant="outline" className="h-9 px-2" onClick={() => { if (newCompanyTypeInput.trim()) { setNewCustomerCompanyType(newCompanyTypeInput.trim()); setAddNewCompanyTypeMode(false); setNewCompanyTypeInput('') } }}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => { setAddNewCompanyTypeMode(false); setNewCompanyTypeInput('') }}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <Select value={newCustomerCompanyType} onValueChange={(v) => { if (v === '__ADD_NEW__') { setAddNewCompanyTypeMode(true) } else { setNewCustomerCompanyType(v) } }}>
                                  <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MEDICAL_OFFICE">Medical Office</SelectItem>
                                    <SelectItem value="DENTAL_OFFICE">Dental Office</SelectItem>
                                    <SelectItem value="CORPORATE_OFFICE">Corporate Office</SelectItem>
                                    <SelectItem value="BUSINESS_OFFICE">Business Office</SelectItem>
                                    <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                    <SelectItem value="__ADD_NEW__">+ Add New</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="new-customer-tax-exempt"
                                checked={newCustomerTaxExempt}
                                onCheckedChange={(v) => { setNewCustomerTaxExempt(!!v); setIsTaxExempt(!!v) }}
                              />
                              <Label htmlFor="new-customer-tax-exempt" className="text-xs text-muted-foreground cursor-pointer">Tax Exempt</Label>
                              {newCustomerTaxExempt && <span className="ml-auto text-[10px] text-green-600 font-medium">Tax will not be applied</span>}
                            </div>
                            {newCustomerTaxExempt && (
                              <>
                                <Input placeholder="Tax exemption note (e.g. certificate #, reason)" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="h-8 text-xs" />
                                <div className="rounded-md border bg-background/70 p-2 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[11px] text-muted-foreground">
                                      {pendingTaxExemptionFile
                                        ? `Ready to upload: ${pendingTaxExemptionFile.name}`
                                        : 'Upload exemption certificate (saved to customer files).'}
                                    </p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => taxExemptionInputRef.current?.click()}
                                      disabled={taxExemptionUploading}
                                    >
                                      {taxExemptionUploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Paperclip className="h-3.5 w-3.5 mr-1" />}
                                      {pendingTaxExemptionFile ? 'Replace File' : 'Choose File'}
                                    </Button>
                                  </div>
                                  <input
                                    ref={taxExemptionInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return
                                      setPendingTaxExemptionFile(file)
                                      e.target.value = ''
                                    }}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    For new customers, upload completes automatically right after customer creation.
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Lead Source *</Label>
                          <Select value={newCustomerSource} onValueChange={setNewCustomerSource}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="META">Meta</SelectItem>
                              <SelectItem value="GOOGLE">Google</SelectItem>
                              <SelectItem value="REFERRAL">Referral</SelectItem>
                              <SelectItem value="PARTNER_REFERRAL">Partner Referral</SelectItem>
                              <SelectItem value="DOOR_HANGER">Door Hanger</SelectItem>
                              <SelectItem value="DOOR_TO_DOOR">Door to Door Sales</SelectItem>
                              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                              <SelectItem value="VEHICLE">Vehicle</SelectItem>
                              <SelectItem value="WALK_IN">Walk-In</SelectItem>
                              <SelectItem value="OTHER_PAID">Other Paid</SelectItem>
                              <SelectItem value="OTHER_ORGANIC">Other Organic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Remeasurement Required</Label>
                          <Select value={remeasurementRequired} onValueChange={(v) => setRemeasurementRequired(v as 'NO' | 'YES')}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NO">No</SelectItem>
                              <SelectItem value="YES">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Side Mark will be auto-generated on creation (e.g. {sideMarkPreview(newCustomerType, newCustomerSource).replace('#####', '12345')})</p>
                    </div>
                  )}
                </>
              )}

              {/* Tax Exemption — shown when selected existing customer is COMMERCIAL */}
              {!customerLocked && customerMode === 'existing' && selectedCustomerId && selectedCustomerType === 'COMMERCIAL' && (
                <div className="space-y-1.5 rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="existing-customer-tax-exempt"
                      checked={isTaxExempt}
                      onCheckedChange={(v) => setIsTaxExempt(!!v)}
                    />
                    <Label htmlFor="existing-customer-tax-exempt" className="text-xs cursor-pointer">
                      Tax Exempt (Company)
                    </Label>
                    {isTaxExempt && <span className="ml-auto text-[10px] text-green-600 font-medium">Tax will not be applied</span>}
                  </div>
                  {isTaxExempt && (
                    <div className="space-y-2">
                      <Input placeholder="Tax exemption note (e.g. certificate #, reason)" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="h-8 text-xs" />
                      <div className="rounded-md border bg-background/70 p-2 space-y-1.5">
                        {taxExemptionLoading ? (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Checking uploaded certificates...
                          </div>
                        ) : taxExemptionFiles.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-[11px] text-green-700">Certificate already uploaded.</p>
                            <a
                              href={taxExemptionFiles[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-amber-700 hover:underline break-all"
                            >
                              {taxExemptionFiles[0].name}
                            </a>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">No exemption certificate uploaded yet.</p>
                        )}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={
                              taxExemptionUploading ||
                              !effectiveCustomerForFiles ||
                              !isObjectId(effectiveCustomerForFiles)
                            }
                            onClick={() => taxExemptionInputRef.current?.click()}
                          >
                            {taxExemptionUploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Paperclip className="h-3.5 w-3.5 mr-1" />}
                            {taxExemptionFiles.length > 0 ? 'Re-upload Certificate' : 'Upload Certificate'}
                          </Button>
                          <input
                            ref={taxExemptionInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file || !effectiveCustomerForFiles || !isObjectId(effectiveCustomerForFiles)) return
                              setTaxExemptionUploading(true)
                              try {
                                await uploadTaxExemptionCertificate(effectiveCustomerForFiles, file)
                              } catch (uploadError) {
                                alert(uploadError instanceof Error ? uploadError.message : 'Failed to upload exemption certificate.')
                              } finally {
                                setTaxExemptionUploading(false)
                                e.target.value = ''
                              }
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Uploaded certificates are saved under Customer Details - Files.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {customerLocked && (customerTaxExempt || isTaxExempt) && (
                <div className="space-y-1.5 rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Tax Exempt Customer</Label>
                    <span className="ml-auto text-[10px] text-green-600 font-medium">Tax will not be applied</span>
                  </div>
                  <div className="rounded-md border bg-background/70 p-2 space-y-1.5">
                    {taxExemptionLoading ? (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Checking uploaded certificates...
                      </div>
                    ) : taxExemptionFiles.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-[11px] text-green-700">Certificate already uploaded.</p>
                        <a
                          href={taxExemptionFiles[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-amber-700 hover:underline break-all"
                        >
                          {taxExemptionFiles[0].name}
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No exemption certificate uploaded yet.</p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={
                          taxExemptionUploading ||
                          !effectiveCustomerForFiles ||
                          !isObjectId(effectiveCustomerForFiles)
                        }
                        onClick={() => taxExemptionInputRef.current?.click()}
                      >
                        {taxExemptionUploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Paperclip className="h-3.5 w-3.5 mr-1" />}
                        {taxExemptionFiles.length > 0 ? 'Re-upload Certificate' : 'Upload Certificate'}
                      </Button>
                      <input
                        ref={taxExemptionInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !effectiveCustomerForFiles || !isObjectId(effectiveCustomerForFiles)) return
                          setTaxExemptionUploading(true)
                          try {
                            await uploadTaxExemptionCertificate(effectiveCustomerForFiles, file)
                          } catch (uploadError) {
                            alert(uploadError instanceof Error ? uploadError.message : 'Failed to upload exemption certificate.')
                          } finally {
                            setTaxExemptionUploading(false)
                            e.target.value = ''
                          }
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Uploaded certificates are saved under Customer Details - Files.
                    </p>
                  </div>
                </div>
              )}

              {/* Contact info */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                <div className="grid gap-1.5">
                  <Input placeholder="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="h-8 text-xs" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <Input placeholder="Phone" value={customerPhone} onChange={(e) => { const v = sanitizePhoneInput(e.target.value); setCustomerPhone(v); setPhoneError(validatePhone(v)) }} className={cn('h-8 text-xs', phoneError && 'border-destructive')} />
                      {phoneError && <p className="text-[10px] text-destructive mt-0.5">{phoneError}</p>}
                    </div>
                    <div>
                      <Input placeholder="Mobile" value={customerMobile} onChange={(e) => { const v = sanitizePhoneInput(e.target.value); setCustomerMobile(v); setMobileError(validatePhone(v)) }} className={cn('h-8 text-xs', mobileError && 'border-destructive')} />
                      {mobileError && <p className="text-[10px] text-destructive mt-0.5">{mobileError}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              {deliveryMethod !== 'PICK_UP' ? (
                <div className="space-y-2">
                  {/* Same-address checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="bill-same-ship"
                      checked={billSameAsShip}
                      onCheckedChange={(v) => setBillSameAsShip(!!v)}
                    />
                    <Label htmlFor="bill-same-ship" className="text-xs cursor-pointer text-muted-foreground">
                      Billing address same as {deliveryMethod === 'INSTALLED' ? 'installation' : 'shipping'} address
                    </Label>
                  </div>

                  <div className={cn('grid gap-4', billSameAsShip ? 'grid-cols-1' : 'grid-cols-2')}>
                    {/* Ship To / Installation Address */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {deliveryMethod === 'INSTALLED' ? 'Installation Address' : 'Ship To'}
                      </p>
                      <div className="grid gap-1.5">
                        <AddressAutocomplete
                          value={shipToStreet}
                          onChange={setShipToStreet}
                          onSelect={(sel: AddressSelection) => { setShipToManuallyEdited(true); setShipToStreet(sel.street || sel.fullAddress); setShipToCity(sel.city); setShipToState(sel.state); setShipToPostcode(sel.postalCode); setShipToCountry(sel.country) }}
                          placeholder="Street address"
                        />
                        <Input placeholder="Suite / Unit (optional)" value={shipToSuite} onChange={(e) => setShipToSuite(e.target.value)} className="h-8 text-xs" />
                        <div className="grid grid-cols-2 gap-1.5">
                          <Input placeholder="City" value={shipToCity} onChange={(e) => { setShipToManuallyEdited(true); setShipToCity(e.target.value) }} className="h-8 text-xs" />
                          <Input placeholder="State" value={shipToState} onChange={(e) => { setShipToManuallyEdited(true); setShipToState(e.target.value) }} className="h-8 text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Input placeholder="Postcode" value={shipToPostcode} onChange={(e) => { setShipToManuallyEdited(true); setShipToPostcode(e.target.value) }} className="h-8 text-xs" />
                          <Input placeholder="Country" value={shipToCountry} onChange={(e) => { setShipToManuallyEdited(true); setShipToCountry(e.target.value) }} className="h-8 text-xs" />
                        </div>
                      </div>
                    </div>

                    {/* Bill To address — only when different */}
                    {!billSameAsShip && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill To</p>
                        <div className="grid gap-1.5">
                          <AddressAutocomplete
                            value={customerStreet}
                            onChange={setCustomerStreet}
                            onSelect={(sel: AddressSelection) => { setCustomerStreet(sel.street || sel.fullAddress); setCustomerTown(sel.state); setCustomerCity(sel.city); setCustomerPostcode(sel.postalCode); setCustomerCountry(sel.country) }}
                            placeholder="Street address"
                          />
                          <Input placeholder="Suite / Unit (optional)" value={customerSuite} onChange={(e) => setCustomerSuite(e.target.value)} className="h-8 text-xs" />
                          <div className="grid grid-cols-2 gap-1.5">
                            <Input placeholder="City" value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} className="h-8 text-xs" />
                            <Input placeholder="State" value={customerTown} onChange={(e) => setCustomerTown(e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <Input placeholder="Postcode" value={customerPostcode} onChange={(e) => setCustomerPostcode(e.target.value)} className="h-8 text-xs" />
                            <Input placeholder="Country" value={customerCountry} onChange={(e) => setCustomerCountry(e.target.value)} className="h-8 text-xs" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Pick Up — only Bill To address */
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill To Address</p>
                  <div className="grid gap-1.5">
                    <AddressAutocomplete
                      value={customerStreet}
                      onChange={setCustomerStreet}
                      onSelect={(sel: AddressSelection) => { setCustomerStreet(sel.street || sel.fullAddress); setCustomerTown(sel.state); setCustomerCity(sel.city); setCustomerPostcode(sel.postalCode); setCustomerCountry(sel.country) }}
                      placeholder="Street address"
                    />
                    <Input placeholder="Suite / Unit (optional)" value={customerSuite} onChange={(e) => setCustomerSuite(e.target.value)} className="h-8 text-xs" />
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input placeholder="City" value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} className="h-8 text-xs" />
                      <Input placeholder="State" value={customerTown} onChange={(e) => setCustomerTown(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input placeholder="Postcode" value={customerPostcode} onChange={(e) => setCustomerPostcode(e.target.value)} className="h-8 text-xs" />
                      <Input placeholder="Country" value={customerCountry} onChange={(e) => setCustomerCountry(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {customerMode === 'new' && !customerLocked && (
                <Button type="button" size="sm" onClick={handleCreateAndContinue} disabled={creatingCustomer || !newCustomerName.trim()}>
                  {creatingCustomer ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating…</> : 'Create Customer'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quote details */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              {/* Delivery Method — at the top of quote settings */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PICK_UP', 'SHIPPED', 'INSTALLED'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDeliveryMethod(method)}
                      className={cn(
                        'rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
                        deliveryMethod === method
                          ? 'border-amber-500 bg-amber-600 text-white'
                          : 'border-border bg-background hover:bg-muted'
                      )}
                    >
                      {method === 'PICK_UP' ? '🚗 Pick Up' : method === 'SHIPPED' ? '📦 Shipped' : '🔧 Installed'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="USD">USD $</SelectItem><SelectItem value="CAD">CAD $</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={quoteStatus} onValueChange={(v: 'DRAFT' | 'SENT') => setQuoteStatus(v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Sale Agent</Label>
                  <Select value={saleAgent || '__none__'} onValueChange={(v) => setSaleAgent(v === '__none__' ? '' : v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select agent" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => { setDiscountType(v); if (v === 'No discount') setDiscountValue(0) }}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No discount">No discount</SelectItem>
                      <SelectItem value="Percentage">Percentage (%)</SelectItem>
                      <SelectItem value="Fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {discountType !== 'No discount' && (
                <Input type="number" min={0} step={discountType === 'Percentage' ? '0.1' : '0.01'} placeholder={discountType === 'Percentage' ? 'Discount %' : 'Discount $'} value={discountValue || ''} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="h-9" />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Estimate Date</Label>
                  <Input type="date" value={format(new Date(), 'yyyy-MM-dd')} readOnly className="h-9 bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} className="h-9" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Admin Note</Label>
                <Textarea placeholder="Internal admin note (not visible to customer)..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className="text-xs" />
              </div>

              {/* Global adjustments */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Price Increase (%)</Label>
                  <Input type="number" value={globalAdjust.percent} onChange={(e) => setGlobalAdjust(parseFloat(e.target.value || '0'), globalAdjust.flat)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Flat Increase ($)</Label>
                  <Input type="number" value={globalAdjust.flat} onChange={(e) => setGlobalAdjust(globalAdjust.percent, parseFloat(e.target.value || '0'))} className="h-9" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>}

      {/* ── LINE ITEMS ── */}
      <Card>

        {/* ── ITEMS TABLE ── */}
        <CardContent className="pt-3 px-3 sm:px-4">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              {/* Header row */}
              <div className={cn('grid gap-0 border rounded-t-md bg-muted/50 text-xs font-semibold', gridCols)}>
                <div className="px-2 py-2 border-r">Area / QTY</div>
                <div className="px-2 py-2 border-r">Width</div>
                <div className="px-2 py-2 border-r">Length</div>
                <div className="px-2 py-2 border-r text-center">
                  <div>Item</div>
                  <div className="text-[10px] font-normal text-primary cursor-pointer hover:underline" onClick={applyToAllItem}>Apply to all</div>
                </div>
                <div className="px-2 py-2 border-r text-center">
                  <div>Operation &amp; Mount</div>
                  <div className="text-[10px] font-normal text-primary cursor-pointer hover:underline" onClick={applyToAllOperation}>Apply to all</div>
                </div>
                <div className="px-2 py-2 border-r text-center">
                  <div>Cassette &amp; Bottom Rail</div>
                  <div className="text-[10px] font-normal text-primary cursor-pointer hover:underline" onClick={applyToAllCassette}>Apply to all</div>
                </div>
                {showRollerColumn && (
                  <div className="px-2 py-2 border-r text-center">
                    <div>Roller Custom</div>
                    <div className="text-[10px] font-normal text-primary cursor-pointer hover:underline" onClick={applyToAllRoller}>Apply to all</div>
                  </div>
                )}
                <div className="px-2 py-2 border-r text-right text-[10px]">Before Discount</div>
                <div className="px-2 py-2 border-r text-right">Unit Price</div>
                <div className="px-2 py-2 border-r text-right">Total</div>
                <div className="px-1 py-2 text-center"></div>
              </div>

              {/* ── NEW ITEM ENTRY ROW (only when not editing an existing item) ── */}
              {!editingItemId && renderEntryRow()}
              {!editingItemId && (widthExceedsMax || !!dimensionWarning) && (
                <div className="border-x border-b px-3 py-1 bg-red-50 dark:bg-red-950/20 text-xs text-red-600 flex flex-wrap gap-3">
                  {widthExceedsMax && <span>Width exceeds max {selectedFabricMaxWidth}&quot;</span>}
                  {dimensionWarning && dimensionWarning.map((msg, i) => <span key={i}>{msg}</span>)}
                </div>
              )}

              {/* ── Existing items ── */}
              {items.map((item, idx) =>
                item.id === editingItemId ? (
                  // Edit mode: the row transforms into the edit form in-place — no extra rows, no movement
                  <div key={item.id}>
                    {renderEntryRow()}
                    {(widthExceedsMax || !!dimensionWarning) && (
                      <div className="border-x border-b px-3 py-1 bg-red-50 dark:bg-red-950/20 text-xs text-red-600 flex flex-wrap gap-3">
                        {widthExceedsMax && <span>Width exceeds max {selectedFabricMaxWidth}&quot;</span>}
                        {dimensionWarning && dimensionWarning.map((msg, i) => <span key={i}>{msg}</span>)}
                      </div>
                    )}
                  </div>
                ) : (
                  // Display mode: read-only row
                  <div key={item.id} className={cn('grid gap-0 border-x border-b hover:bg-muted/20', gridCols, idx % 2 === 0 && 'bg-muted/5')}>
                    <div className="px-1.5 py-2 border-r text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{item.roomType || '—'}</span>
                        <span className="shrink-0 text-muted-foreground font-medium">×{item.quantity}</span>
                      </div>
                      {item.sequence && <div className="text-muted-foreground">{item.sequence}</div>}
                    </div>
                    <div className="px-1.5 py-2 border-r text-xs">{item.width}&quot;</div>
                    <div className="px-1.5 py-2 border-r text-xs">{item.length}&quot;</div>
                    <div className="px-1.5 py-2 border-r text-xs space-y-0.5">
                      <div className="truncate" title={item.category}>{item.category || '—'}</div>
                      <div className="text-muted-foreground truncate">{item.subcategory || '—'}</div>
                      <div className="text-muted-foreground truncate">{item.subSubcategory || item.collectionId || '—'}</div>
                      <div className="flex items-center gap-1">
                        {item.fabricImage ? (
                          <div className="relative w-5 h-5 border rounded overflow-hidden bg-muted inline-block shrink-0">
                            <Image src={item.fabricImage} alt="" fill className="object-contain" sizes="20px" unoptimized onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                          </div>
                        ) : null}
                        <span className="text-muted-foreground truncate">{item.productName?.split(' - ')[1] || '—'}</span>
                      </div>
                    </div>
                    <div className="px-1.5 py-2 border-r text-xs space-y-0.5">
                      <div className="font-medium">{item.controlType || '—'}</div>
                      <div className="text-muted-foreground">
                        {isMotorizedOp(item.controlType || '') ? `Remote: ${(item.controlChainColor || 'Yes') === 'No' ? 'No' : 'Yes'} / CH: ${item.controlChain || '—'}` :
                         item.controlType === 'Chain' ? `Chain: ${item.controlChain || '—'}` :
                         item.controlType === 'Cord' ? `Cord: ${item.controlChain || '—'}` :
                         item.controlType === 'Wand' ? `Wand: ${item.controlChain || '—'}` :
                         item.controlType === 'Cordless' ? 'Cordless' : '—'}
                      </div>
                      {isMotorizedOp(item.controlType || '') && item.remoteNumber && (
                        <div className="text-amber-600 dark:text-amber-400 font-medium">Remote #: {item.remoteNumber}</div>
                      )}
                      <div className="text-muted-foreground">Side: {item.controlChainSide || '—'}</div>
                      <div className="text-muted-foreground">Mount: {item.mountType || '—'}</div>
                    </div>
                    <div className="px-1.5 py-2 border-r text-xs space-y-0.5">
                      <div>{item.cassetteType ? (item.cassetteType === 'OPEN_ROLL' ? 'Open Roll' : item.cassetteType === 'SQUARE CASETTE' ? 'Square' : 'Round') : '—'}</div>
                      <div className="text-muted-foreground">{item.cassetteColor ? `Color: ${item.cassetteColor}` : item.fabricWrap === 'none' ? 'C. Wrap' : item.fabricWrap === 'other' ? 'C. Wrap: Other' : 'C. Wrap: Same'}</div>
                      <div className="text-muted-foreground">{item.bottomRailType === 'Wrapped' ? `BR. Wrapped${item.bottomRailColor ? ` / ${item.bottomRailColor}` : ''}` : item.bottomRailType === 'Exposed' ? `BR. Exposed${item.bottomRailColor ? ` / ${item.bottomRailColor}` : ''}` : item.bottomRailType ? item.bottomRailType : '—'}</div>
                      <div className="text-muted-foreground">Side Ch: {item.sideChannel && item.sideChannel !== 'None' ? item.sideChannel : '—'}</div>
                    </div>
                    {showRollerColumn && (
                      <div className="px-1.5 py-2 border-r text-xs space-y-0.5">
                        <div>Roll: {item.roll || '—'}</div>
                        <div className="text-muted-foreground">Assist: {item.springAssist || '—'}</div>
                      </div>
                    )}
                    <div className="px-1.5 py-2 border-r text-xs flex items-center justify-end">
                      <div className="text-muted-foreground line-through">{formatCurrency(item.unitPrice * 1.5)}</div>
                    </div>
                    <div className="px-1.5 py-2 border-r text-xs flex flex-col items-end justify-center">
                      <div className="font-medium cursor-pointer hover:text-primary" onClick={() => handleEditPrice(item)}>
                        {formatCurrency(item.unitPrice)}
                      </div>
                      {item.manualPriceOverride !== undefined && <div className="text-[10px] text-orange-500">Override</div>}
                    </div>
                    <div className="px-1.5 py-2 border-r text-xs font-semibold flex items-center justify-end">
                      {formatCurrency(item.totalPrice)}
                    </div>
                    <div className="px-0.5 py-2 flex flex-col items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => duplicateItem(item)} title="Duplicate"><Copy className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditItem(item)} title="Edit"><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)} title="Remove"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                )
              )}

              {items.length === 0 && (
                <div className="border-x border-b py-8 text-center text-xs text-muted-foreground">No items added yet. Use the form above to add line items.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* ── UPGRADES TABLE (auto-calculated from line items) ── */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Upgrades
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pt-0 space-y-3">
          {addOnsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : computedUpgrades.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No upgrades applicable. Add line items above to auto-populate.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-2 py-1.5 text-left font-semibold">Product</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-[70px]">Qty</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-[90px]">Unit Price</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-[80px]">Total</th>
                  <th className="px-2 py-1.5 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {computedUpgrades.map((u) => (
                  <tr key={u.addOnId} className="border-b bg-primary/5">
                    <td className="px-2 py-1.5 text-xs font-medium">{u.name}</td>
                    <td className="px-2 py-1.5">
                      {editingUpgradeQty === u.addOnId ? (
                        <Input type="number" min={0} className="w-14 h-7 text-xs" value={u.quantity} onChange={(e) => { const v = parseInt(e.target.value, 10); setUpgradeQtyOverrides((prev) => ({ ...prev, [u.addOnId]: isNaN(v) ? 0 : v })) }} onBlur={() => setEditingUpgradeQty(null)} autoFocus />
                      ) : (
                        <span className="cursor-pointer hover:text-primary" onClick={() => setEditingUpgradeQty(u.addOnId)}>{u.quantity}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs">
                      {editingUpgradePrice === u.addOnId ? (
                        <Input type="number" min={0} step="0.01" className="w-16 h-7 text-xs" value={u.unitPrice} onChange={(e) => { const v = parseFloat(e.target.value); setUpgradePriceOverrides((prev) => ({ ...prev, [u.addOnId]: isNaN(v) ? 0 : v })) }} onBlur={() => setEditingUpgradePrice(null)} autoFocus />
                      ) : (
                        <span className="cursor-pointer hover:text-primary" onClick={() => setEditingUpgradePrice(u.addOnId)}>{formatCurrency(u.unitPrice)}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs font-medium">{formatCurrency(u.total)}</td>
                    <td className="px-2 py-1.5 text-center">
                      {u.removable && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUpgradeQtyOverrides((prev) => ({ ...prev, [u.addOnId]: 0 }))} title="Remove">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Additional Services */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Additional Services</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <Checkbox
                  checked={additionalServices.includes('blinds_removal')}
                  onCheckedChange={(checked) => {
                    setAdditionalServices((prev) => checked ? [...prev, 'blinds_removal'] : prev.filter((s) => s !== 'blinds_removal'))
                  }}
                />
                Blinds Removal
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <Checkbox
                  checked={additionalServices.includes('blinds_disposal')}
                  onCheckedChange={(checked) => {
                    setAdditionalServices((prev) => checked ? [...prev, 'blinds_disposal'] : prev.filter((s) => s !== 'blinds_disposal'))
                  }}
                />
                Blinds Disposal
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── TOTALS + FOOTER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: contract type (hidden in dealer mode) */}
        {!dealerMode && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Agreement Type</Label>
              <Select value={contractType} onValueChange={(v: any) => setContractType(v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select agreement type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERIOR">Interior Shades</SelectItem>
                  <SelectItem value="EXTERIOR">Exterior Shades</SelectItem>
                  <SelectItem value="INTERIOR_AND_EXTERIOR">Interior &amp; Exterior Shades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Right: Totals */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount ({discountType === 'Percentage' ? `${discountValue}%` : 'Fixed'})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {deliveryMethod === 'INSTALLED' && (
                <div className="flex justify-between text-sm text-amber-700 dark:text-amber-400 items-center">
                  <span className="flex flex-col">
                    <span>Installation</span>
                    <span className="text-[10px] text-muted-foreground">
                      {manualInstallationAmount !== null ? 'Manual override' : (() => {
                        const extQty = items.filter((i) => i.category === 'Exterior' || i.category?.startsWith('Exterior')).reduce((s, i) => s + i.quantity, 0)
                        const intQty = items.filter((i) => i.category !== 'Exterior' && !i.category?.startsWith('Exterior')).reduce((s, i) => s + i.quantity, 0)
                        const parts = []
                        if (intQty > 0) parts.push('Interior: $300 flat')
                        if (extQty === 1) parts.push('Exterior: $500 (1 shade)')
                        else if (extQty > 1) parts.push(`Exterior: $350 × ${extQty}`)
                        return parts.join(' + ') || 'Add items to calculate'
                      })()}
                    </span>
                  </span>
                  {isEditingInstallation ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        autoFocus
                        value={manualInstallationAmount ?? effectiveInstallationAmount}
                        onChange={(e) => setManualInstallationAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 h-7 text-xs text-right"
                        onBlur={() => setIsEditingInstallation(false)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditingInstallation(false) }}
                      />
                      {manualInstallationAmount !== null && (
                        <button
                          onClick={() => { setManualInstallationAmount(null); setIsEditingInstallation(false) }}
                          className="text-gray-400 hover:text-gray-600 text-[10px]"
                          title="Reset to auto"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      title="Click to override"
                      onClick={() => setIsEditingInstallation(true)}
                    >
                      {formatCurrency(effectiveInstallationAmount)}
                    </span>
                  )}
                </div>
              )}
              {deliveryMethod === 'SHIPPED' && (
                <div className="flex justify-between text-sm items-center">
                  <span>Shipping</span>
                  <Input type="number" min={0} step="0.01" value={shippingCost || ''} onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} className="w-24 h-7 text-xs text-right" placeholder="$0.00" />
                </div>
              )}
              {effectiveTaxRate > 0 ? (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax ({effectiveTaxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              ) : (customerTaxExempt || isTaxExempt) ? (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Tax Exempt</span>
                  <span>$0.00</span>
                </div>
              ) : null}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── FOOTER COUNTERS ── */}
      <div className="rounded-lg border bg-muted/30 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          <span>Total # of Shades <strong>{totalShades}</strong></span>
          <span>Total # of Motors <strong>{totalMotors}</strong></span>
          <span>Total # of Remote <strong>{totalRemote}</strong></span>
          {totalCharger > 0 && <span>Total # of Charger <strong>{totalCharger}</strong></span>}
          {totalHub > 0 && <span>Total # of Hub <strong>{totalHub}</strong></span>}
        </div>
      </div>

      {/* ── CLIENT NOTE & TERMS ── */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Client Note</Label>
          <Textarea
            placeholder="Additional notes for this estimate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="border-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Terms &amp; Conditions</p>
          <div className="text-[11px] text-muted-foreground space-y-0.5 pl-1">
            {qopts.termsAndConditions.split('\n').filter(Boolean).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex justify-end gap-2 pb-4">
        {dealerMode ? (
          <Button onClick={handleDealerPlaceOrder} disabled={creatingQuote}>
            {creatingQuote
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Placing Order…</>
              : 'Place Order'}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleSaveDraft} disabled={creatingQuote || creatingCustomer}>
              {creatingQuote ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button onClick={handleComplete} disabled={creatingQuote || creatingCustomer}>
              {creatingQuote ? (quoteId ? 'Updating...' : 'Creating...') : (quoteId ? 'Update Estimate' : 'Create Estimate')}
            </Button>
          </>
        )}
      </div>

      {/* Dialogs */}
      <CassetteSelectionDialog
        open={cassetteDialogOpen}
        onOpenChange={setCassetteDialogOpen}
        onSelect={handleCassetteSelect}
        onFabricWrapOther={handleFabricWrapOther}
        selectedCassetteType={newItem.cassetteType}
        selectedCassetteColor={newItem.cassetteColor}
        selectedFabricWrap={newItem.fabricWrap}
        disableFabricWrap={disableFabricWrap}
      />
      <FabricSelectionDialog
        open={fabricWrapDialogOpen}
        onOpenChange={setFabricWrapDialogOpen}
        onSelect={handleFabricWrapFabricSelect}
        selectedFabricId={newItem.fabricWrapId}
      />
      <Dialog open={editingPriceItemId !== null} onOpenChange={(open) => !open && handleCancelPriceEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item Price</DialogTitle>
            <DialogDescription>Enter a new base price for this item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Base Price ($)</Label>
              <Input type="number" step="0.01" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} placeholder="Enter price" />
            </div>
            {editPriceValue && !isNaN(parseFloat(editPriceValue)) && (
              <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
                <div className="flex justify-between"><span>Base Price:</span><span>{formatCurrency(parseFloat(editPriceValue))}</span></div>
                {items.find((item) => item.id === editingPriceItemId) && (
                  <>
                    <div className="flex justify-between"><span>After Adjustments:</span><span>{formatCurrency(parseFloat(editPriceValue) * (1 + globalAdjust.percent / 100) + globalAdjust.flat)}</span></div>
                    <div className="flex justify-between"><span>Quantity:</span><span>{items.find((item) => item.id === editingPriceItemId)?.quantity || 1}</span></div>
                    <Separator />
                    <div className="flex justify-between font-medium"><span>Item Total:</span><span>{formatCurrency((parseFloat(editPriceValue) * (1 + globalAdjust.percent / 100) + globalAdjust.flat) * (items.find((item) => item.id === editingPriceItemId)?.quantity || 1))}</span></div>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPriceEdit}>Cancel</Button>
            <Button onClick={handleSavePriceEdit}>Save Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
