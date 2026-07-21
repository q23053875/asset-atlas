import { cn } from "@/lib/utils";
export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn("rounded-lg bg-ink px-3 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-85", className)} {...props} />; }
