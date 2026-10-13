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


export const PAYMENT_STATUSES = ['Paid', 'Pending'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

/**
 * Normalizes any category string into a valid database constraint value.
 * Prevents PostgreSQL check constraint violations (code 23514).
 */
export function normalizeExpenseCategory(cat?: string | null): ExpenseCategory {
  if (!cat) return 'Miscellaneous';
  const trimmed = cat.trim();
  if ((EXPENSE_CATEGORIES as readonly string[]).includes(trimmed)) {
    return trimmed as ExpenseCategory;
  }
  const lower = trimmed.toLowerCase();
  const directMatch = EXPENSE_CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (directMatch) return directMatch;

  if (lower.includes('food') || lower.includes('refresh') || lower.includes('tea') || lower.includes('snack')) {
    return 'Food / Refreshments';
  }
  if (lower.includes('fuel') || lower.includes('diesel') || lower.includes('petrol')) {
    return 'Fuel';
  }
  if (lower.includes('transport') || lower.includes('auto') || lower.includes('lorry') || lower.includes('truck')) {
    return 'Transport';
  }
  if (lower.includes('vehicle')) {
    return 'Vehicle';
  }
  if (lower.includes('tool')) {
    return 'Tools';
  }
  if (lower.includes('equipment') || lower.includes('machine') || lower.includes('rental')) {
    return 'Equipment Rental';
  }
  if (lower.includes('repair') || lower.includes('maintenance')) {
    return 'Repair / Maintenance';
  }
  if (lower.includes('electric') || lower.includes('current') || lower.includes('power')) {
    return 'Electricity';
  }
  if (lower.includes('water')) {
    return 'Water';
  }
  if (lower.includes('load') || lower.includes('unload')) {
    return 'Loading / Unloading';
  }
  if (lower.includes('deliver')) {
    return 'Delivery Charges';
  }
  if (lower.includes('permit') || lower.includes('approval') || lower.includes('license')) {
    return 'Permit / Approval';
  }
  if (lower.includes('waste') || lower.includes('debris') || lower.includes('rubbish')) {
    return 'Waste Removal';
  }
  if (lower.includes('safety') || lower.includes('helmet')) {
    return 'Safety Equipment';
  }
  if (lower.includes('phone') || lower.includes('recharge') || lower.includes('communication') || lower.includes('internet')) {
    return 'Communication';
  }
  if (lower.includes('office') || lower.includes('admin') || lower.includes('stationery')) {
    return 'Office / Site Administration';
  }
  if (lower.includes('travel') || lower.includes('ticket')) {
    return 'Travel';
  }

  return 'Miscellaneous';
}

/**
 * Fallback mapping for databases that only have the original Migration 001
 * check constraint: ('Materials', 'Labor', 'Transport', 'Equipment', 'Other').
 */
export function toLegacyExpenseCategory(cat?: string | null): 'Materials' | 'Labor' | 'Transport' | 'Equipment' | 'Other' {
  if (!cat) return 'Other';
  const lower = cat.toLowerCase();
  if (lower.includes('material')) return 'Materials';
  if (lower.includes('labor') || lower.includes('labour') || lower.includes('worker') || lower.includes('wage')) return 'Labor';
  if (lower.includes('transport') || lower.includes('fuel') || lower.includes('vehicle') || lower.includes('travel') || lower.includes('diesel') || lower.includes('petrol')) return 'Transport';
  if (lower.includes('equipment') || lower.includes('tool') || lower.includes('machine')) return 'Equipment';
  return 'Other';
}


