import { MATERIAL_LIMITS } from "../lib/validations/material";

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  charCount: number;
  isTooLong: boolean;
}

export type ExtractionErrorCode =
  | "INVALID_TYPE"
  | "FILE_TOO_LARGE"
  | "PASSWORD_PROTECTED"
  | "CORRUPTED_PDF"
  | "NO_TEXT"
  | "READ_FAILED";

export interface ExtractionFailure {
  code: ExtractionErrorCode;
  message: string;
}

export type ExtractionOutcome =
  | { success: true; data: ExtractedDocument }
  | { success: false; error: ExtractionFailure };

/**
 * Valida os metadados do arquivo antes de processar (MIME, extensão e tamanho).
 */
export function validatePDFFile(file: { name: string; size: number; type?: string }): ExtractionFailure | null {
  if (file.size > MATERIAL_LIMITS.MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      code: "FILE_TOO_LARGE",
      message: `O arquivo selecionado (${sizeMb} MB) excede o limite máximo permitido de 10 MB.`,
    };
  }

  const fileName = (file.name || "").toLowerCase();
  const hasPdfExt = fileName.endsWith(".pdf");
  const hasPdfMime = file.type ? MATERIAL_LIMITS.ALLOWED_MIME_TYPES.includes(file.type.toLowerCase() as any) : false;

  if (!hasPdfExt && !hasPdfMime) {
    return {
      code: "INVALID_TYPE",
      message: "Formato de arquivo não suportado. Por favor, selecione um arquivo com extensão .pdf.",
    };
  }

  return null;
}

/**
 * Extrai o texto de um documento PDF utilizando pdfjs-dist.
 * Funciona de forma compatível tanto no navegador (client-side) quanto no ambiente Node.
 */
export async function extractPDFContent(data: ArrayBuffer | Uint8Array): Promise<ExtractionOutcome> {
  try {
    let pdfjsLib: any;

    if (typeof window !== "undefined") {
      pdfjsLib = await import("pdfjs-dist");
      if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
    } else {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    }

    const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (uint8Data.byteLength === 0) {
      return {
        success: false,
        error: {
          code: "CORRUPTED_PDF",
          message: "O arquivo PDF fornecido está vazio (0 bytes).",
        },
      };
    }

    const documentParams: any = { data: uint8Data };
    if (typeof window === "undefined") {
      try {
        const path = await import("node:path");
        const { pathToFileURL } = await import("node:url");
        const fontsPath = path.resolve(process.cwd(), "node_modules/pdfjs-dist/standard_fonts");
        documentParams.standardFontDataUrl = pathToFileURL(fontsPath).href + "/";
      } catch (_) {}
    }

    const loadingTask = pdfjsLib.getDocument(documentParams);
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

    const pagesText: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = (textContent.items || [])
        .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
        .filter(Boolean);

      const pageText = pageStrings.join(" ").trim();
      if (pageText) {
        pagesText.push(pageText);
      }
    }

    const fullText = pagesText.join("\n\n").trim();
    const charCount = fullText.length;

    // Detectar PDF escaneado (páginas existem, mas menos de 20 caracteres extraíveis)
    if (charCount < 20) {
      return {
        success: false,
        error: {
          code: "NO_TEXT",
          message: `Nenhum texto selecionável foi extraído das ${pageCount} página(s). O arquivo pode ser uma digitalização (scan) de imagens ou conter apenas gráficos.`,
        },
      };
    }

    return {
      success: true,
      data: {
        text: fullText,
        pageCount,
        charCount,
        isTooLong: charCount > MATERIAL_LIMITS.MAX_CHARS,
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
          message: "Este arquivo PDF está protegido por senha e não pode ser aberto.",
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
        message: `Falha na leitura do arquivo PDF: ${errorMessage || "Erro desconhecido."}`,
      },
    };
  }
}
