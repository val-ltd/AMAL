

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
  DocumentReference,
  setDoc,
  arrayRemove,
} from 'firebase/firestore';
import type { BudgetRequest, User, Department, BudgetCategory, FundAccount, Notification, Role, Bank, Unit, MemoSubject, ExpenseReport, TransferType } from './types';
import { auth, db } from './firebase';
import { appendRequestToSheet, updateRequestInSheet } from './sheets';

const toIsoIfTimestamp = (timestamp: any) => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        // Handle cases where it might already be an ISO string.
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    return null;
};


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
        createdAt: toIsoIfTimestamp(data.createdAt) || new Date().toISOString(),
        updatedAt: toIsoIfTimestamp(data.updatedAt) || new Date().toISOString(),
        releasedAt: toIsoIfTimestamp(data.releasedAt),
        managerActionAt: toIsoIfTimestamp(data.managerActionAt),
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
        createdAt: toIsoIfTimestamp(data.createdAt) || new Date().toISOString(),
        updatedAt: toIsoIfTimestamp(data.updatedAt) || new Date().toISOString(),
        releasedAt: toIsoIfTimestamp(data.releasedAt),
        managerActionAt: toIsoIfTimestamp(data.managerActionAt),
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
        createdAt: toIsoIfTimestamp(data.createdAt) || new Date().toISOString(),
        updatedAt: toIsoIfTimestamp(data.updatedAt) || new Date().toISOString(),
        releasedAt: toIsoIfTimestamp(data.releasedAt),
        managerActionAt: toIsoIfTimestamp(data.managerActionAt),
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
  data: Omit<BudgetRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
): Promise<DocumentReference> {
  // Generate a new Firestore document reference to get a unique ID first
  const newRequestRef = doc(collection(db, 'requests'));
  const newRequestId = newRequestRef.id;

  const requestWithId = {
    ...data,
    id: newRequestId,
    status: 'pending' as const,
    createdAt: new Date().toISOString(), // Use ISO string for sheet
    updatedAt: new Date().toISOString(),
  };
  
  if (requestWithId.paymentMethod !== 'Transfer') {
    delete requestWithId.reimbursementAccount;
  }

  try {
    // Step 1: Append to Google Sheets first, using the pre-generated ID
    const sheetUpdateResponse = await appendRequestToSheet(requestWithId as any); // `any` because sheet type is broader

    // Step 2: If sheet append is successful, save to Firestore with the same ID
    const requestDataForFirestore = {
      ...data, // Original data without the extra fields for the sheet
      id: newRequestId,
      status: 'pending',
      sheetStartRow: sheetUpdateResponse.startRow,
      sheetEndRow: sheetUpdateResponse.endRow,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Remove reimbursementAccount if not needed, to avoid Firestore undefined error
    if (requestDataForFirestore.paymentMethod !== 'Transfer') {
      delete (requestDataForFirestore as any).reimbursementAccount;
    }

    await setDoc(newRequestRef, requestDataForFirestore);
    return newRequestRef;
  } catch (error) {
    console.error("Error during request creation and sheet append:", error);
    // Rethrow to be caught by the form handler
    throw error;
  }
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};


export async function updateRequest(
  id: string,
  status: 'approved' | 'rejected',
  managerComment: string,
  managerProfile: User
): Promise<BudgetRequest | undefined> {
    const requestRef = doc(db, 'requests', id);
    const requestSnapshot = await getDoc(requestRef);
    if (!requestSnapshot.exists()) {
        throw new Error("No document to update: The request does not exist.");
    }
    
    const requestData = requestSnapshot.data() as BudgetRequest;

    const batch = writeBatch(db);

    batch.update(requestRef, {
        status,
        managerComment,
        managerActionAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    const firstItemDesc = requestData.items[0]?.description || 'N/A';
    const amountFormatted = formatRupiah(requestData.amount);

    const requesterNotification = {
        userId: requestData.requester.id,
        type: status === 'approved' ? 'request_approved' : 'request_rejected',
        title: `Permintaan ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
        message: `Permintaan Anda untuk "${firstItemDesc}" (${amountFormatted}) telah di${status === 'approved' ? 'setujui' : 'tolak'} oleh ${managerProfile.name}.`,
        requestId: requestData.id,
        isRead: false,
        createdAt: serverTimestamp(),
        createdBy: {
            id: managerProfile.id,
            name: managerProfile.name,
            avatarUrl: managerProfile.avatarUrl,
        }
    };
    batch.set(doc(collection(db, 'notifications')), requesterNotification);
    
    if (status === 'approved') {
        const releasersSnapshot = await getDocs(query(collection(db, 'users'), where('roles', 'array-contains', 'Releaser')));
        releasersSnapshot.forEach(releaserDoc => {
            const releaserNotification = {
                userId: releaserDoc.id,
                type: 'ready_for_release' as const,
                title: 'Siap Dicairkan',
                message: `Permintaan dari ${requestData.requester.name} (${amountFormatted}) telah disetujui dan siap untuk dicairkan.`,
                requestId: requestData.id,
                isRead: false,
                createdAt: serverTimestamp(),
                createdBy: {
                    id: managerProfile.id,
                    name: managerProfile.name,
                }
            };
            batch.set(doc(collection(db, 'notifications')), releaserNotification);
        });
    }

    try {
        await batch.commit();

        if (requestData.sheetStartRow && requestData.sheetEndRow) {
            await updateRequestInSheet(status, requestData.sheetStartRow, requestData.sheetEndRow);
        } else {
            console.warn(`Cannot update sheet for request ${id}: missing sheet row numbers.`);
        }

        const updatedRequestForApp: BudgetRequest = {
            ...requestData,
            id: id,
            status,
            managerComment,
            updatedAt: new Date().toISOString(),
        };
        return updatedRequestForApp;
    } catch (error) {
        console.error("Error committing batch or updating sheet:", error);
        throw error;
    }
}

export async function markRequestsAsReleased(requestIds: string[], releasedBy: {id: string, name: string}): Promise<void> {
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
                updatedAt: serverTimestamp()
            });

            const updatedRequestData = {
                ...requestData,
                id: requestDoc.id,
                status: 'released' as const,
                releasedAt: releasedAt.toISOString(),
                releasedBy: releasedBy,
            };
            updatedRequestsForSheet.push(updatedRequestData);

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
    await Promise.all(updatedRequestsForSheet.map(req => {
        if (req.sheetStartRow && req.sheetEndRow) {
            updateRequestInSheet(req.status, req.sheetStartRow, req.sheetEndRow);
        }
    }));
}

export async function submitReport(requestId: string, reportData: Omit<ExpenseReport, 'submittedAt' | 'requestId'>) {
    const reportWithTimestamp = {
        ...reportData,
        requestId,
        submittedAt: serverTimestamp(),
    };
    
    // Create the new report document
    await addDoc(collection(db, 'reports'), reportWithTimestamp);
    
    // Update the original request's status
    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
        status: 'completed',
        report: reportData, // Embed report data for easy access
        updatedAt: serverTimestamp(),
    });
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
            createdAt: toIsoIfTimestamp(data.createdAt) || new Date().toISOString(),
            updatedAt: toIsoIfTimestamp(data.updatedAt) || new Date().toISOString(),
            releasedAt: toIsoIfTimestamp(data.releasedAt),
            managerActionAt: toIsoIfTimestamp(data.managerActionAt),
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

export async function getCollectionData<T>(collectionName: string, orderField?: string): Promise<T[]> {
    const constraints = [where('isDeleted', '!=', true)];
    if(orderField) {
        constraints.push(orderBy('isDeleted')); // Required for inequality filter
        constraints.push(orderBy(orderField));
    }
    
    const q = query(collection(db, collectionName), ...constraints);

    const querySnapshot = await getDocs(q);
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
    });
    return items;
}

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
    return getCollectionData<BudgetCategory>('budgetCategories', 'name');
}

export async function getFundAccounts(): Promise<FundAccount[]> {
    return getCollectionData<FundAccount>('fundAccounts', 'accountName');
}

export async function getBanks(): Promise<Bank[]> {
    return getCollectionData<Bank>('banks', 'name');
}

export async function getUnits(): Promise<Unit[]> {
    return getCollectionData<Unit>('units', 'name');
}

export async function getMemoSubjects(): Promise<MemoSubject[]> {
    return getCollectionData<MemoSubject>('memoSubjects', 'name');
}

export async function getTransferTypes(): Promise<TransferType[]> {
    return getCollectionData<TransferType>('transferTypes', 'name');
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
  await deleteDoc(doc(collection(db, 'notifications'), notificationId));
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


export async function deleteDepartment(departmentId: string) {
  const batch = writeBatch(db);

  // 1. Soft delete the department
  const deptRef = doc(db, 'departments', departmentId);
  batch.update(deptRef, { isDeleted: true });

  // 2. Find all users with this departmentId
  const usersQuery = query(collection(db, 'users'), where('departmentIds', 'array-contains', departmentId));
  const usersSnapshot = await getDocs(usersQuery);

  // 3. Remove the departmentId from each user's departmentIds array
  usersSnapshot.forEach(userDoc => {
    const userRef = doc(db, 'users', userDoc.id);
    batch.update(userRef, {
      departmentIds: arrayRemove(departmentId)
    });
  });

  // Commit all operations atomically
  await batch.commit();
}

    
    