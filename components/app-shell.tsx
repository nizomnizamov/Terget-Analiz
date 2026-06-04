import { Sparkles } from "lucide-react";
import { AccountSwitcher } from "@/components/account-switcher";
import { DateRangeFilter } from "@/components/date-range-filter";
import { LogoutButton } from "@/components/logout-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { SyncActions } from "@/components/sync-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import type { AmoAccount, FacebookAccount, User } from "@/lib/types";

type AppShellProps = {
  user: User;
  facebookAccounts: FacebookAccount[];
  amoAccounts: AmoAccount[];
  children: React.ReactNode;
};

export function AppShell({ user, facebookAccounts, amoAccounts, children }: AppShellProps) {
  const roleLabel = {
    admin: "Admin",
    client: "Mijoz",
    manager: "Operator"
  }[user.role];
  const accounts = facebookAccounts.map((account) => ({
    id: account.id,
    accountName: account.accountName,
    adAccountId: account.adAccountId,
    crmName: amoAccounts.find((amoAccount) => amoAccount.id === account.amoAccountId)?.subdomain
  }));

  return (
    <div className="min-h-screen bg-transparent">
      <aside className="fixed inset-x-0 top-0 z-20 border-b border-white/60 bg-white/78 backdrop-blur-xl dark:border-border/80 dark:bg-card/78 lg:bottom-0 lg:left-0 lg:right-auto lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <SidebarNav />
      </aside>

      <div className="pt-28 lg:pl-64 lg:pt-0">
        <header className="sticky top-0 z-10 flex min-h-16 flex-col gap-3 border-b border-white/70 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-border/80 dark:bg-background/72 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <DateRangeFilter />
            <AccountSwitcher accounts={accounts} />
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <SyncActions />
            <ThemeToggle />
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-border/80 bg-card/80 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
              <Badge variant={user.role === "admin" ? "default" : user.role === "manager" ? "warning" : "neutral"}>
                {roleLabel}
              </Badge>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1180px] px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
