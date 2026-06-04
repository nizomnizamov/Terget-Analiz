import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { getAmoAccountProfiles, getFacebookAccountProfiles } from "@/lib/integration-settings";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [facebookAccounts, amoAccounts] = await Promise.all([
    getFacebookAccountProfiles(),
    getAmoAccountProfiles()
  ]);

  return (
    <AppShell user={user} facebookAccounts={facebookAccounts} amoAccounts={amoAccounts}>
      {children}
    </AppShell>
  );
}
