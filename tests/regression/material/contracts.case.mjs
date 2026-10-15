// Casos de regressão — Meu Material / Contratos Zod de IA (Fase 2)
import assert from "node:assert/strict";
import {
  RawMaterialAIGenerationSchema,
  MaterialGeneratedContentSchema,
  MaterialSummarySchema,
  RawMaterialFlashcardSchema,
  RawMaterialQuestionSchema,
  buildAuthoritativeGeneratedMaterial,
} from "@/lib/validations/material-ai.ts";

function createValidRawPayload() {
  return {
    disciplina_sugerida: "Direito Constitucional",
    resumo: {
      tema_central: "Direitos e garantias fundamentais com foco no Artigo 5º da CF/88.",
      pontos_chave: [
        "Inviolabilidade do direito à vida, à liberdade e à igualdade.",
        "Princípio da legalidade e vedação à tortura ou tratamento desumano.",
        "Garantia constitucional do direito de propriedade e sua função social.",
      ],
      conteudo_markdown:
        "## Direitos Fundamentais\n\nO artigo 5º da Constituição Federal estabelece os direitos individuais e coletivos...",
    },
    flashcards: [
      {
        frente: "Qual é a exigência constitucional para a garantia da propriedade?",
        verso: "Atender a sua função social (Art. 5º, XXIII da CF/88).",
      },
      {
        frente: "O que preconiza o princípio da legalidade?",
        verso: "Ninguém será obrigado a fazer ou deixar de fazer algo senão em virtude de lei.",
      },
    ],
    questoes: [
      {
        enunciado: "Segundo a CF/88, o direito de propriedade é assegurado desde que:",
        opcoes: [
          "Atenda à sua função social.",
          "Haja recolhimento de taxa prévia ao ente federado.",
          "O imóvel seja exclusivo para fins residenciais.",
          "Exista permissão judicial de posse permanente.",
        ],
        corretaIdx: 0,
        justificativa: "A propriedade atenderá a sua função social conforme expressamente previsto no inciso XXIII do Art. 5º.",
        trecho_referencia: "Art. 5º, XXIII - a propriedade atenderá a sua função social;",
      },
      {
        enunciado: "Sobre a vedação à tortura, a Constituição Federal estipula que:",
        opcoes: [
          "É permitida em casos de estado de sítio decretado.",
          "Ninguém será submetido a tortura nem a tratamento desumano ou degradante.",
          "Depende de autorização do Ministério Público em casos excepcionais.",
          "Aplica-se unicamente a cidadãos nacionais natos.",
        ],
        corretaIdx: 1,
        justificativa: "A vedação à tortura é absoluta na CF/88 (Art. 5º, III).",
      },
    ],
  };
}

