
export type Role = 'Admin' | 'Manager' | 'Employee' | 'Super Admin' | 'Releaser';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  avatarUrl: string;
  position?: string;
  institution?: string;
  division?: string;
  supervisorId?: string;
  deciderId?: string;
  supervisor?: User;
  decider?: User;
  departmentIds?: string[];
  isVerified?: boolean;
}

export interface RequestItem {
  id: string; //
  description: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  category: string;
}

export interface BudgetRequest {
  id: string;
  requester: {
    id:string;
    name: string;
    avatarUrl: string;
  };
  items: RequestItem[];
  amount: number; // This will be the sum of all item totals
  status: 'pending' | 'approved' | 'rejected' | 'released';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  managerComment?: string;
  institution: string; // Top-level institution for grouping
  division: string;
  supervisor?: {
    id: string;
    name: string;
  };
  department?: Department; // The specific department making the request
  sheetRowNumber?: number;
  releasedAt?: string; // ISO string
  releasedBy?: {
    id: string;
    name: string;
  };
  additionalInfo?: string;
}

export interface Department {
    id: string;
    lembaga: string;
    divisi: string;
    bagian?: string;
    unit?: string;
}

export interface BudgetCategory {
    id: string;
    name: string;
}
