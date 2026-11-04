/**
 * Utilitário Server-Side para Validação e Extração de Texto de PDFs no AIVU.
 * Suporta ingestão de editais em PDF com preservação de páginas e integridade estrutural.
 */

export const AIVU_PDF_LIMITS = {
  MAX_FILE_SIZE_BYTES: 15 * 1024 * 1024, // 15 MB
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/x-pdf",
    "binary/octet-stream", // alguns navegadores móveis enviam PDFs como octet-stream
  ],
  MIN_READABLE_CHARS: 50,
};

export type PdfErrorCode =
  | "INVALID_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_SIGNATURE"
  | "PASSWORD_PROTECTED"
  | "CORRUPTED_PDF"
  | "NO_TEXT"
  | "READ_FAILED";

export interface PdfValidationFailure {
  code: PdfErrorCode;
  message: string;
}

export interface PdfExtractedDocument {
  text: string;
  pageCount: number;
  charCount: number;
  fileName: string;
  fileSizeBytes: number;
  hasMultipleCargos: boolean;
  detectedCargos: string[];
}

export type PdfExtractionResult =
  | { success: true; data: PdfExtractedDocument }
  | { success: false; error: PdfValidationFailure };

/**
 * Sanitiza o nome do arquivo fornecido pelo usuário contra path traversal e caracteres perigosos.
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName || typeof rawName !== "string") return "edital.pdf";
  const base = rawName.split(/[/\\]/).pop() || "edital.pdf";
  const clean = base
    .replace(/[^a-zA-Z0-9_\-\. \(\)\[\]]/g, "")
    .trim()
    .slice(0, 100);
  return clean.toLowerCase().endsWith(".pdf") ? clean : `${clean}.pdf`;
}

/**
 * Formata bytes legíveis para interface humana (ex: "3.5 MB").
 */
export function formatPdfFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Valida a assinatura real de arquivo PDF (Magic Bytes "%PDF-").
 * Não confia na extensão ou cabeçalho MIME enviado pelo cliente.
 */
export function validatePdfSignature(data: Uint8Array | ArrayBuffer): boolean {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length < 5) return false;

  // Assinatura padrão PDF: 0x25, 0x50, 0x44, 0x46, 0x2D ("%PDF-")
  // Alguns arquivos podem conter pequenos offsets ou BOMs nos primeiros 1024 bytes
  const searchLimit = Math.min(bytes.length, 1024);
  for (let i = 0; i <= searchLimit - 5; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Valida os metadados do arquivo (tamanho, extensão e MIME type).
 */
export function validatePdfMetadata(file: {
  name: string;
  size: number;
  type?: string;
}): PdfValidationFailure | null {
  if (file.size > AIVU_PDF_LIMITS.MAX_FILE_SIZE_BYTES) {
    const sizeFormatted = formatPdfFileSize(file.size);
    return {
      code: "FILE_TOO_LARGE",
      message: `O arquivo selecionado (${sizeFormatted}) excede o limite máximo permitido de 15 MB.`,
    };
  }

  const fileName = (file.name || "").toLowerCase();
  const hasPdfExt = fileName.endsWith(".pdf");
  const hasPdfMime = file.type
    ? AIVU_PDF_LIMITS.ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())
    : false;

  if (!hasPdfExt && !hasPdfMime) {
    return {
      code: "INVALID_TYPE",
      message: "Formato de arquivo não suportado. Por favor, selecione um arquivo com extensão .pdf.",
    };
  }

  return null;
}

/**
 * Analisa o texto extraído para detectar menção a múltiplos cargos no edital.
 */
export function detectMultipleCargosInText(text: string): {
  hasMultiple: boolean;
  cargos: string[];
} {
  const cargosFound = new Set<string>();
  const cargoRegex = /(?:cargo(?:\s*\d+)?(?:\s*:\s*|\s+de\s+)|\bnível\s+[^\n:]+:\s*)([^\n\r,:;.]{3,50})/gi;

  let match: RegExpExecArray | null;
  while ((match = cargoRegex.exec(text)) !== null) {
    const cargoCandidate = match[1].replace(/[\n\r]+/g, " ").replace(/[.,;:]+$/, "").trim();
    if (
      cargoCandidate.length >= 4 &&
      cargoCandidate.length <= 45 &&
      !/^(?:edital|concurso|conteúdo|quadro|inscrição|prova|requisito|jornada)/i.test(cargoCandidate)
    ) {
      cargosFound.add(cargoCandidate);
    }
    if (cargosFound.size >= 5) break;
  }

  const cargos = Array.from(cargosFound);
  return {
    hasMultiple: cargos.length > 1,
    cargos,
  };
}

