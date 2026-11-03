/**
 * Utilitário seguro e resiliente para cópia de texto para a área de transferência.
 * Prioriza a Clipboard API moderna (`navigator.clipboard.writeText`) e implementa
 * fallback universal defensivo via textarea off-screen (`document.execCommand('copy')`).
 *
 * Trata erros de permissão sem lançar exceções não tratadas e preserva a seleção do usuário.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text || typeof text !== "string") {
    return false;
  }

  // 1. Tenta a Clipboard API moderna quando disponível (contexto seguro / HTTPS)
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Rejeição por falta de permissão, foco na janela ou restrição de contexto.
      // Prossegue graciosamente para o fallback determinístico.
    }
  }

  // 2. Fallback universal via elemento textarea temporário off-screen
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      // Previne saltos de rolagem e visibilidade acidental
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      textarea.setAttribute("readonly", "");
      textarea.setAttribute("aria-hidden", "true");
      textarea.setAttribute("tabindex", "-1");
      document.body.appendChild(textarea);

      // Preserva a seleção original do usuário caso exista
      const selection = typeof document.getSelection === "function" ? document.getSelection() : null;
      const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);

      // Restaura seleção anterior
      if (originalRange && selection) {
        selection.removeAllRanges();
        selection.addRange(originalRange);
      }

      return Boolean(successful);
    } catch {
      return false;
    }
  }

  return false;
}
