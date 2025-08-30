
'use server';

import { z } from 'zod';
import { createRequest, getUser, updateRequest } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { suggestDetails } from '@/ai/flows/suggest-details-for-budget-request';
import { appendRequestToSheet, updateRequestInSheet } from '@/lib/sheets';

const requestSchema = z.object({
  category: z.string().min(1, 'Category is required.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  institution: z.string().min(1, 'Institution is required.'),
  division: z.string().min(1, 'Division is required.'),
  supervisor: z.string().min(1, 'Please select a supervisor.'),
});

export async function createRequestAction(formData: FormData) {
  const supervisorId = formData.get('supervisor');
  const validatedFields = requestSchema.safeParse({
    category: formData.get('category'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    institution: formData.get('institution'),
    division: formData.get('division'),
    supervisor: supervisorId,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const supervisor = await getUser(supervisorId as string);
    if (!supervisor) {
      return {
        errors: { supervisor: ['Selected supervisor not found.'] },
      }
    }
    const supervisorName = supervisor?.name || 'N/A';

    const newRequest = await createRequest({
      ...validatedFields.data,
      supervisor: {
        id: supervisorId as string,
        name: supervisorName,
      },
    });

    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      await appendRequestToSheet(newRequest);
    } else {
      console.log("Google Sheets environment variables not set. Skipping sheet append.");
    }

  } catch (error) {
    console.error("Failed to create request:", error);
    return {
        errors: { _form: ['An unexpected error occurred. Please try again.'] },
    }
  }


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
