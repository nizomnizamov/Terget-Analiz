import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { SeverityBadge } from "@/components/status-badge";
import type { Alert } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconClass = {
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  critical: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
};

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="grid gap-3">
      {alerts.map((alert) => (
        <div key={alert.id} className="flex items-start gap-3 rounded-md border bg-card p-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", iconClass[alert.severity])}>
            {alert.severity === "critical" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : alert.isSent ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{alert.title}</h3>
              <SeverityBadge severity={alert.severity} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {alert.isSent ? "Telegram yuborilgan" : "Yuborish navbatida"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
