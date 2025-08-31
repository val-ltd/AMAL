
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateUserInFirestore, deleteUserFromFirestore } from '@/lib/data';

const userSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('Invalid email address.'),
    role: z.enum(['Admin', 'Manager', 'Employee']),
    institution: z.string().optional(),
    division: z.string().optional(),
});

export async function updateUserAction(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    
    // Manually handle empty optional fields
    if (data.institution === '') data.institution = undefined;
    if (data.division === '') data.division = undefined;

    const validatedFields = userSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        const { id, ...userData } = validatedFields.data;
        await updateUserInFirestore(id, userData);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { errors: { _server: ['Failed to update user.'] } };
    }
}


export async function deleteUserAction(userId: string) {
    if (!userId) {
        return { error: 'User ID is required.' };
    }
    try {
        await deleteUserFromFirestore(userId);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { error: 'Failed to delete user.' };
    }
}
