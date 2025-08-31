
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
    updateUserInFirestore, 
    deleteUserFromFirestore,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    addDivision,
    updateDivision,
    deleteDivision
} from '@/lib/data';

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

// Institution Actions
const institutionSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Nama institusi diperlukan.'),
});

export async function saveInstitutionAction(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = institutionSchema.safeParse(data);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        const { id, name } = validatedFields.data;
        if (id) {
            await updateInstitution(id, name);
        } else {
            await addInstitution(name);
        }
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to save institution:", error);
        return { errors: { _server: ['Gagal menyimpan institusi.'] } };
    }
}

export async function deleteInstitutionAction(id: string) {
    try {
        await deleteInstitution(id);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete institution:", error);
        return { error: 'Gagal menghapus institusi.' };
    }
}


// Division Actions
const divisionSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Nama divisi diperlukan.'),
});

export async function saveDivisionAction(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = divisionSchema.safeParse(data);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        const { id, name } = validatedFields.data;
        if (id) {
            await updateDivision(id, name);
        } else {
            await addDivision(name);
        }
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to save division:", error);
        return { errors: { _server: ['Gagal menyimpan divisi.'] } };
    }
}

export async function deleteDivisionAction(id: string) {
    try {
        await deleteDivision(id);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete division:", error);
        return { error: 'Gagal menghapus divisi.' };
    }
}
