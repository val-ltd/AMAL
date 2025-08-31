import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Department } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDepartment(department: Department): string {
    return [department.lembaga, department.divisi, department.bagian, department.unit]
        .filter(Boolean) // Remove empty or null values
        .join(' / ');
}
