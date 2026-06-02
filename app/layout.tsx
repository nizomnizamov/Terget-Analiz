import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Targel Analiz",
  description: "Reklama va sotuv natijalarini sodda ko'rish"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  const theme = localStorage.getItem("targel-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (theme === "dark" || (!theme && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
} catch {}
`
          }}
        />
        {children}
      </body>
    </html>
  );
}
