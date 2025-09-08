

export type Role = 'Admin' | 'Manager' | 'Employee' | 'Super Admin' | 'Releaser';

export interface UserBankAccount {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  bankCode?: string;
}

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
  isDeleted?: boolean;
  // New fields
  gender?: 'Male' | 'Female';
  phoneNumber?: string;
  address?: string;
  bankAccounts?: UserBankAccount[];
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

export interface ReportAttachment {
    url: string;
    fileName: string;
    type: string;
}

export interface ExpenseReport {
    submittedBy: {
        id: string;
        name: string;
    };
    submittedAt: any; // serverTimestamp()
    spentAmount: number;
    notes: string;
    attachments: ReportAttachment[];
    requestId: string;
}

export interface BudgetRequest {
  id: string;
  requester: {
    id:string;
    name: string;
    avatarUrl: string;
  };
  subject: string; // New field for the memo subject/title
  items: RequestItem[];
  amount: number; // This will be the sum of all item totals
  status: 'pending' | 'approved' | 'rejected' | 'released' | 'completed' | 'draft';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  managerComment?: string;
  institution: string; // Top-level institution for grouping
  division: string;
  supervisor?: {
    id: string;
    name: string;
  };
  department?: Omit<Department, 'id' | 'isDeleted'>;
  sheetStartRow?: number;
  sheetEndRow?: number;
  releasedAt?: string; // ISO string
  releasedBy?: {
    id: string;
    name: string;
  };
  additionalInfo?: string;
  fundSourceId?: string;
  // New fields
  paymentMethod?: 'Cash' | 'Transfer';
  transferType?: 'RTGS' | 'BI-FAST' | 'LLG';
  reimbursementAccount?: UserBankAccount;
  report?: ExpenseReport;
  budgetPeriod?: string;
  transferFee?: number;
}

export interface Department {
    id: string;
    lembaga: string;
    divisi: string;
    bagian?: string | null;
    unit?: string | null;
    isDeleted?: boolean;
}

export interface BudgetCategory {
    id: string;
    name: string;
    isDeleted?: boolean;
}

export interface FundAccount {
    id: string;
    accountName: string; // NAMA REKENING
    accountNumber: string; // NO. REK
    bankName: string; // BANK
    isDeleted?: boolean;
    // New fields
    namaLembaga: string;
    cabang: string;
    pejabatNama: string;
    pejabatJabatan: string;
    namaBendahara: string;
    bankBendahara: string;
    rekeningBendahara: string;
    kodeBank?: string;
    petugas: string;
}

export interface Notification {
  id: string;
  userId: string; // The user who receives the notification
  type: 'new_request' | 'request_approved' | 'request_rejected' | 'funds_released' | 'request_submitted' | 'ready_for_release';
  title: string;
  message: string;
  requestId: string;
  isRead: boolean;
  createdAt: string; // ISO string
  createdBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface Bank {
    id: string;
    name: string;
    code: string;
    isDeleted?: boolean;
}

export interface Unit {
    id: string;
    name: string;
    isDeleted?: boolean;
}

export interface MemoSubject {
    id: string;
    name: string;
    isDeleted?: boolean;
}

export interface TransferSettings {
    fees: {
        'BI-FAST': number;
        RTGS: number;
        LLG: number;
    };
    defaultFee: number;
}
