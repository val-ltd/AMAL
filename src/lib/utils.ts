import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Department } from "./types";
import { Timestamp } from "firebase/firestore";
import { format as formatFns } from "date-fns";
import { id } from "date-fns/locale";


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
        // Handle cases where it might already be an ISO string.
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    return null; // Return null for invalid or missing values
};

export const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

export const formatSimpleDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        return formatFns(new Date(dateString), "dd MMMM yyyy", { locale: id });
    } catch {
        return dateString;
    }
}
