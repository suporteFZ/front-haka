"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";
import ProductCard, { ProductCardItem as CatalogProduct } from "@/components/common/ProductCard";

// ─── Tipos ───────────────────────────────────────────────────
interface CatalogCategory {
  id: number | string;
  documentId?: string;
  Nome: string;
  slug: string;
  Texto_catalogo?: string;
  Logo_marca?: any;
}

// ─── Componente Tabs com Indicador Deslizante ─────────────────
function CatalogTabs({
  categories,
  activeIdx,
  onSelect,
}: {
  categories: CatalogCategory[];
  activeIdx: number;
  onSelect: (idx: number) => void;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 4, width: 0, ready: false });

  useEffect(() => {
    const update = () => {
      const el = tabRefs.current[activeIdx];
      if (el) {
        setIndicator({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeIdx, categories]);

  return (
    <div className="relative inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-stone-200/60 max-w-full">
      {/* Indicador deslizante (Pílula preta animada pra frente e pra trás) */}
      <div
        className="absolute top-1 bottom-1 left-0 rounded-full bg-black shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {categories.map((cat, idx) => (
        <button
          key={cat.id}
          ref={(el) => {
            tabRefs.current[idx] = el;
          }}
          type="button"
          onClick={() => onSelect(idx)}
          className={`relative z-10 px-5 md:px-6 py-2 md:py-2.5 rounded-full text-[13px] md:text-[14px] font-sans font-medium whitespace-nowrap cursor-pointer transition-colors duration-300 ${
            idx === activeIdx
              ? "text-white"
              : "text-[#000000]/70 hover:text-[#000000]"
          }`}
        >
          {cat.Nome.trim()}
        </button>
      ))}
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────
export default function Catalog({
  data,
  products,
}: {
  data?: { Titulo?: string; categorias?: CatalogCategory[] };
  products?: CatalogProduct[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isSectionActive, setIsSectionActive] = useState(false);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Ativa quando a seção do catálogo alcança o topo da tela
      const isActive = rect.top <= 140 && rect.bottom >= 40;
      setIsSectionActive(isActive);

      // Quando o fim da seção cinza entra na janela, o botão ancora no fundo da seção (absolute)
      // para NUNCA sair da seção nem invadir 'Mais vendidas'
      const isPinned = rect.bottom <= windowHeight;
      setIsPinnedToBottom(isPinned);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const categories = data?.categorias || [];
  const title = data?.Titulo || "Catálogo";
  const allProducts = (products || []).filter(
    (p) => p.Ativo !== false
  );

  const handleTabChange = (idx: number) => {
    if (idx === activeIdx) return;
    // O indicador da tab se move imediatamente (para frente ou para trás)
    setActiveIdx(idx);
    // As escritas e produtos começam a sumir com opacidade
    setIsFading(true);

    setTimeout(() => {
      // Atualiza o conteúdo quando a opacidade atinge 0
      setDisplayIdx(idx);
      // As novas escritas reaparecem com opacidade
      setIsFading(false);
    }, 180);
  };

  if (categories.length === 0) return null;

  const displayCategory = categories[displayIdx] || categories[0];

  // Filtra produtos pela categoria ativa (compara documentId ou id)
  const filteredProducts = allProducts.filter((p) => {
    const catId = p.categoria?.documentId || p.categoria?.id;
    const activeId = displayCategory?.documentId || displayCategory?.id;
    return catId === activeId;
  });

  // Limita a 8 produtos (2 linhas de 4)
  const displayProducts = filteredProducts.slice(0, 8);

  // Logo e texto da categoria ativa
  const logoUrl = getStrapiMedia(displayCategory?.Logo_marca?.url);
  const brandText = displayCategory?.Texto_catalogo;

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F1F1F1]"
    >
      {/* ── HEADER STICKY (Abaixo do header do site, com z-30, padding do topo equilibrado e menos padding embaixo) ── */}
      <div
        ref={headerRef}
        className="sticky top-0 z-30 bg-[#F1F1F1] pt-20 md:pt-26 pb-3 md:pb-5 shadow-[0_15px_25px_-5px_rgba(0,0,0,0.06),0_6px_10px_-6px_rgba(0,0,0,0.04)]"
      >
        <div className="w-full max-w-[1600px] mx-auto px-[17px] md:px-8">
          {/* ── DESKTOP LAYOUT (lg:flex) ── */}
          <div className="hidden lg:flex items-end justify-between gap-10">
            {/* Esquerda: Título + Link + Tabs Pills */}
            <div className="flex flex-col gap-6 flex-1 min-w-0">
              <div className="flex items-baseline gap-6">
                <h2 className="text-[34px] md:text-[44px] font-heading font-medium text-[#000000] leading-tight">
                  {title}
                </h2>
                <Link
                  href="/categoria"
                  className="text-[13px] md:text-[14px] font-sans text-[#000000]/60 hover:text-[#000000] transition-colors whitespace-nowrap"
                >
                  Ver o catálogo completo →
                </Link>
              </div>

              {/* Cápsula de Tabs Deslizante */}
              <div className="overflow-x-auto scrollbar-hide pb-1">
                <CatalogTabs
                  categories={categories}
                  activeIdx={activeIdx}
                  onSelect={handleTabChange}
                />
              </div>
            </div>

            {/* Direita (Desktop): Branding com transição suave de opacidade */}
            <div
              className={`flex items-center gap-6 max-w-[550px] flex-shrink-0 transition-opacity duration-200 ease-in-out ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex flex-col gap-2 text-right">
                <span className="text-[28px] md:text-[34px] font-heading font-medium text-[#000000] leading-tight">
                  {displayCategory?.Nome.trim()}
                </span>
                {brandText && (
                  <p className="text-[12px] font-sans text-[#000000]/65 leading-relaxed max-w-[340px] ml-auto">
                    {brandText}
                  </p>
                )}
              </div>
              {logoUrl && (
                <div className="relative w-[95px] h-[95px] flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt={`Logo ${displayCategory?.Nome}`}
                    fill
                    unoptimized
                    sizes="95px"
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── MOBILE LAYOUT (lg:hidden) ── */}
          <div className="flex lg:hidden flex-col gap-3">
            {/* 1. Linha Superior: Título à esquerda e Link à direita */}
            <div className="flex items-baseline justify-between w-full">
              <h2 className="text-[26px] font-heading font-medium text-[#000000] leading-tight">
                {title}
              </h2>
              <Link
                href="/categoria"
                className="text-[11px] font-sans text-[#000000]/60 hover:text-[#000000] transition-colors whitespace-nowrap"
              >
                Ver o catálogo completo →
              </Link>
            </div>

            {/* 2. Linha Intermediária: Logo e Descrição (sem o título grande da categoria) */}
            {(logoUrl || brandText) && (
              <div
                className={`flex items-center justify-between gap-3 transition-opacity duration-200 ease-in-out ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
              >
                {brandText && (
                  <p className="text-[11px] sm:text-[12px] font-sans text-[#000000]/65 leading-relaxed flex-1">
                    {brandText}
                  </p>
                )}
                {logoUrl && (
                  <div className="relative w-[48px] h-[48px] sm:w-[55px] sm:h-[55px] flex-shrink-0 ml-auto">
                    <Image
                      src={logoUrl}
                      alt={`Logo ${displayCategory?.Nome}`}
                      fill
                      unoptimized
                      sizes="55px"
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 3. Linha Inferior: Cápsula de Tabs Deslizante */}
            <div className="overflow-x-auto scrollbar-hide pb-1 -mx-[17px] px-[17px]">
              <CatalogTabs
                categories={categories}
                activeIdx={activeIdx}
                onSelect={handleTabChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── GRADE DE PRODUTOS (com menos padding no topo e transição suave de opacidade) ── */}
      <div
        className={`w-full max-w-[1600px] mx-auto px-[17px] md:px-8 pt-4 md:pt-6 pb-20 md:pb-28 transition-opacity duration-200 ease-in-out ${
          isFading ? "opacity-0" : "opacity-100"
        }`}
      >
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-[#000000]/40 font-sans text-[14px]">
            Nenhum produto cadastrado nesta categoria.
          </div>
        )}
      </div>

      {/* ── BOTÃO "VER TODOS OS PRODUTOS" FIXO / CONFINADO DENTRO DA SEÇÃO ── */}
      {filteredProducts.length > 0 && (
        <div
          className={`${
            isPinnedToBottom
              ? "absolute bottom-6 md:bottom-8"
              : "fixed bottom-6 md:bottom-8"
          } left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 ${
            isSectionActive
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <Link
            href={displayCategory?.slug ? `/categoria/${displayCategory.slug}` : "/categoria"}
            className="pointer-events-auto px-8 py-3.5 rounded-full bg-[#000000] text-white text-[12px] md:text-[13px] font-sans font-bold tracking-wider uppercase hover:opacity-80 active:opacity-70 transition-opacity duration-200 shadow-xl block whitespace-nowrap cursor-pointer"
          >
            Ver todos os produtos
          </Link>
        </div>
      )}
    </section>
  );
}

