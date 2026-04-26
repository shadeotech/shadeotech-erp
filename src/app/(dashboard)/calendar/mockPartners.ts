export interface MockPartner {
  id: string
  name: string
  type: 'Designer' | 'Builder' | 'Contractor' | 'Dealer'
  contactPerson: string
  phone: string
  email: string
  address: string
  sideMark: string
}

export const mockPartners: MockPartner[] = [
  {
    id: 'part_001',
    name: 'Elite Design Studio',
    type: 'Designer',
    contactPerson: 'Jennifer Martinez',
    phone: '+1 (555) 111-2222',
    email: 'jennifer@elitedesign.com',
    address: '100 Design Avenue, San Francisco, CA 94110',
    sideMark: 'SHP-MT11111',
  },
  {
    id: 'part_002',
    name: 'Golden Gate Builders',
    type: 'Builder',
    contactPerson: 'Mark Thompson',
    phone: '+1 (555) 222-3333',
    email: 'mark@goldengatebuilders.com',
    address: '200 Construction Way, San Francisco, CA 94111',
    sideMark: 'SHP-GL22222',
  },
  {
    id: 'part_003',
    name: 'Bay Area Contractors',
    type: 'Contractor',
    contactPerson: 'Susan Lee',
    phone: '+1 (555) 333-4444',
    email: 'susan@bayareacontractors.com',
    address: '300 Contractor Blvd, San Francisco, CA 94112',
    sideMark: 'SHP-RF33333',
  },
  {
    id: 'part_004',
    name: 'Premium Home Dealers',
    type: 'Dealer',
    contactPerson: 'James Anderson',
    phone: '+1 (555) 444-5555',
    email: 'james@premiumdealers.com',
    address: '400 Dealer Street, San Francisco, CA 94113',
    sideMark: 'SHP-PR44444',
  },
]

