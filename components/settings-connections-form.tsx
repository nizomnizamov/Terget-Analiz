"use client";

import { FormEvent, type ReactNode, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Save, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsConnectionsFormProps = {
  databaseReady: boolean;
  facebookAdAccountId?: string;
  facebookBillingLimit?: number;
  facebookBillingWarnBefore?: number;
  amoSubdomain?: string;
  telegramChatIds?: string[];
};

export function SettingsConnectionsForm({
  databaseReady,
  facebookAdAccountId,
  facebookBillingLimit,
  facebookBillingWarnBefore,
  amoSubdomain,
  telegramChatIds
}: SettingsConnectionsFormProps) {
  const [pending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save(event: FormEvent<HTMLFormElement>, section: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setActiveSection(section);
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok || body?.error) {
        setError(body?.error ?? "Sozlamani saqlab bo'lmadi.");
        setActiveSection(null);
        return;
      }

      form.reset();
      setMessage("Ulanish ma'lumotlari saqlandi.");
      window.location.reload();
    });
  }

  function Field({
    label,
    children
  }: {
    label: string;
    children: ReactNode;
  }) {
    return (
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        {children}
      </label>
    );
  }

  function SaveButton({ section }: { section: string }) {
    const isPending = pending && activeSection === section;

    return (
      <Button type="submit" disabled={pending} className="w-fit">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Saqlash
      </Button>
    );
  }

  return (
    <div className="grid gap-5">
      {!databaseReady ? (
        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Paneldan saqlash uchun ma&apos;lumotlar bazasi kerak. Baza ulanmaguncha tokenlarni Vercel Environment
            Variables orqali kiriting.
          </p>
        </div>
      ) : null}

      <form onSubmit={(event) => save(event, "facebook")} className="grid gap-3">
        <div>
          <h3 className="text-base font-semibold">Meta Ads</h3>
          <p className="text-sm text-muted-foreground">
            CRM ulanmagan bo&apos;lsa ham, reklama xarajati va Meta lidlar shu yerning o&apos;zidan olinadi.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Reklama akkaunt ID">
            <Input name="facebookAdAccountId" defaultValue={facebookAdAccountId} placeholder="act_123456789 yoki 123456789" />
          </Field>
          <Field label="Facebook token">
            <Input
              name="facebookAccessToken"
              type="password"
              autoComplete="off"
              placeholder="Access token"
            />
          </Field>
        </div>
        <div className="grid gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-2">
          <Field label="Viza yechilish limiti">
            <Input
              name="facebookBillingLimit"
              type="number"
              min="0"
              step="0.01"
              defaultValue={facebookBillingLimit ?? ""}
              placeholder="Masalan: 25"
            />
          </Field>
          <Field label="Qancha qolganda ogohlantirsin">
            <Input
              name="facebookBillingWarnBefore"
              type="number"
              min="0"
              step="0.01"
              defaultValue={facebookBillingWarnBefore ?? ""}
              placeholder="Masalan: 3"
            />
          </Field>
        </div>
        <SaveButton section="facebook" />
      </form>

      <form onSubmit={(event) => save(event, "amo")} className="grid gap-3 border-t pt-5">
        <div>
          <h3 className="text-base font-semibold">amoCRM</h3>
          <p className="text-sm text-muted-foreground">
            CRM keyinroq ulansa ham bo&apos;ladi. Ulanganda sifatli lidlar, varonka va sotuvlar qo&apos;shiladi.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="CRM subdomain">
            <Input name="amoSubdomain" defaultValue={amoSubdomain} placeholder="Masalan: chinargroup" />
          </Field>
          <Field label="amoCRM token">
            <Input name="amoAccessToken" type="password" autoComplete="off" placeholder="Access token" />
          </Field>
          <Field label="amoCRM refresh token">
            <Input name="amoRefreshToken" type="password" autoComplete="off" placeholder="Refresh token" />
          </Field>
        </div>
        <SaveButton section="amo" />
      </form>

      <form onSubmit={(event) => save(event, "telegram")} className="grid gap-3 border-t pt-5">
        <div>
          <h3 className="text-base font-semibold">Telegram</h3>
          <p className="text-sm text-muted-foreground">Hisobot boradigan chat ID ni kiriting.</p>
        </div>
        <Field label="Telegram chat ID">
          <Input name="telegramChatIds" defaultValue={telegramChatIds?.join(", ")} placeholder="Masalan: 123456789" />
        </Field>
        <SaveButton section="telegram" />
      </form>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        {message ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </span>
        ) : null}
        {error ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-destructive">
            <TriangleAlert className="h-4 w-4" />
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
