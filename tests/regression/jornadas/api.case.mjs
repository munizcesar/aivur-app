// Casos de regressão — Jornada de Edital (Módulo Trilhas / Etapa 1)
// Protegem CONTRATOS, AUTENTICAÇÃO, ANTI-IDOR, CONCORRÊNCIA e PERSISTÊNCIA.
//
// NOTA METODOLÓGICA:
// Os testes marcados com [Mock D1 in-memory SQLite] utilizam um emulador em memória baseado em
// node:sqlite com as migrações REAIS (0005 e 0006) e constraints ativas (FK, UNIQUE, CHECK).
// Não realizam mutações no banco D1 de produção.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  installFetch,
  ok,
  raw,
  fail,
  truncated,
} from "../_support/harness.mjs";
import { signSession } from "@/lib/session.ts";
import {
  JornadaEmentaSchema,
  GerarJornadaRequestSchema,
  CriarJornadaRequestSchema,
} from "@/lib/validations/jornada.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");

// Helper para instanciar o emulador de banco D1 com as DDLs reais
function createMockD1() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  const ddl0005 = readFileSync(path.join(ROOT, "migrations/0005_trilhas_microlearning.sql"), "utf8");
  const ddl0006 = readFileSync(path.join(ROOT, "migrations/0006_jornadas_edital.sql"), "utf8");
  db.exec(ddl0005);
  db.exec(ddl0006);

  return {
    raw: db,
    prepare(query) {
      return {
        _query: query,
        _bound: [],
        bind(...args) {
          const s = { ...this };
          s._bound = args;
          return s;
        },
        async first() {
          const stmt = db.prepare(this._query);
          return stmt.get(...this._bound) || null;
        },
        async all() {
          const stmt = db.prepare(this._query);
          return { results: stmt.all(...this._bound) };
        },
        async run() {
          const stmt = db.prepare(this._query);
          const info = stmt.run(...this._bound);
          return { success: true, meta: { changes: info.changes } };
        },
      };
    },
    async batch(statements) {
      db.exec("BEGIN TRANSACTION;");
      try {
        const results = [];
        for (const s of statements) {
          const stmt = db.prepare(s._query);
          if (s._query.trim().toUpperCase().startsWith("SELECT")) {
            results.push({ results: stmt.all(...s._bound) });
          } else {
            const info = stmt.run(...s._bound);
            results.push({ success: true, meta: { changes: info.changes } });
          }
        }
        db.exec("COMMIT;");
        return results;
      } catch (err) {
        db.exec("ROLLBACK;");
        throw err;
      }
    },
  };
}

let userCounter = 500;
async function createAuthCookie(userId) {
  const uid = userId || `user-jornada-${++userCounter}`;
  return await signSession(uid);
}

// Fixture de ementa válida
function validEmentaPayload() {
  return {
    titulo_concurso: "Receita Federal 2026",
    banca: "FGV",
    ano: 2026,
    cargo: "Auditor Fiscal",
    disciplinas: [
      {
        nome: "Direito Constitucional",
        ordem: 1,
        topicos: [
          { titulo: "Direitos e Garantias Fundamentais", ordem: 1, edital_item_ref: "Item 1.1" },
          { titulo: "Organização do Estado", ordem: 2, edital_item_ref: "Item 1.2" },
        ],
      },
      {
        nome: "Direito Administrativo",
        ordem: 2,
        topicos: [
          { titulo: "Princípios da Administração Pública", ordem: 1, edital_item_ref: "Item 2.1" },
          { titulo: "Atos Administrativos", ordem: 2, edital_item_ref: "Item 2.2" },
        ],
      },
    ],
  };
}

