
'use server';

import { z } from 'zod';
import { createRequest, getUser, updateRequest } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { suggestDetails } from '@/ai/flows/suggest-details-for-budget-request';
import { appendRequestToSheet, updateRequestInSheet } from '@/lib/sheets';
import { auth } from '@/lib/firebase';

const requestSchema = z.object({
  category: z.string().min(1, 'Category is required.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  supervisor: z.string().min(1, 'Please select a supervisor.'),
});

export async function createRequestAction(formData: FormData) {
  // 1. Authenticate the user on the server
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { errors: { _form: ['You must be logged in to create a request.'] } };
  }

  // 2. Validate form fields
  const validatedFields = requestSchema.safeParse({
    category: formData.get('category'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    supervisor: formData.get('supervisor'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    // 3. Get requester and supervisor data from Firestore
    const requesterData = await getUser(currentUser.uid);
    if (!requesterData || !requesterData.institution || !requesterData.division) {
        return { errors: { _form: ['Your user profile is incomplete. Missing institution or division.'] }};
    }
    
    const supervisorId = validatedFields.data.supervisor;
    const supervisor = await getUser(supervisorId);
    if (!supervisor) {
      return { errors: { supervisor: ['Selected supervisor not found.'] } };
    }

    // 4. Create the request in Firestore
    const newRequest = await createRequest({
      ...validatedFields.data,
      institution: requesterData.institution,
      division: requesterData.division,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
      },
    });

    // 5. Append to Google Sheets
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      await appendRequestToSheet(newRequest);
    } else {
      console.log("Google Sheets environment variables not set. Skipping sheet append.");
    }

  } catch (error) {
    console.error("Failed to create request:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return {
        errors: { _form: [errorMessage] },
    }
  }

  // 6. Revalidate and redirect
  revalidatePath('/');
  redirect('/');
}

export async function updateRequestAction(
  requestId: string,
  status: 'approved' | 'rejected',
  managerComment: string,
) {
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
