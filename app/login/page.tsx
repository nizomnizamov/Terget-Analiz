import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/overview");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1fr_420px] md:items-center">
        <section className="space-y-4">
          <div className="inline-flex rounded-md bg-foreground px-3 py-1 text-sm font-semibold text-background">
            Targel Analiz
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            Reklama va sotuvni oddiy tilda ko&apos;ring.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Qancha pul ketdi, nechta lid keldi va qaysi reklama foyda beryapti - hammasi bir joyda.
          </p>
          <div className="grid max-w-xl grid-cols-2 gap-3 text-sm">
            {["Xarajat", "Lidlar", "Sotuv", "Tushum", "Operatorlar", "Ogohlantirish"].map((item) => (
              <div key={item} className="rounded-md border bg-card px-3 py-2 font-medium">
                {item}
              </div>
            ))}
          </div>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Kirish</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
