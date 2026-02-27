/** Shared Utilities: Tập hợp các helper functions dùng chung (Format, Mapping). */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
