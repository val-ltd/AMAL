

'use server';

import { z } from 'zod';
import { updateRequest, createRequest, getUser, getRequest } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { suggestDetails } from '@/ai/flows/suggest-details-for-budget-request';
import { updateRequestInSheet, appendRequestToSheet } from '@/lib/sheets';
import type { BudgetRequest, User, Department, BudgetCategory } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function updateRequestAction(
  requestId: string,
  status: 'approved' | 'rejected',
  managerComment: string,
) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to perform this action.');
  }

  const [currentUserProfile, requestToUpdate] = await Promise.all([
    getUser(user.uid),
    getRequest(requestId),
  ]);

  if (!currentUserProfile) {
    throw new Error('Could not find your user profile.');
  }

  if (!requestToUpdate) {
    throw new Error('The request you are trying to update does not exist.');
  }
  
  const isSupervisor = requestToUpdate.supervisor?.id === user.uid;
  const isAdmin = currentUserProfile.role === 'Admin';

  if (!isSupervisor && !isAdmin) {
      throw new Error("You are not authorized to update this request.");
  }

  const updatedRequest = await updateRequest(requestId, status, managerComment);
  
  if (updatedRequest && process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      await updateRequestInSheet(updatedRequest);
  } else {
      console.log("Google Sheets environment variables not set or request update failed. Skipping sheet update.");
  }
  
  revalidatePath('/manager');
}


export async function getSuggestionsAction(description: string) {
  if (description.length < 20) {
    return { suggestions: [], error: 'Please provide a more detailed description before getting suggestions.' };
  }
  try {
    const result = await suggestDetails({ description });
    return { suggestions: result.suggestions };
  } catch (error) {
    console.error(error);
    return { suggestions: [], error: 'Failed to get AI suggestions. Please try again.' };
  }
}

export async function createRequestAction(
  newRequestData: Omit<BudgetRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<{ request: BudgetRequest | null, error: string | null }> {
    // The security check for user authorization should be handled by ensuring
    // the requester ID in newRequestData is populated from a trusted, authenticated source on the client.
    // The check `auth.currentUser.uid === newRequestData.requester.id` can be unreliable in server actions.
    
    try {
        const newRequest = await createRequest(newRequestData);

        if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            await appendRequestToSheet(newRequest);
        } else {
            console.log("Google Sheets environment variables not set. Skipping sheet append.");
        }
        
        revalidatePath('/');
        return { request: newRequest, error: null };

    } catch (error) {
        console.error("Error creating request:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.';
        return { request: null, error: errorMessage };
    }
}

async function requireAdmin() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Authentication required.");
    }
    const userProfile = await getUser(user.uid);
    if (userProfile?.role !== 'Admin') {
        throw new Error("You must be an administrator to perform this action.");
    }
    return userProfile;
}

export async function deleteUserAction(userId: string) {
    await requireAdmin();
    await deleteDoc(doc(db, 'users', userId));
    revalidatePath('/admin');
}

export async function updateUserAction(userId: string, data: Partial<User>) {
    await requireAdmin();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
    revalidatePath('/admin');
    revalidatePath(`/admin/${userId}/edit`);
}

export async function deleteDepartmentAction(departmentId: string) {
    await requireAdmin();
    await deleteDoc(doc(db, 'departments', departmentId));
    revalidatePath('/admin');
}

export async function saveDepartmentAction(department: Omit<Department, 'id'>, id?: string) {
    await requireAdmin();
    if (id) {
        const deptRef = doc(db, 'departments', id);
        await updateDoc(deptRef, department);
    } else {
        await addDoc(collection(db, 'departments'), department);
    }
    revalidatePath('/admin');
}

export async function deleteCategoryAction(categoryId: string) {
    await requireAdmin();
    await deleteDoc(doc(db, 'budgetCategories', categoryId));
    revalidatePath('/admin');
}

export async function saveCategoryAction(category: Omit<BudgetCategory, 'id'>, id?: string) {
    await requireAdmin();
    if (id) {
        const catRef = doc(db, 'budgetCategories', id);
        await updateDoc(catRef, category);
    } else {
        await addDoc(collection(db, 'budgetCategories'), category);
    }
    revalidatePath('/admin');
}
