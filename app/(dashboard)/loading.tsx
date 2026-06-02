import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="grid animate-pulse gap-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="h-36 p-5">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-5 h-8 w-28 rounded bg-muted" />
            <div className="mt-4 h-3 w-36 rounded bg-muted" />
          </Card>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="h-80 p-5">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="mt-6 grid gap-3">
            <div className="h-20 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
          </div>
        </Card>
        <Card className="h-80 p-5">
          <div className="h-5 w-44 rounded bg-muted" />
          <div className="mt-6 h-56 rounded bg-muted" />
        </Card>
      </section>
    </div>
  );
}