/**
 * Extrai texto completo de um PDF preservando ordem e referências de páginas.
 */
export async function extractTextFromPdfBuffer(
  data: Uint8Array | ArrayBuffer,
  fileName = "edital.pdf"
): Promise<PdfExtractionResult> {
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
  const cleanName = sanitizeFileName(fileName);

  // 1. Validação de arquivo vazio
  if (uint8Data.byteLength === 0) {
    return {
      success: false,
      error: {
        code: "CORRUPTED_PDF",
        message: "O arquivo PDF fornecido está vazio (0 bytes).",
      },
    };
  }

  // 2. Validação de tamanho máximo
  if (uint8Data.byteLength > AIVU_PDF_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `O arquivo PDF (${formatPdfFileSize(uint8Data.byteLength)}) excede o limite máximo permitido de 15 MB.`,
      },
    };
  }

  // 3. Validação da assinatura mágica do PDF (%PDF-)
  if (!validatePdfSignature(uint8Data)) {
    return {
      success: false,
      error: {
        code: "INVALID_SIGNATURE",
        message: "O arquivo selecionado não é um documento PDF válido ou sua assinatura está corrompida.",
      },
    };
  }

  // 4. Carregamento da engine pdfjs-dist
  try {
    let pdfjsLib: any;
    if (typeof window !== "undefined") {
      pdfjsLib = await import("pdfjs-dist");
      if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
    } else {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // @ts-ignore
      await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    }

    const loadingTask = pdfjsLib.getDocument({ data: uint8Data });
    const pdfDoc = await loadingTask.promise;

    const pageCount = pdfDoc.numPages || 0;
    if (pageCount === 0) {
      return {
        success: false,
        error: {
          code: "CORRUPTED_PDF",
          message: "O arquivo PDF não contém nenhuma página válida.",
        },
      };
    }

    const pagesWithText: string[] = [];
    let totalCharsCount = 0;

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = (textContent.items || [])
        .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
        .filter(Boolean);

      const pageText = pageStrings.join(" ").replace(/[ \t]+/g, " ").trim();
      if (pageText) {
        totalCharsCount += pageText.length;
        pagesWithText.push(`--- Página ${i} ---\n${pageText}`);
      }
    }

    // 5. Verificação de camada de texto (detecção de PDF escaneado / imagens puras)
    if (totalCharsCount < AIVU_PDF_LIMITS.MIN_READABLE_CHARS) {
      return {
        success: false,
        error: {
          code: "NO_TEXT",
          message: `Nenhum texto selecionável foi extraído das ${pageCount} página(s) do documento. O arquivo parece ser uma digitalização (scan) de imagens ou não possui camada de texto. Para analisar este edital, é necessário OCR prévio ou um PDF com texto selecionável.`,
        },
      };
    }

    const fullExtractedText = pagesWithText.join("\n\n").trim();
    const cargoAnalysis = detectMultipleCargosInText(fullExtractedText);

    return {
      success: true,
      data: {
        text: fullExtractedText,
        pageCount,
        charCount: totalCharsCount,
        fileName: cleanName,
        fileSizeBytes: uint8Data.byteLength,
        hasMultipleCargos: cargoAnalysis.hasMultiple,
        detectedCargos: cargoAnalysis.cargos,
      },
    };
  } catch (err: any) {
    const errorName = String(err?.name || "");
    const errorMessage = String(err?.message || "");

    if (errorName === "PasswordException" || errorMessage.toLowerCase().includes("password")) {
      return {
        success: false,
        error: {
          code: "PASSWORD_PROTECTED",
          message: "Este arquivo PDF está protegido por senha e não pode ser aberto pelo AIVU.",
        },
      };
    }

    if (
      errorName === "InvalidPDFException" ||
      errorMessage.toLowerCase().includes("invalid pdf") ||
      errorMessage.toLowerCase().includes("corrupted")
    ) {
      return {
        success: false,
        error: {
          code: "CORRUPTED_PDF",
          message: "O arquivo fornecido não é um PDF válido ou está corrompido.",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "READ_FAILED",
        message: `Falha na leitura do arquivo PDF: ${errorMessage || "Erro interno de extração."}`,
      },
    };
  }
}
