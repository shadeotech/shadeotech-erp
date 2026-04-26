// Customer Types
export const CUSTOMER_TYPES = [
  { value: 'FRANCHISEE', label: 'Franchisee' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'PARTNER', label: 'Partner' },
] as const;

// Customer Statuses
export const CUSTOMER_STATUSES = [
  { value: 'LEAD', label: 'Lead', color: 'blue' },
  { value: 'CONTACTED', label: 'Contacted', color: 'yellow' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'purple' },
  { value: 'CUSTOMER', label: 'Customer', color: 'green' },
  { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
] as const;

// Lead Sources
export const LEAD_SOURCES = [
  { value: 'META', label: 'Meta (Facebook/Instagram)' },
  { value: 'GOOGLE', label: 'Google Ads' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'PARTNER_REFERRAL', label: 'Partner Referral' },
  { value: 'DOOR_HANGER', label: 'Door Hanger' },
  { value: 'DOOR_TO_DOOR', label: 'Door to Door' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'OTHER_PAID', label: 'Other Paid' },
  { value: 'OTHER_ORGANIC', label: 'Other Organic' },
] as const;

// Quote Statuses
export const QUOTE_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'SENT', label: 'Sent', color: 'blue' },
  { value: 'VIEWED', label: 'Viewed', color: 'purple' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'yellow' },
  { value: 'POSTPONED', label: 'Postponed', color: 'orange' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'emerald' },
  { value: 'WON', label: 'Won', color: 'green' },
  { value: 'LOST', label: 'Lost', color: 'red' },
  { value: 'EXPIRED', label: 'Expired', color: 'gray' },
] as const;

// Invoice Statuses
export const INVOICE_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'SENT', label: 'Sent', color: 'blue' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid', color: 'yellow' },
  { value: 'PAID', label: 'Paid', color: 'green' },
  { value: 'OVERDUE', label: 'Overdue', color: 'red' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'ACH', label: 'ACH Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'FINANCING', label: 'Financing' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Payment Statuses
export const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'FAILED', label: 'Failed', color: 'red' },
  { value: 'REFUNDED', label: 'Refunded', color: 'purple' },
] as const;

// Event Types
export const EVENT_TYPES = [
  { value: 'CONSULTATION', label: 'Consultation', color: 'blue' },
  { value: 'DELIVERY', label: 'Delivery', color: 'purple' },
  { value: 'INSTALLATION', label: 'Installation', color: 'green' },
  { value: 'FOLLOW_UP', label: 'Follow Up', color: 'yellow' },
  { value: 'MEETING', label: 'Meeting', color: 'gray' },
  { value: 'OTHER', label: 'Other', color: 'gray' },
] as const;

// Task Priorities
export const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'gray' },
  { value: 'MEDIUM', label: 'Medium', color: 'blue' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
] as const;

