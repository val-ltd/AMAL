'use server';

import { z } from 'zod';
import { createRequest, updateRequest } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { suggestDetails } from '@/ai/flows/suggest-details-for-budget-request';

const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
});

export async function createRequestAction(formData: FormData) {
  const validatedFields = requestSchema.safeParse({
    title: formData.get('title'),
    amount: formData.get('amount'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  await createRequest({
    ...validatedFields.data,
    requester: {
      id: 'user-1',
      name: 'Alice Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    },
  });

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
