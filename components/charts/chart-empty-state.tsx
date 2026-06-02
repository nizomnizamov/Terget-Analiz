import { BarChart3 } from "lucide-react";

export function ChartEmptyState({ message = "Bu muddat uchun ma'lumot yo'q." }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-md border border-dashed bg-muted/35 p-6 text-center">
      <div className="grid gap-2">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-card text-muted-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="text-xs font-medium text-muted-foreground">
          Muddatni o&apos;zgartiring yoki ma&apos;lumot sinxronlang.
        </p>
      </div>
    </div>
  );
}
