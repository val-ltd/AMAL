

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  Unsubscribe,
  orderBy,
  getDocs,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { BudgetRequest, User, Department, BudgetCategory, FundAccount, Notification, Role, Bank, Unit, MemoSubject } from './types';
import { auth, db } from './firebase';
import { appendRequestToSheet, updateRequestInSheet } from './sheets';

// This function now returns an unsubscribe function for the real-time listener
export function getMyRequests(
  callback: (requests: BudgetRequest[]) => void
): Unsubscribe {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // Return a no-op unsubscribe function if there's no user
    return () => {};
  }

  const q = query(
    collection(db, 'requests'),
    where('requester.id', '==', currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const requests: BudgetRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
      } as BudgetRequest);
    });
    callback(requests);
  }, (error) => {
    console.error("Error fetching user's requests:", error);
    callback([]);
  });

  return unsubscribe;
}

// This function now returns an unsubscribe function for the real-time listener
export function getPendingRequests(
  callback: (requests: BudgetRequest[]) => void
): Unsubscribe {
   const currentUser = auth.currentUser;
   if (!currentUser) {
     return () => {};
   }

   // The logic to check if user is manager is now server-side in the calling component
   // or page. This function just fetches data.
   const q = query(
    collection(db, 'requests'), 
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const requests: BudgetRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
      } as BudgetRequest);
    });
    callback(requests);
  }, (error) => {
      console.error("Error fetching pending requests:", error);
      callback([]);
  });

  return unsubscribe;
}

export function getApprovedUnreleasedRequests(
  callback: (requests: BudgetRequest[]) => void
): Unsubscribe {
   const currentUser = auth.currentUser;
   if (!currentUser) {
     return () => {};
   }
   
   const q = query(
    collection(db, 'requests'), 
    where('status', '==', 'approved'),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const requests: BudgetRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
        releasedAt: data.releasedAt?.toDate().toISOString(),
      } as BudgetRequest);
    });
    callback(requests);
  }, (error) => {
      console.error("Error fetching approved unreleased requests:", error);
      callback([]);
  });

  return unsubscribe;
}


export async function createRequest(
  data: Omit<BudgetRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
): Promise<BudgetRequest> {

  const newRequestData = {
    ...data,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'requests'), newRequestData);
  
  const newDoc = await getDoc(docRef);
  const createdData = newDoc.data();

  const finalRequest = {
    id: newDoc.id,
    ...createdData,
    createdAt: createdData?.createdAt?.toDate().toISOString(),
    updatedAt: createdData?.updatedAt?.toDate().toISOString(),
  } as BudgetRequest;
  
  // Await the sheet append operation
  await appendRequestToSheet(finalRequest);

  return finalRequest;
}

export async function updateRequest(
  id: string,
  status: 'approved' | 'rejected',
  managerComment: string
): Promise<BudgetRequest | undefined> {
    const requestRef = doc(db, 'requests', id);
    await updateDoc(requestRef, {
        status,
        managerComment,
        updatedAt: serverTimestamp(),
    });

    const updatedDoc = await getDoc(requestRef);
    if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        const updatedRequest = {
            id: updatedDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString(),
        } as BudgetRequest;
        await updateRequestInSheet(updatedRequest);
        return updatedRequest;
    }
    return undefined;
}

export async function markRequestsAsReleased(requestIds: string[], releasedBy: {id: string, name: string}, fundSourceId: string): Promise<void> {
    const batch = writeBatch(db);
    
    const requestsToUpdate = await Promise.all(
      requestIds.map(id => getDoc(doc(db, 'requests', id)))
    );

    const updatedRequestsForSheet: BudgetRequest[] = [];

    requestsToUpdate.forEach(requestDoc => {
        if (requestDoc.exists()) {
            const requestData = requestDoc.data() as BudgetRequest;
            const requestRef = doc(db, 'requests', requestDoc.id);

            const releasedAt = new Date();

            batch.update(requestRef, {
                status: 'released',
                releasedAt: Timestamp.fromDate(releasedAt),
                releasedBy: releasedBy,
                fundSourceId: fundSourceId,
                updatedAt: serverTimestamp()
            });

            updatedRequestsForSheet.push({
                ...requestData,
                id: requestDoc.id,
                status: 'released',
                releasedAt: releasedAt.toISOString(),
                releasedBy: releasedBy,
                fundSourceId: fundSourceId,
            });

            // Create notification for requester
            const notificationData = {
                userId: requestData.requester.id,
                type: 'funds_released' as const,
                title: 'Dana Telah Dicairkan',
                message: `Dana untuk permintaan "${requestData.items[0]?.description || 'N/A'}" (${formatRupiah(requestData.amount)}) telah dicairkan.`,
                requestId: requestDoc.id,
                isRead: false,
                createdAt: serverTimestamp(),
                createdBy: {
                    id: releasedBy.id,
                    name: releasedBy.name,
                }
            };
            const notificationRef = doc(collection(db, 'notifications'));
            batch.set(notificationRef, notificationData);
        }
    });

    await batch.commit();

    // After successful commit, update all sheets
    await Promise.all(updatedRequestsForSheet.map(req => updateRequestInSheet(req)));
}


