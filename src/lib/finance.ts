/**
 * Financial utilities for the GRN Construction app.
 */

/**
 * Formats a given amount into Indian Rupee format (e.g., ₹1,25,000)
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null || isNaN(amount)) return '₹0';
  
  // Use Intl.NumberFormat for proper Indian comma formatting
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  usagePercent: number;
  materialCost: number;
  laborCost: number;
  expenseCost: number;
  status: 'Normal' | 'Near Limit' | 'Exceeded';
}

/**
 * Calculates the overall budget summary for a site given its financial records.
 */
export const calculateBudgetSummary = (
  totalBudget: number | null,
  materialCost: number,
  laborCost: number,
  expenseCost: number
): BudgetSummary => {
  const budget = totalBudget || 0;
  const totalSpent = materialCost + laborCost + expenseCost;
  const remainingBudget = budget - totalSpent;
  
  let usagePercent = 0;
  if (budget > 0) {
    usagePercent = (totalSpent / budget) * 100;
  }
  
  let status: BudgetSummary['status'] = 'Normal';
  if (usagePercent >= 100) {
    status = 'Exceeded';
  } else if (usagePercent >= 80) {
    status = 'Near Limit';
  }
  
  return {
    totalBudget: budget,
    totalSpent,
    remainingBudget,
    usagePercent,
    materialCost,
    laborCost,
    expenseCost,
    status
  };
};

/**
 * Safely calculates material cost.
 */
export const calculateMaterialCost = (quantity: number, unitPrice: number): number => {
  const q = isNaN(quantity) ? 0 : quantity;
  const p = isNaN(unitPrice) ? 0 : unitPrice;
  return Number((q * p).toFixed(2));
};
