"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { getTodayDateKey, isDateKey } from "@/lib/date-range";

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");

  return `${day}.${month}.${year}`;
}

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = getTodayDateKey();
  const from = isDateKey(searchParams.get("from")) ? searchParams.get("from")! : today;
  const to = isDateKey(searchParams.get("to")) ? searchParams.get("to")! : from;
  const [open, setOpen] = useState(false);
  const fromInputRef = useRef<HTMLInputElement>(null);

  const label =
    from === today && to === today
      ? "Bugun"
      : from === to
        ? formatDateLabel(from)
        : `${formatDateLabel(from)} - ${formatDateLabel(to)}`;

  function openCalendar() {
    setOpen(true);
    window.requestAnimationFrame(() => {
      fromInputRef.current?.showPicker?.();
      fromInputRef.current?.focus();
    });
  }

  function setCustomDate(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    let nextFrom = key === "from" ? value : from;
    let nextTo = key === "to" ? value : to;

    if (nextFrom > nextTo) {
      if (key === "from") {
        nextTo = nextFrom;
      } else {
        nextFrom = nextTo;
      }
    }

    params.set("range", "custom");
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function setToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("range");
    params.delete("from");
    params.delete("to");
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openCalendar}
        className="flex h-10 min-w-40 items-center gap-2 rounded-md border border-border/80 bg-card/80 px-3 text-left text-sm font-semibold outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring"
        aria-expanded={open}
        aria-label="Sana tanlash"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
        </span>
        <span className="truncate">{label}</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-12 z-30 grid w-[310px] gap-3 rounded-md border border-border/80 bg-card p-3 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
          <div className="grid gap-2">
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Boshlanish
              <input
                ref={fromInputRef}
                type="date"
                value={from}
                onChange={(event) => setCustomDate("from", event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Tugash
              <input
                type="date"
                value={to}
                onChange={(event) => setCustomDate("to", event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <button
              type="button"
              onClick={setToday}
              className="h-9 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Tayyor
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