// Task Statuses
export const TASK_STATUSES = [
  { value: 'TODO', label: 'To Do', color: 'gray' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
] as const;

// Product Categories with Subcategories
export interface ProductSubcategory {
  value: string;
  label: string;
  subSubcategories?: ProductSubcategory[];
}

export interface ProductCategory {
  value: string;
  label: string;
  subcategories: ProductSubcategory[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    value: 'roller_shades',
    label: 'Roller Shades',
    subcategories: [
      { value: 'light_filtering', label: 'Light Filtering' },
      { value: 'blackout', label: 'Blackout (Room Darkening)' },
      {
        value: 'sun_screen',
        label: 'Sun Screen',
        subSubcategories: [
          { value: '16', label: '16' },
          { value: '3_percent', label: '3%' },
          { value: '5_percent', label: '5%' },
          { value: '10_percent', label: '10%' },
        ],
      },
    ],
  },
  {
    value: 'duo_shades',
    label: 'Duo Shades',
    subcategories: [
      { value: 'light_filtering', label: 'Light Filtering' },
      { value: 'room_dimming', label: 'Room Dimming' },
    ],
  },
  {
    value: 'uni_shades',
    label: 'Uni Shades',
    subcategories: [
      { value: 'light_filtering', label: 'Light Filtering' },
      { value: 'room_dimming', label: 'Room Dimming' },
    ],
  },
  {
    value: 'tri_shades',
    label: 'Tri Shades',
    subcategories: [
      { value: 'light_filtering', label: 'Light Filtering' },
      { value: 'room_dimming', label: 'Room Dimming' },
    ],
  },
  {
    value: 'roman_shades',
    label: 'Roman Shades',
    subcategories: [
      { value: 'light_filtering', label: 'Light Filtering' },
      { value: 'room_darkening', label: 'Room Darkening' },
    ],
  },
  {
    value: 'patio_screen',
    label: 'Patio Screen',
    subcategories: [
      { value: 'zip_track_screen', label: 'Patio Zip Track Screen' },
      { value: 'wire_guide_screen', label: 'Patio Wire Guide Screen' },
      { value: 'free_hang', label: 'Patio Free Hang' },
    ],
  },
  {
    value: 'plantation_shutters',
    label: 'Plantation Shutters',
    subcategories: [
      { value: 'basswood', label: 'Basswood' },
      { value: 'pvc', label: 'PVC' },
    ],
  },
];

// Helper function to get all categories as flat list (for backward compatibility)
export const getProductCategoriesFlat = () => {
  return PRODUCT_CATEGORIES.map((cat) => ({
    value: cat.value,
    label: cat.label,
  }));
};

// Helper function to get subcategories for a category
export const getSubcategoriesForCategory = (categoryValue: string): ProductSubcategory[] => {
  const category = PRODUCT_CATEGORIES.find((cat) => cat.value === categoryValue);
  return category?.subcategories || [];
};

// Helper function to get sub-subcategories for a subcategory
export const getSubSubcategoriesForSubcategory = (
  categoryValue: string,
  subcategoryValue: string
): ProductSubcategory[] => {
  const category = PRODUCT_CATEGORIES.find((cat) => cat.value === categoryValue);
  const subcategory = category?.subcategories.find((sub) => sub.value === subcategoryValue);
  return subcategory?.subSubcategories || [];
};

// User Roles
export const USER_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'DEALER', label: 'Dealer' },
  { value: 'FRANCHISEE', label: 'Franchisee' },
  { value: 'CUSTOMER', label: 'Customer' },
] as const;

// Company Types (for Commercial customers)
export const COMPANY_TYPES = [
  { value: 'MEDICAL_OFFICE', label: 'Medical Office' },
  { value: 'DENTAL_OFFICE', label: 'Dental Office' },
  { value: 'CORPORATE_OFFICE', label: 'Corporate Office' },
  { value: 'BUSINESS_OFFICE', label: 'Business Office' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Partner Types
export const PARTNER_TYPES = [
  { value: 'DESIGNER', label: 'Designer' },
  { value: 'BUILDER', label: 'Builder' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'DEALER', label: 'Dealer' },
] as const;

// Side Mark Codes
export const TYPE_CODES: Record<string, string> = {
  FRANCHISEE: 'A',
  RESIDENTIAL: 'R',
  COMMERCIAL: 'C',
  PARTNER: 'P',
};

export const LEAD_SOURCE_CODES: Record<string, string> = {
  META: 'MT',
  GOOGLE: 'GL',
  REFERRAL: 'RF',
  PARTNER_REFERRAL: 'PR',
  DOOR_HANGER: 'DH',
  DOOR_TO_DOOR: 'DD',
  LINKEDIN: 'LK',
  VEHICLE: 'VH',
  WALK_IN: 'WI',
  OTHER_PAID: 'OP',
  OTHER_ORGANIC: 'OO',
};

// Default Tax Rate
export const DEFAULT_TAX_RATE = 8.25;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Inventory product names (used in quotes and production inventory)
export const INVENTORY_PRODUCTS = [
  'Roller Shades',
  'Duo Shades',
  'Roman Shades',
  'Cellular Shades',
  'Wood Blinds',
  'Aluminum Blinds',
  'Vertical Blinds',
  'Tri Shades',
  'Uni Shades',
  'ZIP',
  'Wire Guide',
  'Room Darkening Sun Screen',
] as const;

// Date Formats
export const DATE_FORMAT = 'MMM d, yyyy';
export const DATETIME_FORMAT = 'MMM d, yyyy h:mm a';
export const TIME_FORMAT = 'h:mm a';

