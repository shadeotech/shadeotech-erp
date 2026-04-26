export * from './database';
export * from './api';

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  roles?: string[];
}

// Table Column Type
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// Filter Type
export interface FilterOption {
  label: string;
  value: string;
}

// Form Field Type
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  options?: FilterOption[];
  validation?: Record<string, unknown>;
}

