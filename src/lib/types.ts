export interface BudgetRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  managerComment?: string;
}
