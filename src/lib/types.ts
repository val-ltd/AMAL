
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  avatarUrl: string;
  position?: string;
  institution?: string;
  division?: string;
  supervisorId?: string;
  deciderId?: string;
  supervisor?: User;
  decider?: User;
  departmentIds?: string[]; // Changed from departmentId to departmentIds
}

export interface BudgetRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  category: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  managerComment?: string;
  institution: string;
  division: string;
  supervisor?: {
    id: string;
    name: string;
  };
  department?: Department;
}

export interface Department {
    id: string;
    lembaga: string;
    divisi: string;
    bagian?: string;
    unit?: string;
}
