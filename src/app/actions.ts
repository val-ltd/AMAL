'use server';

import { z } from 'zod';
import { createRequest, updateRequest } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { suggestDetails } from '@/ai/flows/suggest-details-for-budget-request';
import { auth } from '@/lib/firebase';
import { appendRequestToSheet } from '@/lib/sheets';

const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  institution: z.string().min(1, 'Institution is required.'),
  division: z.string().min(1, 'Division is required.'),
  supervisor: z.string().min(1, 'Please select a supervisor.'),
});

export async function createRequestAction(formData: FormData) {
  const supervisorId = formData.get('supervisor');
  const validatedFields = requestSchema.safeParse({
    title: formData.get('title'),
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
  
    const supervisors: { [key: string]: string } = {
        'user-2': 'Bob Williams',
        'user-3': 'Charlie Brown',
        'user-4': 'Diana Prince',
    };

    const supervisorName = supervisors[supervisorId as string] || 'N/A';

  const newRequest = await createRequest({
    ...validatedFields.data,
    supervisor: {
      id: supervisorId as string,
      name: supervisorName,
    },
  });

  // Append to Google Sheet asynchronously
  if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    await appendRequestToSheet(newRequest);
  } else {
    console.log("Google Sheets environment variables not set. Skipping sheet append.");
  }


  revalidatePath('/');
  redirect('/');
}

export async function updateRequestAction(
  requestId: string,
  status: 'approved' | 'rejected',
  managerComment: string,
) {
  await updateRequest(requestId, status, managerComment);
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
