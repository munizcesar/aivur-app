/**
 * Layout isolado da rota /trilhas.
 * Força data-theme="light" no wrapper para neutralizar o defaultTheme="dark"
 * do ThemeProvider raiz e garantir Protocolo Zero Laranja nesta seção.
 */
export default function TrilhasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="light" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {children}
    </div>
  );
}