export const cases = [
  {
    id: "REG-JORNADA-001",
    title: "Validação Zod dos contratos da Jornada de Edital: aceita ementa válida e rejeita estruturas malformadas ou vazias",
    needs: "api",
    async run() {
      // 1. Ementa válida deve passar com sucesso
      const valid = validEmentaPayload();
      const parseValid = JornadaEmentaSchema.safeParse(valid);
      assert.equal(parseValid.success, true, "Ementa estruturada válida deve ser aceita");

      // 2. Rejeição de disciplinas vazias
      const emptyDisciplinas = { disciplinas: [] };
      const parseEmptyDisc = JornadaEmentaSchema.safeParse(emptyDisciplinas);
      assert.equal(parseEmptyDisc.success, false, "Ementa sem disciplinas deve falhar");

      // 3. Rejeição de disciplina sem tópicos
      const emptyTopicos = {
        disciplinas: [{ nome: "Português", ordem: 1, topicos: [] }],
      };
      const parseEmptyTop = JornadaEmentaSchema.safeParse(emptyTopicos);
      assert.equal(parseEmptyTop.success, false, "Disciplina sem tópicos deve falhar");

      // 4. Rejeição de tópicos com título em branco ou muito curto
      const blankTopic = {
        disciplinas: [
          {
            nome: "Português",
            ordem: 1,
            topicos: [{ titulo: "   ", ordem: 1 }],
          },
        ],
      };
      const parseBlank = JornadaEmentaSchema.safeParse(blankTopic);
      assert.equal(parseBlank.success, false, "Tópico com título em branco deve falhar");

      // 5. Contrato de requisição de extração: rejeita texto curto (< 50 caracteres)
      const shortTextReq = { title: "Concurso TJ", text: "Curto demais" };
      const parseShort = GerarJornadaRequestSchema.safeParse(shortTextReq);
      assert.equal(parseShort.success, false, "Texto menor que 50 chars deve falhar");

      // 6. Contrato de criação de jornada: exige hashes SHA-256 de 64 caracteres hexadecimais
      const validCreate = {
        ...valid,
        edital_fonte_tipo: "TEXTO",
        doc_original_hash: "a".repeat(64),
        ementa_hash: "b".repeat(64),
      };
      assert.equal(CriarJornadaRequestSchema.safeParse(validCreate).success, true);

      const invalidHash = {
        ...validCreate,
        ementa_hash: "curto",
      };
      assert.equal(CriarJornadaRequestSchema.safeParse(invalidHash).success, false);
    },
  },
  {
    id: "REG-JORNADA-002",
    title: "Autenticação e integridade de sessão: requisições sem sessão, adulteradas ou forjadas retornam 401 controlado",
    needs: "api",
    async run() {
      try {
        const { POST: gerarJornadaPost } = await import("@/app/api/ai/gerar-jornada/route.ts");
        const { GET: jornadasGet, POST: jornadasPost } = await import("@/app/api/jornadas/route.ts");
        const { GET: jornadaItemGet, DELETE: jornadaItemDel } = await import("@/app/api/jornadas/[id]/route.ts");

        // 1. Testa sessão ausente (cookie null)
        globalThis.__REG_COOKIES = {};
        const reqGerar = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          body: JSON.stringify({ title: "TJ-SP", text: "Conteúdo programático extenso com mais de 50 caracteres para validação." }),
        });
        const resGerar = await gerarJornadaPost(reqGerar);
        assert.equal(resGerar.status, 401, "/api/ai/gerar-jornada sem cookie deve retornar 401");

        const resList = await jornadasGet();
        assert.equal(resList.status, 401, "/api/jornadas GET sem cookie deve retornar 401");

        const reqCreate = new Request("http://localhost/api/jornadas", {
          method: "POST",
          body: JSON.stringify({ ...validEmentaPayload(), edital_fonte_tipo: "TEXTO", doc_original_hash: "a".repeat(64), ementa_hash: "b".repeat(64) }),
        });
        const resCreate = await jornadasPost(reqCreate);
        assert.equal(resCreate.status, 401, "/api/jornadas POST sem cookie deve retornar 401");

        const dummyParams = { params: Promise.resolve({ id: "jornada-123" }) };
        const reqItem = new Request("http://localhost/api/jornadas/jornada-123");
        const resItem = await jornadaItemGet(reqItem, dummyParams);
        assert.equal(resItem.status, 401, "/api/jornadas/[id] GET sem cookie deve retornar 401");

        const resDel = await jornadaItemDel(reqItem, dummyParams);
        assert.equal(resDel.status, 401, "/api/jornadas/[id] DELETE sem cookie deve retornar 401");

        // 2. Cookie forjado ou adulterado deve ser rejeitado
        globalThis.__REG_COOKIES = { aivur_session: "token-forjado-sem-assinatura-valida" };
        const resForjed = await jornadasGet();
        assert.equal(resForjed.status, 401, "Cookie forjado deve retornar 401");
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-003",
    title: "Extração de ementa com IA (/api/ai/gerar-jornada): validação de limites (50-15.000 chars) e orçamento de tokens",
    needs: "api",
    async run() {
      try {
        const { POST } = await import("@/app/api/ai/gerar-jornada/route.ts");
        const validCookie = await createAuthCookie();
        globalThis.__REG_COOKIES = { aivur_session: validCookie };

        // 1. Rejeição de entrada vazia ou < 50 chars
        const reqShort = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Receita Federal", text: "Muito curto" }),
        });
        const resShort = await POST(reqShort);
        assert.equal(resShort.status, 400);
        const bodyShort = await resShort.json();
        assert.ok(bodyShort.error);

        // 2. Rejeição de entrada > 15.000 chars
        const reqLong = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Receita Federal", text: "A".repeat(15001) }),
        });
        const resLong = await POST(reqLong);
        assert.equal(resLong.status, 400);

        // 3. Sucesso com entrada válida e simulação da IA (1 chamada à Groq)
        const fakeAiOutput = validEmentaPayload();
        const net = installFetch(() => ok(fakeAiOutput));
        try {
          const reqValid = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Receita Federal 2026",
              text: "CONTEÚDO PROGRAMÁTICO:\n1. DIREITO CONSTITUCIONAL: Direitos e garantias fundamentais. Organização do Estado.\n2. DIREITO ADMINISTRATIVO: Princípios e atos.",
            }),
          });
          const resValid = await POST(reqValid);
          assert.equal(resValid.status, 200);
          const data = await resValid.json();
          assert.equal(data.disciplinas.length, 2);
          assert.equal(net.calls.groq.length, 1, "Extração válida deve consumir apenas 1 chamada à Groq");
        } finally {
          net.restore();
        }
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-004",
    title: "Resiliência da extração de ementa: autocorreção via Fixer Prompt em 1 tentativa e rejeição de saída truncada",
    needs: "api",
    async run() {
      try {
        const { POST } = await import("@/app/api/ai/gerar-jornada/route.ts");
        const validCookie = await createAuthCookie();
        globalThis.__REG_COOKIES = { aivur_session: validCookie };

        // 1. Falha sintática inicial -> Fixer Prompt corrige e atinge o contrato
        const malformedInitial = { disciplinas: [{ nome: "Português", ordem: 1, topicos: [] }] }; // inválido: topicos vazios
        const correctedOutput = validEmentaPayload();

        let callCount = 0;
        const netFixer = installFetch(() => {
          callCount++;
          if (callCount === 1) return ok(malformedInitial);
          return ok(correctedOutput);
        });

        try {
          const req = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Polícia Federal",
              text: "Conteúdo do edital com matérias e tópicos para extração controlada pelo Fixer.",
            }),
          });
          const res = await POST(req);
          assert.equal(res.status, 200, "Fixer deve recuperar e responder 200");
          assert.equal(callCount, 2, "Deve executar 1 chamada inicial + 1 Fixer Prompt");
        } finally {
          netFixer.restore();
        }

        // 2. Saída truncada (JSON quebrado) -> retorna erro controlado (sem salvar dados parciais)
        const netTruncated = installFetch(() => raw('{"disciplinas":[{"nome":"Direito", "topicos": [{"titulo": "Top'));
        try {
          const req = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Polícia Rodoviária Federal",
              text: "Conteúdo programático extenso para verificação de corte e truncamento sintático.",
            }),
          });
          const res = await POST(req);
          assert.ok([400, 422, 502].includes(res.status), "Saída truncada irrecuperável deve retornar erro controlado");
        } finally {
          netTruncated.restore();
        }
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-005",
    title: "Criação persistida e idempotência [Mock D1 in-memory SQLite]: criação no D1 e retorno idempotente por ementa_hash",
    needs: "api",
    async run() {
      const { POST, GET } = await import("@/app/api/jornadas/route.ts");
      const mockDb = createMockD1();
      globalThis.__REG_CF_CONTEXT = { env: { DB: mockDb } };

      const userId = "aluno-concurso-01";
      const validCookie = await createAuthCookie(userId);
      globalThis.__REG_COOKIES = { aivur_session: validCookie };

      const ementaData = validEmentaPayload();
      const payload = {
        ...ementaData,
        titulo_concurso: "Analista Judiciário TRT",
        banca: "FCC",
        ano: 2026,
        cargo: "Área Judiciária",
        edital_fonte_tipo: "TEXTO",
        doc_original_hash: "1".repeat(64),
        ementa_hash: "2".repeat(64),
      };

      try {
        // 1. Primeira criação: insere com sucesso
        const req1 = new Request("http://localhost/api/jornadas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const res1 = await POST(req1);
        assert.equal(res1.status, 201, "Criação inicial deve retornar 201 Created");
        const data1 = await res1.json();
        assert.ok(data1.id, "Deve retornar o ID da jornada criada");
        assert.equal(data1.total_topicos, 4, "Total de tópicos mapeados deve ser 4");

        // 2. Consulta via GET: verifica integridade no banco
        const resList = await GET();
        assert.equal(resList.status, 200);
        const listData = await resList.json();
        assert.equal(listData.jornadas.length, 1);
        assert.equal(listData.jornadas[0].titulo_concurso, "Analista Judiciário TRT");
        assert.equal(listData.jornadas[0].total_topicos, 4);
        assert.equal(listData.jornadas[0].concluidos_count, 0);

        // 3. Segunda criação IDÊNTICA (mesmo ementa_hash): deve retornar idempotentemente a jornada existente
        const req2 = new Request("http://localhost/api/jornadas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const res2 = await POST(req2);
        assert.equal(res2.status, 200, "Requisição duplicada deve responder 200 com jornada existente");
        const data2 = await res2.json();
        assert.equal(data2.id, data1.id, "ID deve ser exatamente o mesmo (idempotência)");
        assert.equal(data2.reused, true, "Flag reused deve indicar que não duplicou");

        // Verifica que o banco continua contendo exatamente 1 jornada e 4 tópicos
        const checkJornadas = await mockDb.prepare("SELECT COUNT(*) as count FROM jornadas").first();
        assert.equal(Number(checkJornadas.count), 1, "Não deve haver duplicação de jornadas no D1");
        const checkTopicos = await mockDb.prepare("SELECT COUNT(*) as count FROM jornada_topicos").first();
        assert.equal(Number(checkTopicos.count), 4, "Não deve haver duplicação de tópicos no D1");
      } finally {
        delete globalThis.__REG_CF_CONTEXT;
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-006",
    title: "Isolamento anti-IDOR [Mock D1 in-memory SQLite]: proteção estrita contra acesso, início ou deleção cruzada",
    needs: "api",
    async run() {
      const { POST: criarJornada } = await import("@/app/api/jornadas/route.ts");
      const { GET: getJornada, DELETE: deleteJornada } = await import("@/app/api/jornadas/[id]/route.ts");
      const { POST: iniciarTopico } = await import("@/app/api/jornadas/[id]/topicos/[topicoId]/iniciar/route.ts");

      const mockDb = createMockD1();
      globalThis.__REG_CF_CONTEXT = { env: { DB: mockDb } };

      const userVictim = "vitima-100";
      const userAttacker = "invasor-200";

      // 1. Cria a jornada com o usuário legítimo
      globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie(userVictim) };
      const reqCreate = new Request("http://localhost/api/jornadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validEmentaPayload(),
          titulo_concurso: "Auditor Fiscal",
          edital_fonte_tipo: "TEXTO",
          doc_original_hash: "3".repeat(64),
          ementa_hash: "4".repeat(64),
        }),
      });
      const resCreate = await criarJornada(reqCreate);
      assert.equal(resCreate.status, 201);
      const created = await resCreate.json();
      const jornadaId = created.id;

      // Obtém o ID do primeiro tópico
      const topicoRow = await mockDb.prepare("SELECT id FROM jornada_topicos WHERE jornada_id = ? LIMIT 1").bind(jornadaId).first();
      const topicoId = topicoRow.id;

      // 2. Troca a sessão para o usuário atacante
      globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie(userAttacker) };
      const dummyParams = { params: Promise.resolve({ id: jornadaId }) };

      // Tentativa de GET na jornada de outro usuário -> 404 / Acesso Negado
      const reqGet = new Request(`http://localhost/api/jornadas/${jornadaId}`);
      const resGet = await getJornada(reqGet, dummyParams);
      assert.equal(resGet.status, 404, "Invasor não pode consultar jornada alheia");

      // Tentativa de INICIAR tópico de outro usuário -> 404 / Acesso Negado
      const topicParams = { params: Promise.resolve({ id: jornadaId, topicoId }) };
      const reqStart = new Request(`http://localhost/api/jornadas/${jornadaId}/topicos/${topicoId}/iniciar`, { method: "POST" });
      const resStart = await iniciarTopico(reqStart, topicParams);
      assert.equal(resStart.status, 404, "Invasor não pode iniciar tópico de jornada alheia");

      // Tentativa de DELETAR jornada de outro usuário -> 404 / Acesso Negado
      const resDelete = await deleteJornada(reqGet, dummyParams);
      assert.equal(resDelete.status, 404, "Invasor não pode deletar jornada alheia");

      // Verifica que os dados da vítima continuam 100% intactos no D1
      const countJornada = await mockDb.prepare("SELECT COUNT(*) as count FROM jornadas WHERE id = ?").bind(jornadaId).first();
      assert.equal(Number(countJornada.count), 1, "Jornada não deve ter sido excluída");

      delete globalThis.__REG_CF_CONTEXT;
      delete globalThis.__REG_COOKIES;
    },
  },
  {
    id: "REG-JORNADA-007",
    title: "Concorrência e convergência determinística ao iniciar tópico [Mock D1 in-memory SQLite]: trilha estável sem órfãos",
    needs: "api",
    async run() {
      const { POST: criarJornada } = await import("@/app/api/jornadas/route.ts");
      const { POST: iniciarTopico } = await import("@/app/api/jornadas/[id]/topicos/[topicoId]/iniciar/route.ts");

      const mockDb = createMockD1();
      globalThis.__REG_CF_CONTEXT = { env: { DB: mockDb } };

      const userId = "estudante-multiclique";
      globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie(userId) };

      // Cria jornada
      const resCreate = await criarJornada(new Request("http://localhost/api/jornadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validEmentaPayload(),
          titulo_concurso: "Escrivão PF",
          edital_fonte_tipo: "TEXTO",
          doc_original_hash: "5".repeat(64),
          ementa_hash: "6".repeat(64),
        }),
      }));
      const created = await resCreate.json();
      const jornadaId = created.id;

      const topicoRow = await mockDb.prepare("SELECT id FROM jornada_topicos WHERE jornada_id = ? LIMIT 1").bind(jornadaId).first();
      const topicoId = topicoRow.id;

      // Dispara 5 requisições concorrentes de início do mesmo tópico (simulando duplo clique ou abas simultâneas)
      const topicParams = { params: Promise.resolve({ id: jornadaId, topicoId }) };
      const requests = Array.from({ length: 5 }, () =>
        iniciarTopico(
          new Request(`http://localhost/api/jornadas/${jornadaId}/topicos/${topicoId}/iniciar`, { method: "POST" }),
          topicParams
        )
      );

      const responses = await Promise.all(requests);
      for (const res of responses) {
        assert.equal(res.status, 200, "Todas as requisições concorrentes devem retornar 200");
      }

      const bodies = await Promise.all(responses.map((r) => r.json()));
      const trilhaIds = new Set(bodies.map((b) => b.trilha_id));

      assert.equal(trilhaIds.size, 1, "Todas as requisições devem convergir para o mesmo identificador determinístico de trilha");
      const assignedTrilhaId = Array.from(trilhaIds)[0];
      assert.ok(assignedTrilhaId.startsWith("trilha_"), "ID determinístico deve ter prefixo trilha_");

      // Verifica no banco D1: exatamente 1 registro criado em trilhas
      const countTrilhas = await mockDb.prepare("SELECT COUNT(*) as count FROM trilhas WHERE id = ?").bind(assignedTrilhaId).first();
      assert.equal(Number(countTrilhas.count), 1, "Exatamente 1 trilha deve ser criada, sem duplicatas ou órfãos");

      // Verifica status atualizado no tópico
      const topicoAtualizado = await mockDb.prepare("SELECT trilha_id, status FROM jornada_topicos WHERE id = ?").bind(topicoId).first();
      assert.equal(topicoAtualizado.trilha_id, assignedTrilhaId);
      assert.equal(topicoAtualizado.status, "em_andamento");

      delete globalThis.__REG_CF_CONTEXT;
      delete globalThis.__REG_COOKIES;
    },
  },
  {
    id: "REG-JORNADA-008",
    title: "Conclusão explícita de tópico e cálculo do próximo passo [Mock D1 in-memory SQLite]: evento persistido e recomendação linear",
    needs: "api",
    async run() {
      const { POST: criarJornada } = await import("@/app/api/jornadas/route.ts");
      const { GET: getJornada } = await import("@/app/api/jornadas/[id]/route.ts");
      const { POST: concluirTopico } = await import("@/app/api/jornadas/[id]/topicos/[topicoId]/concluir/route.ts");

      const mockDb = createMockD1();
      globalThis.__REG_CF_CONTEXT = { env: { DB: mockDb } };

      const userId = "estudante-progresso";
      globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie(userId) };

      // 1. Cria jornada com 4 tópicos (ordem_global 1..4)
      const resCreate = await criarJornada(new Request("http://localhost/api/jornadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validEmentaPayload(),
          titulo_concurso: "Técnico Judiciário",
          edital_fonte_tipo: "TEXTO",
          doc_original_hash: "7".repeat(64),
          ementa_hash: "8".repeat(64),
        }),
      }));
      const created = await resCreate.json();
      const jornadaId = created.id;

      // Obtém tópicos ordenados por ordem_global
      const topicosList = await mockDb.prepare("SELECT id, ordem_global, titulo_topico FROM jornada_topicos WHERE jornada_id = ? ORDER BY ordem_global ASC").bind(jornadaId).all();
      const topico1 = topicosList.results[0];
      const topico2 = topicosList.results[1];

      // 2. Conclui explicitamente o Tópico 1
      const params1 = { params: Promise.resolve({ id: jornadaId, topicoId: topico1.id }) };
      const reqConcluir = new Request(`http://localhost/api/jornadas/${jornadaId}/topicos/${topico1.id}/concluir`, { method: "POST" });
      const resConcluir = await concluirTopico(reqConcluir, params1);
      assert.equal(resConcluir.status, 200);

      const bodyConcluir = await resConcluir.json();
      assert.equal(bodyConcluir.status, "concluido");
      assert.ok(bodyConcluir.proximo_topico, "Deve retornar recomendação linear do próximo tópico");
      assert.equal(bodyConcluir.proximo_topico.id, topico2.id, "Próximo tópico recomendado deve ser o de ordem_global subsequente");

      // 3. Verifica progresso geral da jornada via GET /api/jornadas/[id]
      const dummyParams = { params: Promise.resolve({ id: jornadaId }) };
      const resGet = await getJornada(new Request(`http://localhost/api/jornadas/${jornadaId}`), dummyParams);
      assert.equal(resGet.status, 200);
      const dataGet = await resGet.json();

      assert.equal(dataGet.jornada.progresso_geral, 25, "1 de 4 tópicos concluídos deve resultar em 25% de progresso geral");
      const topico1Check = dataGet.jornada.topicos.find((t) => t.id === topico1.id);
      assert.equal(topico1Check.status, "concluido");
      assert.equal(topico1Check.progresso, 100);

      delete globalThis.__REG_CF_CONTEXT;
      delete globalThis.__REG_COOKIES;
    },
  },
  {
    id: "REG-JORNADA-009",
    title: "Início de tópico resiliente [Mock D1 in-memory SQLite]: rejeita 404 sem vínculo persistido e preserva trilha preexistente sem sobrescrever",
    needs: "api",
    async run() {
      const { POST: criarJornada } = await import("@/app/api/jornadas/route.ts");
      const { POST: iniciarTopico } = await import("@/app/api/jornadas/[id]/topicos/[topicoId]/iniciar/route.ts");

      const mockDb = createMockD1();
      globalThis.__REG_CF_CONTEXT = { env: { DB: mockDb } };

      const userId = "estudante-resiliencia-inicio";
      globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie(userId) };

      // 1. Cria jornada de teste com 4 tópicos
      const resCreate = await criarJornada(new Request("http://localhost/api/jornadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validEmentaPayload(),
          titulo_concurso: "Analista Judiciário",
          edital_fonte_tipo: "TEXTO",
          doc_original_hash: "9".repeat(64),
          ementa_hash: "a".repeat(64),
        }),
      }));
      const created = await resCreate.json();
      const jornadaId = created.id;

      const topicosList = await mockDb.prepare("SELECT id FROM jornada_topicos WHERE jornada_id = ? ORDER BY ordem_global ASC").bind(jornadaId).all();
      const topico1 = topicosList.results[0];
      const topico2 = topicosList.results[1];
      const topico3 = topicosList.results[2];

      // Cenário A: Simula remoção concorrente do tópico durante o batch (consolidated === null)
      const origBatch = mockDb.batch;
      mockDb.batch = async function (statements) {
        mockDb.raw.exec(`DELETE FROM jornada_topicos WHERE id = '${topico1.id}'`);
        return await origBatch.call(mockDb, statements);
      };

      const params1 = { params: Promise.resolve({ id: jornadaId, topicoId: topico1.id }) };
      const res1 = await iniciarTopico(
        new Request(`http://localhost/api/jornadas/${jornadaId}/topicos/${topico1.id}/iniciar`, { method: "POST" }),
        params1
      );
      assert.equal(res1.status, 404, "Deve responder 404 quando o tópico não existe na consolidação");
      const body1 = await res1.json();
      assert.equal(body1.success, undefined, "Não deve retornar success: true");
      assert.equal(body1.trilha_id, undefined, "Não deve retornar trilha_id fantasma");
      assert.ok(body1.error, "Deve retornar mensagem de erro");

      // Cenário B: Tópico existe mas coluna trilha_id não foi persistida (consolidated.trilha_id === null)
      mockDb.batch = async function (statements) {
        await origBatch.call(mockDb, statements);
        mockDb.raw.exec(`UPDATE jornada_topicos SET trilha_id = NULL WHERE id = '${topico2.id}'`);
      };

      const params2 = { params: Promise.resolve({ id: jornadaId, topicoId: topico2.id }) };
      const res2 = await iniciarTopico(
        new Request(`http://localhost/api/jornadas/${jornadaId}/topicos/${topico2.id}/iniciar`, { method: "POST" }),
        params2
      );
      assert.equal(res2.status, 404, "Deve responder 404 se o trilha_id não foi persistido no banco");
      const body2 = await res2.json();
      assert.equal(body2.success, undefined, "Não deve retornar success: true");
      assert.equal(body2.trilha_id, undefined, "Não deve retornar trilha_id sem persistência");
      assert.ok(body2.error);

      // Restaura o batch normal
      mockDb.batch = origBatch;

      // Cenário C: Tópico já associado previamente a uma trilha (deve reutilizar sem sobrescrever)
      const trilhaExistenteId = "trilha_legada_existente_999";
      mockDb.raw.exec(`
        INSERT INTO trilhas (id, user_id, titulo, disciplina, video_youtube_id, video_titulo, video_resumo)
        VALUES ('${trilhaExistenteId}', '${userId}', 'Aula Pré-existente', 'Direito', 'abc12345', 'Vídeo', 'Resumo');
        UPDATE jornada_topicos SET trilha_id = '${trilhaExistenteId}', status = 'em_andamento' WHERE id = '${topico3.id}';
      `);

      const params3 = { params: Promise.resolve({ id: jornadaId, topicoId: topico3.id }) };
      const res3 = await iniciarTopico(
        new Request(`http://localhost/api/jornadas/${jornadaId}/topicos/${topico3.id}/iniciar`, { method: "POST" }),
        params3
      );
      assert.equal(res3.status, 200, "Deve responder 200 ao reutilizar trilha já associada");
      const body3 = await res3.json();
      assert.equal(body3.success, true);
      assert.equal(body3.reused, true);
      assert.equal(body3.trilha_id, trilhaExistenteId, "Deve retornar exatamente o trilha_id pré-existente");

      // Confirma no banco que o vínculo permanece inalterado
      const topico3Db = await mockDb.prepare("SELECT trilha_id FROM jornada_topicos WHERE id = ?").bind(topico3.id).first();
      assert.equal(topico3Db.trilha_id, trilhaExistenteId, "Vínculo no banco não deve ser sobrescrito");

      delete globalThis.__REG_CF_CONTEXT;
      delete globalThis.__REG_COOKIES;
    },
  },
  {
    id: "REG-JORNADA-010",
    title: "Segmentação e processamento de edital extenso com múltiplas disciplinas em blocos seguros",
    needs: "api",
    async run() {
      try {
        const { POST } = await import("@/app/api/ai/gerar-jornada/route.ts");
        const validCookie = await createAuthCookie();
        globalThis.__REG_COOKIES = { aivur_session: validCookie };

        // Edital extenso (> 2800 caracteres) com 4 disciplinas distintas
        const disc1 = "LÍNGUA PORTUGUESA:\n1. Compreensão e interpretação de textos.\n2. Tipologia textual.\n3. Ortografia oficial.\n" + "A".repeat(800) + "\n";
        const disc2 = "DIREITO CONSTITUCIONAL:\n1. Direitos e deveres individuais.\n2. Organização do Estado.\n" + "B".repeat(800) + "\n";
        const disc3 = "DIREITO ADMINISTRATIVO:\n1. Atos administrativos.\n2. Poderes da administração.\n" + "C".repeat(800) + "\n";
        const disc4 = "RACIOCÍNIO LÓGICO:\n1. Estruturas lógicas.\n2. Lógica de argumentação.\n" + "D".repeat(800) + "\n";
        const extensiveText = disc1 + disc2 + disc3 + disc4;

        assert.ok(extensiveText.length > 2800, "Texto deve exceder o limite de bloco único");

        let callCount = 0;
        const net = installFetch(() => {
          callCount++;
          if (callCount === 1) {
            return ok({
              disciplinas: [
                { nome: "Língua Portuguesa", topicos: [{ titulo: "Interpretação de textos" }, { titulo: "Ortografia oficial" }] },
                { nome: "Direito Constitucional", topicos: [{ titulo: "Direitos e deveres individuais" }] },
              ],
            });
          }
          return ok({
            disciplinas: [
              { nome: "Direito Administrativo", topicos: [{ titulo: "Atos administrativos" }] },
              { nome: "Raciocínio Lógico", topicos: [{ titulo: "Estruturas lógicas" }] },
            ],
          });
        });

        try {
          const req = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Concurso Unificado 2026",
              text: extensiveText,
              banca: "Cebraspe",
              ano: 2026,
            }),
          });
          const res = await POST(req);
          assert.equal(res.status, 200, "Edital extenso particionado deve responder 200 com sucesso");
          const body = await res.json();
          assert.ok(callCount >= 2, "Deve particionar e realizar chamadas controladas por bloco");
          assert.equal(body.disciplinas.length, 4, "Deve consolidar todas as 4 disciplinas");
          assert.equal(body.titulo_concurso, "Concurso Unificado 2026");
          const validation = JornadaEmentaSchema.safeParse(body);
          assert.equal(validation.success, true, "Resultado consolidado deve cumprir o schema Zod");
        } finally {
          net.restore();
        }
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-011",
    title: "Tratamento defensivo de truncamento por limite de tokens e JSON incompleto com relatório de etapa",
    needs: "api",
    async run() {
      try {
        const { POST } = await import("@/app/api/ai/gerar-jornada/route.ts");
        const validCookie = await createAuthCookie();
        globalThis.__REG_COOKIES = { aivur_session: validCookie };

        // 1. Truncamento com finish_reason === 'length'
        const netLength = installFetch(() => {
          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: { content: '{"disciplinas": [{"nome": "Direito' },
                  finish_reason: "length",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        });

        try {
          const req = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Polícia Civil",
              text: "LÍNGUA PORTUGUESA:\n1. Tópico A.\n" + "Z".repeat(3000) + "\nDIREITO:\n1. Tópico B.",
            }),
          });
          const res = await POST(req);
          assert.equal(res.status, 422, "Deve retornar status 422 em truncamento por limite de tokens");
          const body = await res.json();
          assert.ok(body.error.includes("truncada"), "Mensagem de erro deve detalhar truncamento");
          assert.equal(body.etapa_falha.motivo, "LIMITE_TOKENS");
          assert.ok(body.etapa_falha.bloco_indice >= 1);
        } finally {
          netLength.restore();
        }

        // 2. Retorno com formato inválido/incompleto irrecuperável
        const netInvalid = installFetch(() => ok({ texto_livre_sem_disciplinas: true }));
        try {
          const req = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Polícia Civil",
              text: "Conteúdo com mais de 50 caracteres para validação de formato inválido.",
            }),
          });
          const res = await POST(req);
          assert.equal(res.status, 422, "Formato sem disciplinas deve falhar com 422");
          const body = await res.json();
          assert.equal(body.etapa_falha.motivo, "FORMATO_INVALIDO");
        } finally {
          netInvalid.restore();
        }
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-012",
    title: "Preservação de conteúdo parcial em falha de bloco posterior e retomada sem duplicação",
    needs: "api",
    async run() {
      try {
        const { POST } = await import("@/app/api/ai/gerar-jornada/route.ts");
        const validCookie = await createAuthCookie();
        globalThis.__REG_COOKIES = { aivur_session: validCookie };

        const block1Text = "LÍNGUA PORTUGUESA:\n1. Ortografia.\n" + "A".repeat(1600) + "\n";
        const block2Text = "DIREITO CONSTITUCIONAL:\n1. Direitos fundamentais.\n" + "B".repeat(1600);
        const fullText = block1Text + block2Text;

        // Fase 1: Bloco 1 sucede, Bloco 2 falha
        let callCount = 0;
        const netFailSecond = installFetch(() => {
          callCount++;
          if (callCount === 1) {
            return ok({
              disciplinas: [
                { nome: "Língua Portuguesa", topicos: [{ titulo: "Ortografia oficial" }] },
              ],
            });
          }
          // Bloco 2 falha por limite
          return new Response(
            JSON.stringify({
              choices: [{ message: { content: "{}" }, finish_reason: "length" }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        });

        let savedPartial = null;
        try {
          const req = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "TRF 2026",
              text: fullText,
            }),
          });
          const res = await POST(req);
          assert.equal(res.status, 422);
          const body = await res.json();
          assert.equal(body.etapa_falha.bloco_indice, 2, "Deve identificar exatamente o bloco 2 como causador");
          assert.ok(body.conteudo_parcial, "Deve preservar conteúdo parcial validado");
          assert.equal(body.conteudo_parcial.disciplinas.length, 1);
          assert.equal(body.conteudo_parcial.disciplinas[0].nome, "Língua Portuguesa");
          savedPartial = body.conteudo_parcial;
        } finally {
          netFailSecond.restore();
        }

        // Fase 2: Retomada a partir do bloco 2 com conteudo_parcial prévio
        const netResume = installFetch(() => {
          return ok({
            disciplinas: [
              { nome: "Direito Constitucional", topicos: [{ titulo: "Direitos fundamentais" }] },
            ],
          });
        });

        try {
          const reqResume = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "TRF 2026",
              text: fullText,
              bloco_inicio: 2,
              conteudo_parcial: savedPartial,
            }),
          });
          const resResume = await POST(reqResume);
          assert.equal(resResume.status, 200, "Retomada deve responder 200");
          const bodyResume = await resResume.json();
          assert.equal(bodyResume.disciplinas.length, 2, "Deve combinar bloco salvo + bloco retomado");
          assert.equal(bodyResume.disciplinas[0].nome, "Língua Portuguesa");
          assert.equal(bodyResume.disciplinas[1].nome, "Direito Constitucional");
        } finally {
          netResume.restore();
        }
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-013",
    title: "Consolidação determinística de ementas: deduplicação de disciplinas, tópicos repetidos e ordenação estável",
    needs: "api",
    async run() {
      const { consolidateDisciplinas, consolidateEmenta, splitEditalIntoBlocks } = await import("@/lib/jornada-chunking.ts");

      // 1. Testa segmentação
      const small = "LÍNGUA PORTUGUESA:\n1. Interpretação.";
      assert.equal(splitEditalIntoBlocks(small).length, 1, "Edital curto deve gerar exatamente 1 bloco");

      // 2. Consolidação com variações de caixa, prefixos de numeração e duplicatas
      const blocks = [
        {
          disciplinas: [
            {
              nome: "DIREITO CONSTITUCIONAL",
              topicos: [
                { titulo: "1.1 - Direitos e Garantias Fundamentais", edital_item_ref: "Item 1.1" },
                { titulo: "Organização do Estado" },
              ],
            },
          ],
        },
        {
          disciplinas: [
            {
              nome: "disciplina: Direito Constitucional",
              topicos: [
                { titulo: "Direitos e Garantias Fundamentais" }, // duplicata com formatação diferente
                { titulo: "Poder Judiciário" },
              ],
            },
            {
              nome: "Língua Portuguesa",
              topicos: [
                { titulo: "a) Ortografia oficial" },
                { titulo: "b) Pontuação" },
              ],
            },
          ],
        },
      ];

      const merged = consolidateDisciplinas(blocks);
      assert.equal(merged.length, 2, "Deve consolidar em 2 disciplinas sem duplicação de nome");
      assert.equal(merged[0].nome, "DIREITO CONSTITUCIONAL");
      assert.equal(merged[0].topicos.length, 3, "Tópico repetido não deve ser duplicado");
      assert.equal(merged[0].topicos[0].titulo, "1.1 - Direitos e Garantias Fundamentais");
      assert.equal(merged[0].topicos[1].titulo, "Organização do Estado");
      assert.equal(merged[0].topicos[2].titulo, "Poder Judiciário");

      // 3. Testa limites defensivos (capping em 30 tópicos e 15 disciplinas)
      const massiveBlocks = [
        {
          disciplinas: [
            {
              nome: "Super Matéria",
              topicos: Array.from({ length: 45 }, (_, i) => ({ titulo: `Tópico ${i + 1}` })),
            },
          ],
        },
      ];
      const capped = consolidateDisciplinas(massiveBlocks);
      assert.equal(capped[0].topicos.length, 30, "Deve limitar em 30 tópicos por disciplina");

      // 4. Validação final via consolidateEmenta
      const ementa = consolidateEmenta(blocks, { title: "Concurso TJ" });
      const parseResult = JornadaEmentaSchema.safeParse(ementa);
      assert.equal(parseResult.success, true, "Ementa consolidada deve passar 100% no schema Zod");
    },
  },
  {
    id: "REG-JORNADA-014",
    title: "Blindagem da retomada parcial: validação de hash do edital, rejeição de edital divergente ou hash ausente e preservação de conteúdo parcial",
    needs: "api",
    async run() {
      try {
        const { POST } = await import("@/app/api/ai/gerar-jornada/route.ts");
        const { computeEditalHash } = await import("@/lib/jornada-chunking.ts");
        const validCookie = await createAuthCookie();
        globalThis.__REG_COOKIES = { aivur_session: validCookie };

        const editalOriginalText =
          "LÍNGUA PORTUGUESA:\n1. Ortografia oficial.\n" +
          "A".repeat(1600) +
          "\nDIREITO CONSTITUCIONAL:\n1. Direitos e garantias fundamentais.\n" +
          "B".repeat(1600);

        const editalDivergenteText =
          "RACIOCÍNIO LÓGICO:\n1. Equivalências lógicas e proposições.\n" +
          "C".repeat(1600) +
          "\nDIREITO PENAL:\n1. Crimes contra a administração pública.\n" +
          "D".repeat(1600);

        const hashOriginal = await computeEditalHash(editalOriginalText);

        const savedPartialContent = {
          titulo_concurso: "TRF 2026",
          ano: 2026,
          edital_hash: hashOriginal,
          disciplinas: [
            {
              nome: "Língua Portuguesa",
              topicos: [{ titulo: "Ortografia oficial" }],
            },
          ],
        };

        // 1. Retomada VÁLIDA com o mesmo edital e hash correspondente -> 200 OK
        const netValidResume = installFetch(() => {
          return ok({
            disciplinas: [
              {
                nome: "Direito Constitucional",
                topicos: [{ titulo: "Direitos e garantias fundamentais" }],
              },
            ],
          });
        });

        try {
          const reqValid = new Request("http://localhost/api/ai/gerar-jornada", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "TRF 2026",
              text: editalOriginalText,
              bloco_inicio: 2,
              conteudo_parcial: savedPartialContent,
            }),
          });
          const resValid = await POST(reqValid);
          assert.equal(resValid.status, 200, "Retomada com o mesmo edital deve retornar 200");
          const bodyValid = await resValid.json();
          assert.equal(bodyValid.disciplinas.length, 2);
          assert.equal(bodyValid.disciplinas[0].nome, "Língua Portuguesa");
          assert.equal(bodyValid.disciplinas[1].nome, "Direito Constitucional");
          assert.equal(bodyValid.edital_hash, hashOriginal);
        } finally {
          netValidResume.restore();
        }

        // 2. Retomada com TEXTO DE EDITAL DIFERENTE -> 400 EDITAL_DIVERGENTE com preservação de conteúdo parcial
        const reqDivergent = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "TRF 2026",
            text: editalDivergenteText,
            bloco_inicio: 2,
            conteudo_parcial: savedPartialContent,
          }),
        });
        const resDivergent = await POST(reqDivergent);
        assert.equal(resDivergent.status, 400, "Retomada com edital divergente deve retornar 400");
        const bodyDivergent = await resDivergent.json();
        assert.equal(bodyDivergent.motivo, "EDITAL_DIVERGENTE");
        assert.ok(bodyDivergent.error.includes("difere"));
        assert.equal(bodyDivergent.edital_hash_esperado, hashOriginal);
        // Preservação do conteúdo parcial
        assert.ok(bodyDivergent.conteudo_parcial, "Deve preservar o conteúdo parcial na resposta de rejeição");
        assert.equal(bodyDivergent.conteudo_parcial.disciplinas.length, 1);
        assert.equal(bodyDivergent.conteudo_parcial.disciplinas[0].nome, "Língua Portuguesa");

        // 3. Retomada com HASH AUSENTE -> 400 HASH_AUSENTE com preservação de conteúdo parcial
        const partialWithoutHash = {
          titulo_concurso: "TRF 2026",
          ano: 2026,
          disciplinas: [
            {
              nome: "Língua Portuguesa",
              topicos: [{ titulo: "Ortografia oficial" }],
            },
          ],
        };
        const reqNoHash = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "TRF 2026",
            text: editalOriginalText,
            bloco_inicio: 2,
            conteudo_parcial: partialWithoutHash,
          }),
        });
        const resNoHash = await POST(reqNoHash);
        assert.equal(resNoHash.status, 400, "Retomada sem hash deve retornar 400");
        const bodyNoHash = await resNoHash.json();
        assert.equal(bodyNoHash.motivo, "HASH_AUSENTE");
        assert.ok(bodyNoHash.error.includes("Identificação do edital ausente"));
        // Preservação do conteúdo parcial
        assert.ok(bodyNoHash.conteudo_parcial, "Deve preservar o conteúdo parcial recebido");
        assert.equal(bodyNoHash.conteudo_parcial.disciplinas[0].nome, "Língua Portuguesa");

        // 4. Retomada com HASH INVÁLIDO (fora do padrão 64 hexadecimais) -> 400 de validação
        const reqInvalidHash = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "TRF 2026",
            text: editalOriginalText,
            bloco_inicio: 2,
            edital_hash: "hash-invalido-curto",
            conteudo_parcial: savedPartialContent,
          }),
        });
        const resInvalidHash = await POST(reqInvalidHash);
        assert.equal(resInvalidHash.status, 400, "Hash malformado deve retornar 400 de validação");
        const bodyInvalidHash = await resInvalidHash.json();
        assert.ok(bodyInvalidHash.error, "Deve retornar mensagem de validação de campo inválido");

        // 5. Retomada com CONFLITO entre edital_hash externo e conteudo_parcial.edital_hash -> 400 CONFLITO_HASH com preservação de conteúdo parcial
        globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie() };
        const conflictingHash = "f".repeat(64);
        const reqConflict = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "TRF 2026",
            text: editalOriginalText,
            bloco_inicio: 2,
            edital_hash: conflictingHash,
            conteudo_parcial: savedPartialContent, // contém hashOriginal
          }),
        });
        const resConflict = await POST(reqConflict);
        assert.equal(resConflict.status, 400, "Conflito de hashes deve retornar 400");
        const bodyConflict = await resConflict.json();
        assert.equal(bodyConflict.motivo, "CONFLITO_HASH");
        assert.ok(bodyConflict.error.includes("Conflito"));
        assert.equal(bodyConflict.edital_hash_externo, conflictingHash);
        assert.equal(bodyConflict.edital_hash_conteudo_parcial, hashOriginal);
        // Preservação do conteúdo parcial
        assert.ok(bodyConflict.conteudo_parcial, "Deve preservar conteúdo parcial em caso de conflito de hash");
        assert.equal(bodyConflict.conteudo_parcial.disciplinas.length, 1);

        // 6. Retomada com hash não-hexadecimal dentro de conteudo_parcial (64 chars contendo 'Z') -> 400 validação Zod
        globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie() };
        const nonHexHash = "Z".repeat(64);
        const reqNonHex = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "TRF 2026",
            text: editalOriginalText,
            bloco_inicio: 2,
            conteudo_parcial: {
              ...savedPartialContent,
              edital_hash: nonHexHash,
            },
          }),
        });
        const resNonHex = await POST(reqNonHex);
        assert.equal(resNonHex.status, 400, "Hash não-hexadecimal dentro de conteudo_parcial deve ser rejeitado pelo Zod com 400");
        const bodyNonHex = await resNonHex.json();
        assert.ok(bodyNonHex.error, "Deve indicar erro de validação Zod");
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-JORNADA-015",
    title: "Contrato do frontend na retomada: preservação de edital_hash, bloco_inicio e conteudo_parcial em resposta 422",
    needs: "api",
    async run() {
      const { POST } = await import("@/app/api/ai/gerar-jornada/route.ts");

      // 1. Edital com 2 blocos seguros
      const editalText =
        "LÍNGUA PORTUGUESA:\n1. Compreensão e interpretação de textos.\n" +
        "A".repeat(1600) +
        "\nDIREITO CONSTITUCIONAL:\n1. Direitos e garantias fundamentais.\n" +
        "B".repeat(1600);

      // Simula 1ª tentativa: bloco 1 conclui com sucesso, mas bloco 2 falha por limite de tokens (HTTP 422)
      let callCount = 0;
      const netMockFirstAttempt = installFetch(() => {
        callCount++;
        if (callCount === 1) {
          return ok({
            disciplinas: [
              {
                nome: "Língua Portuguesa",
                topicos: [{ titulo: "Compreensão de textos" }],
              },
            ],
          });
        }
        // Bloco 2 falha por limite de tokens (finish_reason: length)
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "{}" }, finish_reason: "length" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

      let errJson422;
      try {
        globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie() };
        const reqInitial = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Auditor 2026",
            text: editalText,
          }),
        });

        const resInitial = await POST(reqInitial);
        assert.equal(resInitial.status, 422, "Falha parcial no bloco 2 deve retornar 422");
        errJson422 = await resInitial.json();
        assert.ok(errJson422.conteudo_parcial, "Deve conter conteudo_parcial");
        assert.ok(errJson422.edital_hash, "Deve conter edital_hash");
        assert.equal(errJson422.etapa_falha.bloco_indice, 2);
        assert.equal(errJson422.etapa_falha.motivo, "LIMITE_TOKENS");
        assert.equal(errJson422.conteudo_parcial.disciplinas.length, 1);
        assert.equal(errJson422.conteudo_parcial.disciplinas[0].nome, "Língua Portuguesa");
      } finally {
        netMockFirstAttempt.restore();
        delete globalThis.__REG_COOKIES;
      }

      // 2. Simula o frontend no clique de "Tentar novamente":
      // Preserva edital_hash, bloco_inicio = 2, conteudo_parcial e o texto original
      const resumePayload = {
        title: "Auditor 2026",
        text: editalText,
        bloco_inicio: errJson422.etapa_falha.bloco_indice,
        edital_hash: errJson422.edital_hash,
        conteudo_parcial: errJson422.conteudo_parcial,
      };

      const netMockResume = installFetch(() => {
        return ok({
          disciplinas: [
            {
              nome: "Direito Constitucional",
              topicos: [{ titulo: "Direitos e garantias fundamentais" }],
            },
          ],
        });
      });

      try {
        globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie() };
        const reqResume = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resumePayload),
        });

        const resResume = await POST(reqResume);
        assert.equal(resResume.status, 200, "Retomada com os parâmetros do frontend deve retornar 200");
        const bodyResume = await resResume.json();
        assert.equal(bodyResume.disciplinas.length, 2, "Ementa consolidada deve conter ambas as disciplinas");
        assert.equal(bodyResume.disciplinas[0].nome, "Língua Portuguesa");
        assert.equal(bodyResume.disciplinas[1].nome, "Direito Constitucional");
        assert.equal(bodyResume.edital_hash, errJson422.edital_hash, "Hash retornado deve ser o mesmo");
      } finally {
        netMockResume.restore();
        delete globalThis.__REG_COOKIES;
      }

      // 3. Simula tentativa de "Tentar novamente" com texto alterado pelo usuário -> servidor deve rejeitar com EDITAL_DIVERGENTE
      try {
        globalThis.__REG_COOKIES = { aivur_session: await createAuthCookie() };
        const reqTampered = new Request("http://localhost/api/ai/gerar-jornada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...resumePayload,
            text: editalText + "\nMATÉRIA ADICIONADA:",
          }),
        });

        const resTampered = await POST(reqTampered);
        assert.equal(resTampered.status, 400, "Texto de edital modificado deve ser rejeitado na retomada");
        const bodyTampered = await resTampered.json();
        assert.equal(bodyTampered.motivo, "EDITAL_DIVERGENTE");
        assert.ok(bodyTampered.conteudo_parcial, "Deve preservar o conteúdo parcial recebido");
      } finally {
        delete globalThis.__REG_COOKIES;
      }
    },
  },
];