export async function getRequest(id: string): Promise<BudgetRequest | null> {
    if (!id) return null;
    const requestDocRef = doc(db, 'requests', id);
    const requestDoc = await getDoc(requestDocRef);
    if (requestDoc.exists()) {
        const data = requestDoc.data();
        return { 
            id: requestDoc.id, 
            ...data,
            createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
        } as BudgetRequest;
    }
    return null;
}


export async function getUser(uid: string): Promise<User | null> {
    if (!uid) return null;
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
}

export async function getManagers(): Promise<User[]> {
    const q = query(
        collection(db, 'users'),
        where('roles', 'array-contains-any', ['Manager', 'Admin', 'Super Admin'])
    );
    const querySnapshot = await getDocs(q);
    const managers: User[] = [];
    querySnapshot.forEach((doc) => {
        managers.push({ id: doc.id, ...doc.data() } as User);
    });
    return managers;
}

export async function getDepartments(): Promise<Department[]> {
    const q = query(
        collection(db, 'departments'),
        where('isDeleted', 'in', [false, null]),
        orderBy('lembaga'),
        orderBy('divisi'),
        orderBy('bagian'),
        orderBy('unit')
    );
    const querySnapshot = await getDocs(q);
    const departments: Department[] = [];
    querySnapshot.forEach((doc) => {
        departments.push({ id: doc.id, ...doc.data() } as Department);
    });
    return departments;
}

export async function getDepartmentsByIds(ids: string[]): Promise<Department[]> {
    if (!ids || ids.length === 0) {
        return [];
    }
    // Firestore 'in' query can take up to 30 items. If more, split into chunks.
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
        chunks.push(ids.slice(i, i + 30));
    }

    const departmentPromises = chunks.map(chunk => 
        getDocs(query(collection(db, 'departments'), where('__name__', 'in', chunk)))
    );
    
    const querySnapshots = await Promise.all(departmentPromises);
    
    const departments: Department[] = [];
    querySnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
            departments.push({ id: doc.id, ...doc.data() } as Department);
        });
    });

    return departments;
}

export async function getCollection<T>(collectionName: string, orderField: string): Promise<T[]> {
    const q = query(collection(db, collectionName), where('isDeleted', 'in', [false, null]), orderBy(orderField));
    const querySnapshot = await getDocs(q);
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
    });
    return items;
}

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
    return getCollection<BudgetCategory>('budgetCategories', 'name');
}

export async function getFundAccounts(): Promise<FundAccount[]> {
    return getCollection<FundAccount>('fundAccounts', 'accountName');
}

export async function getBanks(): Promise<Bank[]> {
    return getCollection<Bank>('banks', 'name');
}

export async function getUnits(): Promise<Unit[]> {
    return getCollection<Unit>('units', 'name');
}

export async function getMemoSubjects(): Promise<MemoSubject[]> {
    return getCollection<MemoSubject>('memoSubjects', 'name');
}


export async function getFundAccount(id: string): Promise<FundAccount | null> {
    if (!id) return null;
    const docRef = doc(db, 'fundAccounts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FundAccount;
    }
    return null;
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};


// --- Notifications ---

export function getNotifications(
  userRoles: Role[],
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return () => {};
  }
  
  const isAdmin = userRoles.includes('Admin') || userRoles.includes('Super Admin');

  let notificationsQuery;
  if (isAdmin) {
    // Admins see all notifications
    notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
    );
  } else {
    // Regular users see only their own
    notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
    );
  }


  const unsubscribe = onSnapshot(notificationsQuery, (querySnapshot) => {
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
      } as Notification);
    });
    callback(notifications);
  }, (error) => {
    console.error("Error fetching notifications:", error);
    callback([]);
  });

  return unsubscribe;
}

export async function markNotificationAsRead(notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { isRead: true });
}


export async function deleteNotification(notificationId: string) {
  await deleteDoc(doc(db, 'notifications', notificationId));
}

export async function deleteReadNotifications(userId: string) {
  const q = query(
    collection(db, 'notifications'), 
    where('userId', '==', userId),
    where('isRead', '==', true)
  );
  
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  querySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}
