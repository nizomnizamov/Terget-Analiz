import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

export function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

export function safeDivide(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return numerator / denominator;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatStageName(name: string) {
  const labels: Record<string, string> = {
    "New Lead": "Yangi lid",
    "Contact Attempt": "Aloqa qilinmoqda",
    Replied: "Javob berdi",
    Interested: "Qiziqdi",
    Consultation: "Maslahat berildi",
    "Offer Sent": "Taklif yuborildi",
    Reservation: "Bron qildi",
    Payment: "To'lov qilindi",
    "Won Client": "Sotuv bo'ldi",
    "Lost / Spam": "Yo'qotildi / spam"
  };

  return labels[name] ?? name;
}

export function formatSourceName(name: string) {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    manual: "Qo'lda",
    telegram: "Telegram"
  };

  return labels[name] ?? name;
}
