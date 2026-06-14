import { cn } from "@/lib/utils";

export function TagChip({
  tag,
  className,
}: {
  tag: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px]",
        className,
      )}
    >
      #{tag}
    </span>
  );
}