export const cases = [
  {
    id: "REG-MAT-007",
    title: "Contratos Zod de IA do Meu Material: aceita estrutura válida de resumo, flashcards e questões",
    needs: "api",
    async run() {
      const validRaw = createValidRawPayload();

      // 1. Validação do schema bruto da IA
      const parseResult = RawMaterialAIGenerationSchema.safeParse(validRaw);
      assert.equal(parseResult.success, true, "RawMaterialAIGenerationSchema deve aceitar payload bem formatado");

      // 2. Hidratação autoritativa pelo servidor (com comprovação confiável no backend)
      const authoritativeFull = buildAuthoritativeGeneratedMaterial({
        materialId: "mat-teste-1",
        titulo: "Constituição Federal - Artigo 5º",
        totalCaracteresMaterial: 1200,
        caracteresProcessados: 1200,
        raw: parseResult.data,
        comprovacaoIntegralidadeServidor: true,
      });

      // Validação do contrato entregue ao frontend
      assert.equal(authoritativeFull.titulo, "Constituição Federal - Artigo 5º");
      assert.equal(authoritativeFull.disciplina, "Direito Constitucional");
      assert.equal(authoritativeFull.escopoProcessado.cobertura, "integral");
      assert.equal(authoritativeFull.escopoProcessado.caracteresProcessados, 1200);

      // Verificação de IDs atribuídos de forma segura pelo servidor
      assert.equal(authoritativeFull.flashcards.length, 2);
      assert.equal(authoritativeFull.flashcards[0].id, "mat-teste-1-fc-1");
      assert.equal(authoritativeFull.flashcards[1].id, "mat-teste-1-fc-2");

      assert.equal(authoritativeFull.questoes.length, 2);
      assert.equal(authoritativeFull.questoes[0].id, "mat-teste-1-q-1");
      assert.equal(authoritativeFull.questoes[1].id, "mat-teste-1-q-2");
      assert.equal(authoritativeFull.questoes[0].corretaIdx, 0);

      // 3. Verificação de cálculo de cobertura recortada (processou menos que o total)
      const authoritativeRecorte = buildAuthoritativeGeneratedMaterial({
        materialId: "mat-teste-2",
        titulo: "Apostila Completa",
        totalCaracteresMaterial: 50000,
        caracteresProcessados: 8000,
        raw: parseResult.data,
      });

      assert.equal(authoritativeRecorte.escopoProcessado.cobertura, "recorte");
      assert.ok(authoritativeRecorte.escopoProcessado.observacao?.includes("8.000 de um total de 50.000"));
    },
  },
  {
    id: "REG-MAT-008",
    title: "Contratos Zod de IA do Meu Material: rejeição de alternativas duplicadas, contagens fora dos limites e cobertura determinada pelo servidor",
    needs: "api",
    async run() {
      // 1. Rejeição de alternativas duplicadas na mesma questão (mesmo com variação de maiúsculas)
      const duplicateOptionsPayload = createValidRawPayload();
      duplicateOptionsPayload.questoes[0].opcoes = [
        "Atenda à sua função social.",
        "atenda à sua função social.", // duplicada normalizada
        "Opção alternativa C",
        "Opção alternativa D",
      ];
      const dupResult = RawMaterialAIGenerationSchema.safeParse(duplicateOptionsPayload);
      assert.equal(dupResult.success, false, "deve rejeitar alternativas duplicadas");
      assert.ok(
        dupResult.error?.issues.some((i) => i.message.includes("duplicadas")),
        "deve conter mensagem explícita de alternativas duplicadas"
      );

      // 2. Rejeição de quantidade incorreta de alternativas (ex: 3 ou 5)
      const threeOptionsPayload = createValidRawPayload();
      threeOptionsPayload.questoes[0].opcoes = ["Opção 1", "Opção 2", "Opção 3"];
      const threeResult = RawMaterialAIGenerationSchema.safeParse(threeOptionsPayload);
      assert.equal(threeResult.success, false, "deve rejeitar questão com 3 alternativas");

      // 3. Rejeição de índice da correta fora do intervalo 0-3
      const invalidIdxPayload = createValidRawPayload();
      invalidIdxPayload.questoes[0].corretaIdx = 4;
      const idxResult = RawMaterialAIGenerationSchema.safeParse(invalidIdxPayload);
      assert.equal(idxResult.success, false, "deve rejeitar corretaIdx = 4");

      // 4. Rejeição de resumo sem pontos-chave suficientes (< 2)
      const fewKeysPayload = createValidRawPayload();
      fewKeysPayload.resumo.pontos_chave = ["Ponto único insuficiente"];
      const fewKeysResult = RawMaterialAIGenerationSchema.safeParse(fewKeysPayload);
      assert.equal(fewKeysResult.success, false, "deve rejeitar resumo com menos de 2 pontos-chave");

      // 5. Rejeição de flashcards insuficientes (< 2)
      const fewFcPayload = createValidRawPayload();
      fewFcPayload.flashcards = [{ frente: "Apenas um", verso: "Card" }];
      const fewFcResult = RawMaterialAIGenerationSchema.safeParse(fewFcPayload);
      assert.equal(fewFcResult.success, false, "deve rejeitar menos de 2 flashcards");

      // 6. Confirmação de que o modelo NÃO tem poder para forçar cobertura integral
      // Mesmo que o modelo injetasse { cobertura: "integral" } no raw, o schema ignora ou barra,
      // e o servidor calcula com base nos tamanhos reais:
      const spoofAttempt = createValidRawPayload();
      spoofAttempt.cobertura = "integral"; // Tentativa da IA de alegar cobertura integral

      const safeResult = buildAuthoritativeGeneratedMaterial({
        materialId: "mat-teste-spoof",
        titulo: "Material Grande",
        totalCaracteresMaterial: 25000,
        caracteresProcessados: 4000,
        raw: RawMaterialAIGenerationSchema.parse(spoofAttempt),
      });

      // O servidor DEVE sobrepor e marcar como 'recorte'
      assert.equal(
        safeResult.escopoProcessado.cobertura,
        "recorte",
        "a cobertura deve ser calculada estritamente pelo servidor e nunca herdada da IA"
      );

      // 7. Confirmação de que metadados do cliente alegando totalCaracteresMaterial igual ao trecho
      // e tipoExtracao: 'integral' NUNCA geram 'integral' sem comprovacaoIntegralidadeServidor
      const clientDeclaredIntegral = buildAuthoritativeGeneratedMaterial({
        materialId: "mat-teste-client",
        titulo: "Material do Cliente",
        totalCaracteresMaterial: 1200,
        caracteresProcessados: 1200,
        tipoExtracaoDeclarado: "integral",
        raw: RawMaterialAIGenerationSchema.parse(createValidRawPayload()),
        // comprovacaoIntegralidadeServidor omitido (ou false)
      });

      assert.equal(
        clientDeclaredIntegral.escopoProcessado.cobertura,
        "recorte",
        "sem comprovação autoritativa do servidor, a cobertura deve permanecer conservadoramente como 'recorte'"
      );
    },
  },
];
