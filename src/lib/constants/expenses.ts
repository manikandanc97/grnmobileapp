export const EXPENSE_CATEGORIES = [
  'Transport',
  'Fuel',
  'Vehicle',
  'Equipment Rental',
  'Machine Rental',
  'Tools',
  'Electricity',
  'Water',
  'Site Accommodation',
  'Food / Refreshments',
  'Travel',
  'Loading / Unloading',
  'Delivery Charges',
  'Permit / Approval',
  'Waste Removal',
  'Repair / Maintenance',
  'Safety Equipment',
  'Communication',
  'Office / Site Administration',
  'Miscellaneous',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PAYMENT_STATUSES = ['Paid', 'Pending'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
