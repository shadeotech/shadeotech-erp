'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CustomerType = 'FRANCHISEE' | 'RESIDENTIAL' | 'COMMERCIAL' | 'PARTNER'
export type LeadSource = 'Meta Ads' | 'Google Ads' | 'Website Form' | 'Calendar' | 'Referral' | 'Manual'
export type CustomerStatus = 'LEAD' | 'CONTACTED' | 'QUALIFIED' | 'CUSTOMER' | 'INACTIVE'

export interface CustomerBase {
  id: string
  type: CustomerType
  status: CustomerStatus
  name: string
  phone?: string
  email?: string
  address?: string
  sideMark: string
  source: LeadSource
  tags?: string[]
  createdAt: string
}

export interface FranchiseeCustomer extends CustomerBase {
  type: 'FRANCHISEE'
  ownerName: string
  storeNumber: string
  shippingAddress?: string
}

export interface ResidentialCustomer extends CustomerBase {
  type: 'RESIDENTIAL'
  firstName: string
  lastName: string
  numberOfWindows?: number
  productsOfInterest?: string[]
}

export interface CommercialCustomer extends CustomerBase {
  type: 'COMMERCIAL'
  companyName: string
  contactFirstName: string
  contactLastName: string
  phoneExt?: string
  numberOfWindows?: number
  productsOfInterest?: string[]
  companyType?: string
}

export interface PartnerCustomer extends CustomerBase {
  type: 'PARTNER'
  partnerType: 'Designer' | 'Builder' | 'Contractor' | 'Dealer'
  companyName: string
  personName: string
}

export type Customer = FranchiseeCustomer | ResidentialCustomer | CommercialCustomer | PartnerCustomer

export interface ActivityItem {
  id: string
  type: 'note' | 'call' | 'text'
  content: string
  timestamp: string
}

export type CustomerDetail = Customer & {
  activities: ActivityItem[]
}

interface CustomersState {
  customers: CustomerDetail[]
  addCustomer: (payload: Omit<CustomerDetail, 'id' | 'createdAt' | 'activities'>) => string
  updateCustomer: (id: string, partial: Partial<CustomerDetail>) => void
  addActivity: (customerId: string, entry: Omit<ActivityItem, 'id' | 'timestamp'>) => void
  bookAppointment: (customerId: string) => void
}

const nowIso = () => new Date().toISOString()

const mockCustomers: CustomerDetail[] = [
  {
    id: 'cust_fr_001',
    type: 'FRANCHISEE',
    status: 'CUSTOMER',
    name: 'At Shades - SF Downtown',
    ownerName: 'Alex Turner',
    storeNumber: 'AS-012',
    email: 'owner@atshades.com',
    phone: '(555) 111-2222',
    shippingAddress: '123 Market St, San Francisco, CA',
    address: '123 Market St, San Francisco, CA',
    sideMark: 'SHA-01234',
    source: 'Calendar',
    tags: ['Franchisee', 'Priority'],
    createdAt: '2024-12-01',
    activities: [
      { id: 'act1', type: 'note', content: 'Requested rush production update', timestamp: '2025-01-10T10:00:00Z' },
    ],
  },
  {
    id: 'cust_res_001',
    type: 'RESIDENTIAL',
    status: 'LEAD',
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 222-3333',
    address: '456 Pine St, San Francisco, CA',
    numberOfWindows: 8,
    productsOfInterest: ['Roller Shades', 'Zebra Blinds'],
    sideMark: 'SHR-LL12345',
    source: 'Meta Ads',
    createdAt: '2025-01-12',
    activities: [],
  },
  {
    id: 'cust_com_001',
    type: 'COMMERCIAL',
    status: 'CUSTOMER',
    name: 'Bright Dental Group',
    companyName: 'Bright Dental Group',
    contactFirstName: 'Sarah',
    contactLastName: 'Lee',
    phone: '(555) 333-4444',
    email: 'sarah.lee@brightdental.com',
    address: '789 Mission St, San Francisco, CA',
    companyType: 'Dental Office',
    numberOfWindows: 25,
    productsOfInterest: ['Motorized Shades'],
    sideMark: 'SHC-LL54321',
    source: 'Google Ads',
    createdAt: '2025-01-05',
    activities: [
      { id: 'act2', type: 'call', content: 'Discussed installation timeline', timestamp: '2025-01-08T15:30:00Z' },
    ],
  },
  {
    id: 'cust_part_001',
    type: 'PARTNER',
    status: 'CUSTOMER',
    name: 'Design Co',
    partnerType: 'Designer',
    companyName: 'Design Co',
    personName: 'Maria Gomez',
    phone: '(555) 444-5555',
    email: 'maria@designco.com',
    address: '1010 Van Ness Ave, San Francisco, CA',
    sideMark: 'SHP-LL67890',
    source: 'Referral',
    createdAt: '2025-01-03',
    activities: [],
  },
]

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: mockCustomers,

      addCustomer: (payload) => {
        const id = `cust_${Date.now()}`
        const newCustomer = {
          ...payload,
          id,
          createdAt: new Date().toISOString().split('T')[0],
          activities: [] as ActivityItem[],
        } as CustomerDetail
        set((state) => ({ customers: [newCustomer, ...state.customers] }))
        return id
      },

      updateCustomer: (id, partial) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? ({ ...c, ...partial } as CustomerDetail) : c
          ) as CustomerDetail[],
        }))
      },

      addActivity: (customerId, entry) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  activities: [
                    { id: `act_${Date.now()}`, timestamp: nowIso(), ...entry },
                    ...c.activities,
                  ],
                }
              : c
          ),
        }))
      },

      bookAppointment: (customerId) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, status: 'CUSTOMER' as CustomerStatus }
              : c
          ),
        }))
      },
    }),
    {
      name: 'customers-storage',
      partialize: (state) => ({ customers: state.customers }),
    }
  )
)

