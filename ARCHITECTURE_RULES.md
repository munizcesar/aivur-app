# ARCHITECTURE RULES (Constituição Perpétua do AIVUR)

Este documento dita as regras arquitetônicas inegociáveis para a construção e manutenção do Aivur. Todas as decisões de código, backend e integrações com IA devem respeitar estas diretrizes para garantir escalabilidade, performance e otimização extrema de custos.

## DIRETRIZ ZERO (Innegociável): RAG Engine e Custos de IA
Toda integração com Inteligência Artificial (IA) deve **obrigatoriamente** usar o `RAGEngine` (Cache Semântico com Cloudflare KV + Otimizador de Tokens). 
Consultas brutas enviadas à IA sem o filtro híbrido (D1) e sem a limitação de tokens (Otimizador) são **estritamente proibidas**. 
O objetivo primário é proteger nossos custos de servidor para sempre: se a IA já respondeu a uma dúvida antes (via KV) ou se o contexto é irrelevante (corte pelo Otimizador), a inferência da IA não deve ser cobrada.

## DIRETRIZ UM: Dependências, Banco de Dados e APIs
Qualquer nova dependência pesada, alteração na modelagem do banco de dados (Cloudflare D1) ou integração com API externa de custo variável deve ter sua regra de otimização documentada **neste arquivo** antes que o código seja escrito. Nossa visão de escalabilidade é perpétua e atemporal.

## DIRETRIZ DOIS (Tolerância Zero a Lixo de Dados — Anti-Alucinação)
**NENHUM dado extraído (PDF ou Web) pode ir para o Vectorize cegamente.** É obrigatória uma validação (Filtro de Sanidade via LLM) para garantir que o texto é um documento jurídico/educacional válido. Textos com bloqueios de firewall, captchas, HTML sujo ou OCR quebrado devem ser automaticamente **descartados** antes da vetorização. O princípio "Garbage In, Garbage Out" é a nossa maior ameaça à precisão do produto e à confiança do aluno. A esteira de ingestão autônoma (`scripts/autonomous_ingest.ts`) implementa este filtro como portão obrigatório antes de qualquer operação no Vectorize ou D1.
