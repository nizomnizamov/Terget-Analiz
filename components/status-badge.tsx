import { Badge } from "@/components/ui/badge";
import type { AlertSeverity, CampaignPerformance } from "@/lib/types";

export function HealthBadge({ health }: { health: CampaignPerformance["health"] }) {
  const labels = {
    scale: "Zo'r",
    watch: "Kuzatish",
    pause: "To'xtatish",
    learning: "O'rganmoqda"
  };
  const variants = {
    scale: "success",
    watch: "warning",
    pause: "danger",
    learning: "neutral"
  } as const;

  return <Badge variant={variants[health]}>{labels[health]}</Badge>;
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const labels = {
    info: "Ma'lumot",
    warning: "E'tibor",
    critical: "Muhim"
  };
  const variants = {
    info: "default",
    warning: "warning",
    critical: "danger"
  } as const;

  return <Badge variant={variants[severity]}>{labels[severity]}</Badge>;
}
