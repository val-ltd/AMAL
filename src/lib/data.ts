
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
} from 'firebase/firestore';
import type { BudgetRequest, User, Institution, Division } from './types';
import { auth, db } from './firebase';

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

  // To show all pending requests for any manager, as was the mock logic
  const q = query(
    collection(db, 'requests'), 
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc')
  );
  
  // If you only want to show requests for the CURRENT user as supervisor:
  // const q = query(
  //   collection(db, 'requests'),
  //   where('status', '==', 'pending'),
  //   where('supervisor.id', '==', currentUser.uid),
  //   orderBy('createdAt', 'asc')
  // );


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

export async function createRequest(
  data: Omit<BudgetRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
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

  return {
    id: newDoc.id,
    ...createdData,
    createdAt: createdData?.createdAt?.toDate().toISOString(),
    updatedAt: createdData?.updatedAt?.toDate().toISOString(),
  } as BudgetRequest;
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
        return {
            id: updatedDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString(),
        } as BudgetRequest;
    }
    return undefined;
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
        where('role', '==', 'Manager')
    );
    const querySnapshot = await getDocs(q);
    const managers: User[] = [];
    querySnapshot.forEach((doc) => {
        managers.push({ id: doc.id, ...doc.data() } as User);
    });
    return managers;
}

export async function updateUserInFirestore(userId: string, data: Partial<Omit<User, 'id'>>) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
}

export async function deleteUserFromFirestore(userId: string) {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}

// Institution Functions
export async function getInstitutions(): Promise<Institution[]> {
    const q = query(collection(db, 'institutions'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institution));
}

export async function addInstitution(name: string) {
    await addDoc(collection(db, 'institutions'), { name });
}

export async function updateInstitution(id: string, name: string) {
    const instRef = doc(db, 'institutions', id);
    await updateDoc(instRef, { name });
}

export async function deleteInstitution(id: string) {
    await deleteDoc(doc(db, 'institutions', id));
}


// Division Functions
export async function getDivisions(): Promise<Division[]> {
    const q = query(collection(db, 'divisions'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Division));
}

export async function addDivision(name: string) {
    await addDoc(collection(db, 'divisions'), { name });
}

export async function updateDivision(id: string, name: string) {
    const divRef = doc(db, 'divisions', id);
    await updateDoc(divRef, { name });
}

export async function deleteDivision(id: string) {
    await deleteDoc(doc(db, 'divisions', id));
}
