import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-md gap-4 rounded-[8px] border bg-card p-6 text-center shadow-sm">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">404</p>
          <h1 className="mt-2 text-xl font-semibold">Sahifa topilmadi</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Bu manzil o&apos;zgargan yoki noto&apos;g&apos;ri kiritilgan bo&apos;lishi mumkin.
          </p>
        </div>
        <Link
          href="/overview"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Bosh sahifaga qaytish
        </Link>
      </section>
    </main>
  );
}
