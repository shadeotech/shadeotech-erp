export interface MockCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  sideMark?: string
}

export const mockCustomers: MockCustomer[] = [
  {
    id: 'cust_001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, San Francisco, CA 94102',
    sideMark: 'SHR-MT12345',
  },
  {
    id: 'cust_002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1 (555) 234-5678',
    address: '456 Market Street, San Francisco, CA 94103',
    sideMark: 'SHR-GL23456',
  },
  {
    id: 'cust_003',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@email.com',
    phone: '+1 (555) 345-6789',
    address: '789 Mission Street, San Francisco, CA 94105',
    sideMark: 'SHR-RF34567',
  },
  {
    id: 'cust_004',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.w@email.com',
    phone: '+1 (555) 456-7890',
    address: '321 California Street, San Francisco, CA 94104',
    sideMark: 'SHR-DH45678',
  },
  {
    id: 'cust_005',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@email.com',
    phone: '+1 (555) 567-8901',
    address: '654 Powell Street, San Francisco, CA 94108',
    sideMark: 'SHR-LK56789',
  },
  {
    id: 'cust_006',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '+1 (555) 678-9012',
    address: '987 Geary Street, San Francisco, CA 94109',
    sideMark: 'SHR-WI67890',
  },
  {
    id: 'cust_007',
    firstName: 'Robert',
    lastName: 'Miller',
    email: 'robert.m@email.com',
    phone: '+1 (555) 789-0123',
    address: '147 Van Ness Avenue, San Francisco, CA 94102',
    sideMark: 'SHR-GL78901',
  },
  {
    id: 'cust_008',
    firstName: 'Lisa',
    lastName: 'Wilson',
    email: 'lisa.wilson@email.com',
    phone: '+1 (555) 890-1234',
    address: '258 Fillmore Street, San Francisco, CA 94117',
    sideMark: 'SHR-MT89012',
  },
]

