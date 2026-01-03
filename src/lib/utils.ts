import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isContentEmpty(content: any) {
    if (!content) return true;
    if (typeof content !== 'string') return false;
    const stripped = content.replace(/<[^>]*>/g, '').trim();
    return stripped === '';
}
