import { ExpenseCategory, PaymentMethod, PaymentStatus } from '@/lib/constants/expenses';

export type MetricItem = {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  iconName: 'Building2' | 'Briefcase' | 'CheckSquare' | 'IndianRupee' | 'Package' | 'Users' | 'ReceiptText';
  trend?: string;
};

export type SiteType = 'Residential' | 'Commercial' | 'Renovation';

export type SiteStatus = 'On Track' | 'In Progress' | 'Finishing' | 'Delayed';

export type SiteItem = {
  id: string;
  name: string;
  location: string;
  type: SiteType;
  progress: number; // 0 - 100
  status: SiteStatus;
  workers?: number;
  startDate?: string;
  expectedCompletion?: string;
  budget?: string;
  expenses?: string;
  pendingTasks?: number;
};

export type QuickActionItem = {
  id: string;
  title: string;
  iconName: 'Building2' | 'PackagePlus' | 'UserCheck' | 'Receipt';
  badge?: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  siteName: string;
  timestamp: string;
  type: 'material' | 'labor' | 'delivery' | 'progress';
};


export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'add-site',
    title: 'Add Site',
    iconName: 'Building2',
  },
  {
    id: 'add-material',
    title: 'Add Material',
    iconName: 'PackagePlus',
  },
  {
    id: 'labor-attendance',
    title: 'Labor Attendance',
    iconName: 'UserCheck',
  },
  {
    id: 'add-expense',
    title: 'Add Expense',
    iconName: 'Receipt',
  },
];


export type MaterialCategory = string;
export type MaterialUnit = string;
export type MaterialStatus = 'Available' | 'Low Stock' | 'Pending' | 'Out of Stock';

export type MaterialItem = {
  id: string;
  name: string;
  category: MaterialCategory;
  siteId: string;
  siteName: string;
  quantity: number;
  unit: MaterialUnit;
  status: MaterialStatus;
  lastUpdated: string;
  used: number;
  received: number;
  unitPrice: number;
  totalCost: number;
};


export type WorkerRole = 'Mason' | 'Painter' | 'Electrician' | 'Plumber' | 'Carpenter' | 'Supervisor' | 'Laborer' | 'Other';
export type WorkerStatus = 'Present' | 'Absent' | 'Not Marked' | 'Half Day';

export type WorkerItem = {
  id: string;
  name: string;
  role: WorkerRole;
  siteId: string;
  siteName: string;
  phone: string;
  joiningDate: string;
  todayStatus: WorkerStatus;
  payFrequency: 'Daily' | 'Weekly' | 'Monthly';
  salaryAmount: number;
};



export type { ExpenseCategory, PaymentMethod, PaymentStatus };

export type ExpenseItem = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  siteId: string;
  siteName: string;
  expenseDate: string; // ISO or formatted date string
  vendor: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  reference?: string;
  notes?: string;
};


