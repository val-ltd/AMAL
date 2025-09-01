

'use server';

import { z } from 'zod';
import { updateRequest, createRequest } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { suggestDetails } from '@/ai/flows/suggest-details-for-budget-request';
import { updateRequestInSheet, appendRequestToSheet } from '@/lib/sheets';
import type { BudgetRequest } from '@/lib/types';

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

export async function createRequestAction(
  newRequestData: Omit<BudgetRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<{ request: BudgetRequest | null, error: string | null }> {
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
