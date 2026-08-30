"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  return (
    <div className={styles.dashWrap}>
      <div className="container">
        
        <div className={styles.dashboardLayout}>
          
          {/* LADO ESQUERDO: Âncora visual com Imagem 3D */}
          <div className={styles.heroCol}>
            <div className={styles.heroText}>
              <p className={styles.heroEyebrow}>MENTORIA DE ELITE PARA CONCURSOS</p>
              <h1 className={`${styles.heroTitle} font-semibold tracking-tight`}>Estude com precisão cirúrgica.</h1>
              <p className={styles.heroSub}>
                O Mentor AIVUR organiza seus editais, domina seu material e converte seu tempo em aprovação de forma definitiva.
              </p>
            </div>
            
            <div className={styles.heroImageWrapper}>
              {/*eslint-disable-next-line @next/next/no-img-element*/}
              <img src="/images/aivur/hero-main.png" alt="Aivur Mascote Inteligente" className={`${styles.heroImage} animate-float-premium`} />
            </div>
          </div>

          {/* LADO DIREITO: Grid de Cards dos Pilares Empilhados */}
          <div className={styles.pillarsCol}>
            
            {/* CARD 1 - Destaque */}
            <Link href="/mentor/gerar" className={`${styles.pillarCard} ${styles.pillarCardFeatured} transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] border border-border/40 dark:border-white/10 shadow-sm p-6`}>
              <div className={styles.pillarThumb}>
                {/*eslint-disable-next-line @next/next/no-img-element*/}
                <img src="/images/aivur/icon-trilhas.png" alt="Trilhas de Estudo" />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={`${styles.pillarTitle} font-semibold tracking-tight`}>Trilhas de Estudo</h3>
                <p className={styles.pillarDesc}>
                  Seu edital transformado em um plano de metas diárias.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={20} height={20} />
              </div>
            </Link>

            {/* CARD 2 */}
            <Link href="/questoes" className={`${styles.pillarCard} transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] border border-border/40 dark:border-white/10 shadow-sm p-6`}>
              <div className={styles.pillarThumb}>
                {/*eslint-disable-next-line @next/next/no-img-element*/}
                <img src="/images/aivur/icon-questoes.png" alt="Caderno de Questões" />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={`${styles.pillarTitle} font-semibold tracking-tight`}>Caderno de Questões</h3>
                <p className={styles.pillarDesc}>
                  Treine com questões focadas na sua banca e cargo.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={20} height={20} />
              </div>
            </Link>

            {/* CARD 3 */}
            <Link href="/material" className={`${styles.pillarCard} transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] border border-border/40 dark:border-white/10 shadow-sm p-6`}>
              <div className={styles.pillarThumb}>
                {/*eslint-disable-next-line @next/next/no-img-element*/}
                <img src="/images/aivur/icon-material.png" alt="Meu Material" />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={`${styles.pillarTitle} font-semibold tracking-tight`}>Meu Material</h3>
                <p className={styles.pillarDesc}>
                  Envie seus PDFs e deixe a IA organizar seus resumos.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={20} height={20} />
              </div>
            </Link>

            {/* CARD 4 */}
            <Link href="/redacao" className={`${styles.pillarCard} transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/5 active:scale-[0.98] border border-border/40 dark:border-white/10 shadow-sm p-6`}>
              <div className={styles.pillarThumb}>
                {/*eslint-disable-next-line @next/next/no-img-element*/}
                <img src="/images/aivur/icon-redacao.png" alt="Redação Coach" />
              </div>
              <div className={styles.pillarContent}>
                <h3 className={`${styles.pillarTitle} font-semibold tracking-tight`}>Redação Coach</h3>
                <p className={styles.pillarDesc}>
                  Correção instantânea com nota e feedback do examinador.
                </p>
              </div>
              <div className={styles.pillarArrow}>
                <ArrowRight width={20} height={20} />
              </div>
            </Link>

          </div>

        </div>
      </div>
    </div>
  );
}
