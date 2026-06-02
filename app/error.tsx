"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-md gap-4 rounded-[8px] border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
          <TriangleAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Sahifada xatolik yuz berdi</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ma&apos;lumotni qayta yuklab ko&apos;ring. Muammo davom etsa, integratsiya sozlamalarini tekshiring.
          </p>
        </div>
        <Button type="button" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Qayta urinish
        </Button>
      </section>
    </main>
  );
}
