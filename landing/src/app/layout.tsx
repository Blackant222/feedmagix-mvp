import type { Metadata } from "next";
import "../index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FeedMagix - هوش مصنوعی تغذیه حیوانات خانگی",
  description: "سیستم هوشمند تغذیه حیوانات خانگی با استفاده از هوش مصنوعی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}