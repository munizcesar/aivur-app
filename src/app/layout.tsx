import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIVUR — Inteligência que evolui resultados",
  description: "Sistema inteligente de evolução do conhecimento com questões, trilhas personalizadas e IA aplicada ao aprendizado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
