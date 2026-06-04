"use client";

import { FormEvent, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Save, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsConnectionsFormProps = {
  databaseReady: boolean;
  facebookAccountName?: string;
  facebookAdAccountId?: string;
  amoSubdomain?: string;
  telegramChatIds?: string[];
};

export function SettingsConnectionsForm({
  databaseReady,
  facebookAccountName,
  facebookAdAccountId,
  amoSubdomain,
  telegramChatIds
}: SettingsConnectionsFormProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

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
        return;
      }

      form.reset();
      setMessage("Ulanish ma'lumotlari saqlandi.");
      window.location.reload();
    });
  }

  return (
    <form onSubmit={save} className="grid gap-5">
      {!databaseReady ? (
        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Paneldan saqlash uchun ma&apos;lumotlar bazasi kerak. Baza ulanmaguncha tokenlarni Vercel Environment
            Variables orqali kiriting.
          </p>
        </div>
      ) : null}

      <section className="grid gap-3">
        <div>
          <h3 className="text-base font-semibold">Meta Ads</h3>
          <p className="text-sm text-muted-foreground">Facebook reklama xarajati, lidlar va kampaniyalar shu ulanishdan olinadi.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="facebookAccountName" defaultValue={facebookAccountName} placeholder="Profil nomi" />
          <Input name="facebookAdAccountId" defaultValue={facebookAdAccountId} placeholder="Ad account ID: act_123 yoki 123" />
          <Input
            className="md:col-span-2"
            name="facebookAccessToken"
            type="password"
            autoComplete="off"
            placeholder="Facebook access token"
          />
        </div>
      </section>

      <section className="grid gap-3 border-t pt-5">
        <div>
          <h3 className="text-base font-semibold">amoCRM</h3>
          <p className="text-sm text-muted-foreground">Lidlar, sifatli lidlar va sotuv varonkasi CRM&apos;dan olinadi.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="amoSubdomain" defaultValue={amoSubdomain} placeholder="Subdomain: chinargroup" />
          <Input name="amoAccessToken" type="password" autoComplete="off" placeholder="amoCRM access token" />
          <Input className="md:col-span-2" name="amoRefreshToken" type="password" autoComplete="off" placeholder="amoCRM refresh token" />
        </div>
      </section>

      <section className="grid gap-3 border-t pt-5">
        <div>
          <h3 className="text-base font-semibold">Telegram</h3>
          <p className="text-sm text-muted-foreground">Hisobot boradigan chat ID&apos;lar vergul bilan ajratiladi.</p>
        </div>
        <Input name="telegramChatIds" defaultValue={telegramChatIds?.join(", ")} placeholder="Masalan: 123456789, -1001234567890" />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={pending || !databaseReady}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Saqlash
        </Button>
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
    </form>
  );
}
