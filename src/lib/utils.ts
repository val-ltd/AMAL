import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Department } from "./types";
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDepartment(department: Department): string {
    return [department.lembaga, department.divisi, department.bagian, department.unit]
        .filter(Boolean) // Remove empty or null values
        .join(' / ');
}

export const toIsoIfTimestamp = (timestamp: any): string | null => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
        return timestamp; // Already a string
    }
    return null; // Return null for invalid or missing values
};
