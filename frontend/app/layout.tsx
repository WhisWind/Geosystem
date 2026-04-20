import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Расчёт растровых индексов",
  description: "Загрузка TIFF → расчёт индекса → просмотр результата",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-black">
            {children}
      </body>
    </html>
  );
}