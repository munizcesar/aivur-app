"use client";

import { useState } from "react";
import { Search as SearchIcon, Loader2, X } from "lucide-react";
import styles from "./Search.module.css";

interface SearchResult {
  orgao?: string;
  cargo?: string;
  banca?: string;
  ano?: number | string;
  data_prova?: string;
  url?: string;
  isDiscovery?: boolean;
  snippet?: string;
  salario?: string;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedEdital, setSelectedEdital] = useState<SearchResult | null>(null);

  const performSearch = async () => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(false);
    setResults(null);

    try {
      const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || "https://aivur-worker.cesarmuniz0816.workers.dev";
      const res = await fetch(`${WORKER_URL}/api/editais/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error("Erro na busca");
      const data = await res.json() as { results?: SearchResult[] };
      setResults(data.results || []);
    } catch (err) {
      console.error("[search]", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const formatYear = (r: SearchResult) => {
    if (r.data_prova) {
      const yr = new Date(r.data_prova).getUTCFullYear();
      if (!isNaN(yr)) return yr;
    }
    if (r.ano) return r.ano;
    return null;
  };

  const formatDate = (d?: string) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString("pt-BR", { timeZone: "UTC", year: "numeric", month: "long" });
  };

  return (
    <>
      <section className={styles.searchSection} data-aivo-anchor="search">
        <div className="container">
          <div className={styles.searchSectionHeader}>
            <h2 className={styles.searchSectionTitle}>Encontre seu edital</h2>
            <p className={styles.searchSectionSubtitle}>Pesquise por órgão, concurso, cargo, banca ou ano.</p>
          </div>
          <div className="search-bar-wrapper">
            <div className={styles.searchInputGroup}>
              <input
                type="text"
                placeholder="Ex.: PCSP, Polícia Civil SP, Escrivão VUNESP..."
                className={styles.searchInputField}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-primary" onClick={performSearch}>
                Buscar <SearchIcon width={18} height={18} />
              </button>
            </div>
            
            <div className={styles.searchResultsContainer}>
              {loading && (
                <div className={styles.loadingMessage}>
                  <Loader2 width={20} height={20} className="lucide-spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                  Buscando editais...
                </div>
              )}
              {error && (
                <div className={styles.errorMessage}>
                  Erro ao realizar a busca. Tente novamente mais tarde.
                </div>
              )}
              {results && results.length === 0 && !loading && !error && (
                <div className={styles.emptyMessage}>
                  Nenhum edital encontrado para esta busca. Tente buscar pelo órgão, cargo, banca ou ano.
                </div>
              )}
              {results && results.map((r, i) => {
                const year = formatYear(r);
                return (
                  <div key={i} className={styles.resultCard} onClick={() => setSelectedEdital(r)}>
                    {r.isDiscovery && <div className={styles.discoveryBadge}>Descoberta Externa</div>}
                    {r.orgao && <h4 className={styles.resultOrgao}>{r.orgao}</h4>}
                    {r.cargo && <div className={styles.resultField}><strong>Cargo:</strong> {r.cargo}</div>}
                    {r.banca && <div className={styles.resultField}><strong>Banca:</strong> {r.banca}</div>}
                    {year && <div className={styles.resultField} style={{ marginBottom: "12px" }}><strong>Ano:</strong> {year}</div>}
                    {r.url && (
                      <div className={styles.resultCta}>
                        <a 
                          href={r.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {r.isDiscovery ? "[Ver link externo]" : "[Ver edital oficial]"}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Edital Detail Modal */}
      {selectedEdital && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEdital(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedEdital.orgao || "Concurso Público"}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedEdital(null)}>
                <X width={20} height={20} /> Fechar
              </button>
            </div>
            
            <div className={styles.modalGrid}>
              {selectedEdital.cargo && (
                <div className={styles.modalField}>
                  <strong>Cargo:</strong> <span>{selectedEdital.cargo}</span>
                </div>
              )}
              {selectedEdital.banca && (
                <div className={styles.modalField}>
                  <strong>Banca:</strong> <span>{selectedEdital.banca}</span>
                </div>
              )}
              {selectedEdital.salario && selectedEdital.salario !== "R$ null" && selectedEdital.salario !== "R$ " && (
                <div className={styles.modalField}>
                  <strong>Salário:</strong> <span>{selectedEdital.salario}</span>
                </div>
              )}
              {formatDate(selectedEdital.data_prova) && (
                <div className={styles.modalField}>
                  <strong>Data da Prova:</strong> <span>{formatDate(selectedEdital.data_prova)}</span>
                </div>
              )}
            </div>

            {selectedEdital.snippet && (
              <div className={styles.snippetContainer}>
                <h4>Detalhes / Trecho Encontrado</h4>
                <div 
                  className={styles.snippetBox} 
                  dangerouslySetInnerHTML={{ __html: selectedEdital.snippet.replace(/\n/g, '<br>') }}
                />
              </div>
            )}
            
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <button className="btn btn-primary" onClick={() => setSelectedEdital(null)}>
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
