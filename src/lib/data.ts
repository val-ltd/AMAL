
// This is a mock database. In a real application, you would use a proper database.
import type { BudgetRequest, User } from './types';
import { auth } from './firebase';

let requests: BudgetRequest[] = [
  {
    id: 'req-1',
    requester: {
      id: 'user-1',
      name: 'Alice Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    },
    title: 'New ergonomic office chairs',
    description: 'Requesting 5 new ergonomic chairs for the design team to improve comfort and productivity.',
    amount: 1500.0,
    status: 'approved',
    createdAt: new Date('2024-05-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-05-11T11:30:00Z').toISOString(),
    managerComment: 'Approved. Great initiative for team wellness.',
    institution: 'DesignCo',
    division: 'Product Design',
    supervisor: { id: 'user-2', name: 'Bob Williams' },
  },
  {
    id: 'req-2',
    requester: {
      id: 'user-2',
      name: 'Bob Williams',
      avatarUrl: 'https://i.pravatar.cc/150?u=bob',
    },
    title: 'Annual software license renewal',
    description: 'Renewal for our team\'s subscription to Figma and Sketch.',
    amount: 2500.0,
    status: 'pending',
    createdAt: new Date('2024-05-15T14:20:00Z').toISOString(),
    updatedAt: new Date('2024-05-15T14:20:00Z').toISOString(),
    institution: 'DesignCo',
    division: 'Product Design',
    supervisor: { id: 'user-4', name: 'Diana Prince' },
  },
  {
    id: 'req-3',
    requester: {
      id: 'user-1',
      name: 'Alice Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    },
    title: 'Marketing campaign for Q3',
    description: 'Budget for the upcoming summer marketing campaign, including online ads and event sponsorship.',
    amount: 12000.0,
    status: 'rejected',
    createdAt: new Date('2024-05-20T09:05:00Z').toISOString(),
    updatedAt: new Date('2024-05-21T16:45:00Z').toISOString(),
    managerComment: 'Rejected. Please provide a more detailed breakdown of the ad spend.',
    institution: 'MarketingLLC',
    division: 'Growth',
    supervisor: { id: 'user-3', name: 'Charlie Brown' },
  },
  {
    id: 'req-4',
    requester: {
      id: 'user-3',
      name: 'Charlie Brown',
      avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
    },
    title: 'Team offsite event',
    description: 'Budget for a two-day team-building offsite.',
    amount: 4500.0,
    status: 'pending',
    createdAt: new Date('2024-05-22T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-05-22T11:00:00Z').toISOString(),
    institution: 'MarketingLLC',
    division: 'Brand',
    supervisor: { id: 'user-4', name: 'Diana Prince' },
  },
    {
    id: 'req-5',
    requester: {
      id: 'user-1',
      name: 'Alice Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    },
    title: 'New testing hardware',
    description: 'We need new devices (2x phones, 1x tablet) for mobile app testing.',
    amount: 2200.0,
    status: 'pending',
    createdAt: new Date('2024-05-24T15:30:00Z').toISOString(),
    updatedAt: new Date('2024-05-24T15:30:00Z').toISOString(),
    institution: 'DevShop',
    division: 'Mobile Engineering',
    supervisor: { id: 'user-2', name: 'Bob Williams' },
  },
];

// Simulate network latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getMyRequests(): Promise<BudgetRequest[]> {
  await delay(50);
  const currentUser = auth.currentUser;
  if (!currentUser) return [];
  return requests
    .filter(r => r.requester.id === currentUser.uid)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPendingRequests(): Promise<BudgetRequest[]> {
  await delay(50);
  const currentUser = auth.currentUser;
  // In a real app, you'd filter by manager ID. Here we show all pending.
  // If you wanted to show only requests where the current user is the supervisor:
  // if (!currentUser) return [];
  // return requests.filter(r => r.status === 'pending' && r.supervisor?.id === currentUser.uid);
  return requests
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createRequest(data: Omit<BudgetRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'requester'>): Promise<BudgetRequest> {
  await delay(100);
   const currentUser = auth.currentUser;
   if (!currentUser) {
       // This will likely fail in a server action context if not handled properly.
       // The auth state needs to be passed or determined on the server.
       // For this mock, we'll proceed, but in a real app this needs a server-side auth check.
       throw new Error("Not authenticated");
   }

  const newRequest: BudgetRequest = {
    ...data,
    id: `req-${Date.now()}`,
    requester: {
        id: currentUser.uid,
        name: currentUser.displayName || 'Unknown User',
        avatarUrl: currentUser.photoURL || '',
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requests.unshift(newRequest);
  return newRequest;
}

export async function updateRequest(id: string, status: 'approved' | 'rejected', managerComment: string): Promise<BudgetRequest | undefined> {
  await delay(100);
  const requestIndex = requests.findIndex(r => r.id === id);
  if (requestIndex !== -1) {
    requests[requestIndex] = {
      ...requests[requestIndex],
      status,
      managerComment,
      updatedAt: new Date().toISOString(),
    };
    return requests[requestIndex];
  }
  return undefined;
}
