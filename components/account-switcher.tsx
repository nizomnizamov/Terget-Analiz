"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type BaseAccount = {
  id: string;
  accountName: string;
  adAccountId: string;
  crmName?: string;
};

function profileInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "A";
}

export function AccountSwitcher({ accounts }: { accounts: BaseAccount[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedAccountId = searchParams.get("accountId") ?? "all";
  const [open, setOpen] = useState(false);

  const profiles = useMemo(() => accounts, [accounts]);
  const selectedProfile = profiles.find((account) => account.id === selectedAccountId);
  const buttonLabel = selectedProfile?.accountName ?? "Barcha akkauntlar";

  function selectAccount(accountId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (accountId === "all") {
      params.delete("accountId");
    } else {
      params.set("accountId", accountId);
    }

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 min-w-56 items-center justify-between gap-3 rounded-md border border-border/80 bg-card/80 px-3 text-left text-sm font-semibold outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{buttonLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 top-12 z-40 w-[360px] rounded-md border border-border/80 bg-card p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
          <button
            type="button"
            onClick={() => selectAccount("all")}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
              selectedAccountId === "all" && "bg-muted"
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Barcha akkauntlar</span>
              <span className="block truncate text-xs text-muted-foreground">Ulangan hamma profillar</span>
            </span>
            {selectedAccountId === "all" ? <Check className="h-4 w-4 text-emerald-700" /> : null}
          </button>

          <div className="my-2 h-px bg-border" />

          <div className="grid max-h-72 gap-1 overflow-y-auto">
            {profiles.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => selectAccount(account.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  selectedAccountId === account.id && "bg-muted"
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-bold">
                  {profileInitial(account.accountName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{account.accountName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {account.adAccountId} {account.crmName ? `/ ${account.crmName}` : ""}
                  </span>
                </span>
                {selectedAccountId === account.id ? <Check className="h-4 w-4 text-emerald-700" /> : null}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/settings");
              }}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Ulanish qo&apos;shish
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
