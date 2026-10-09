"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

interface ProductTechSpecsProps {
  product: any;
}

type TabType = "especificacoes" | "medidas" | "dimensoes";

export default function ProductTechSpecs({ product }: ProductTechSpecsProps) {
  if (!product) return null;

  const title = product.Titulo_texto?.trim() || "";
  const textParagraphs: string[] = useMemo(() => {
    return product.Texto
      ? product.Texto.split("\n\n").map((p: string) => p.trim()).filter(Boolean)
      : [];
  }, [product.Texto]);

  const especificacoes = useMemo(() => {
    return (product.Especificacoes || []).filter(
      (it: any) => it && it.Chave?.trim() && it.Valor?.trim()
    );
  }, [product.Especificacoes]);

  const medidas = useMemo(() => {
    return (product.Medidas || []).filter(
      (it: any) => it && it.Chave?.trim() && it.Valor?.trim()
    );
  }, [product.Medidas]);

  const dimensoes = useMemo(() => {
    return (product.Dimensoes || []).filter(
      (it: any) => it && it.Chave?.trim() && it.Valor?.trim()
    );
  }, [product.Dimensoes]);

  const hasLeftContent = Boolean(title || textParagraphs.length > 0);

  // Lista dinâmica de abas que REALMENTE possuem conteúdo cadastrado (memoizada para estabilidade de referência)
  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: TabType; label: string; items: any[] }> = [];
    if (especificacoes.length > 0) {
      tabs.push({ id: "especificacoes", label: "Especificações", items: especificacoes });
    }
    if (medidas.length > 0) {
      tabs.push({ id: "medidas", label: "Medidas", items: medidas });
    }
    if (dimensoes.length > 0) {
      tabs.push({ id: "dimensoes", label: "Dimensões", items: dimensoes });
    }
    return tabs;
  }, [especificacoes, medidas, dimensoes]);

  const hasRightContent = availableTabs.length > 0;

  // Se não houver absolutamente nenhum conteúdo (nem textos nem especificações), não renderiza a seção
  if (!hasLeftContent && !hasRightContent) {
    return null;
  }

  // Estado da aba ativa (começa na primeira aba que existir)
  const [activeTab, setActiveTab] = useState<TabType>(availableTabs[0]?.id || "especificacoes");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const update = () => {
      const activeIdx = availableTabs.findIndex((t) => t.id === activeTab);
      const el = tabRefs.current[activeIdx >= 0 ? activeIdx : 0];
      if (el) {
        setIndicator((prev) => {
          if (prev.left === el.offsetLeft && prev.width === el.offsetWidth && prev.ready) {
            return prev;
          }
          return {
            left: el.offsetLeft,
            width: el.offsetWidth,
            ready: true,
          };
        });
      }
    };
    update();
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(update);
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab, availableTabs]);

  // Itens da aba ativa (garantindo que se a aba ativa não estiver na lista, pega a primeira)
  const currentTabObj = availableTabs.find((t) => t.id === activeTab) || availableTabs[0];
  const activeItems = currentTabObj?.items || [];

  // Agrupar itens em pares para renderizar 2 colunas por linha igual ao layout
  const pairedRows: Array<[any, any?]> = [];
  for (let i = 0; i < activeItems.length; i += 2) {
    pairedRows.push([activeItems[i], activeItems[i + 1]]);
  }

  return (
    <section className="w-full mt-10 md:mt-24 px-4 sm:px-6 md:px-0">
      {/* ===================================================================== */}
      {/* VERSÃO MOBILE: FUNDO CINZA #F7F7F7 COM BALÕES BRANCOS (CONFORME FIGMA)  */}
      {/* ===================================================================== */}
      <div className="block md:hidden w-full bg-[#F7F7F7] rounded-[16px] sm:rounded-[20px] p-4 sm:p-6">
        <h2 className="text-[20px] font-heading font-bold text-[#000000] mb-3.5 leading-tight">
          Especificações Técnicas
        </h2>

        {/* Seletor de abas em pílulas compactas se houver mais de uma */}
        {availableTabs.length > 1 && (
          <div className="flex items-center gap-2 mb-3.5 overflow-x-auto no-scrollbar py-1">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-black text-white font-medium shadow-xs"
                    : "bg-white text-[#5D5D5D] hover:text-black border border-[#E5E7EB]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Lista de balões brancos */}
        <div className="flex flex-col gap-2.5 w-full">
          {activeItems.map((item: any, idx: number) => (
            <div
              key={idx}
              className="w-full bg-white rounded-[12px] p-3.5 border border-[#EBEBEB]/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col"
            >
              <span className="text-[11px] font-sans font-semibold text-[#000000] leading-snug">
                {item.Chave}
              </span>
              <span className="text-[11px] font-sans text-[#69736B] mt-0.5 leading-snug">
                {item.Valor}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VERSÃO DESKTOP: 50% TEXTO + 50% TABELA TABEADA COM SLIDER SUAVE      */}
      {/* ===================================================================== */}
      <div
        className={`hidden md:grid ${
          hasLeftContent && hasRightContent
            ? "grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start"
            : "max-w-[1000px] mx-auto"
        }`}
      >
        {/* ===================================================================== */}
        {/* COLUNA ESQUERDA: TÍTULO E TEXTO DESCRITIVO LONGO                     */}
        {/* ===================================================================== */}
        {hasLeftContent && (
          <div className="flex flex-col pr-0 lg:pr-6">
            {title && (
              <h2 className="text-[26px] md:text-[34px] font-heading font-semibold text-[#000000] leading-tight tracking-tight">
                {title}
              </h2>
            )}

            {textParagraphs.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 text-[12px] md:text-[13px] font-sans text-[#565656] leading-relaxed">
                {textParagraphs.map((para: string, pIdx: number) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* COLUNA DIREITA: TABELA DE INFORMAÇÕES TABEADA                        */}
        {/* ===================================================================== */}
        {hasRightContent && (
          <div className="flex flex-col w-full">
            {/* Barra de Abas (somente exibe abas que tenham itens preenchidos) */}
            {availableTabs.length > 1 && (
              <div className="relative flex items-center gap-6 md:gap-8 border-b border-[#E5E7EB] pb-3 mb-4 select-none">
                {/* Linha sublinhada animada que desliza suavemente para os lados */}
                <div
                  className="absolute -bottom-px left-0 h-[2px] bg-[#000000] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
                  style={{
                    transform: `translateX(${indicator.left}px)`,
                    width: `${indicator.width}px`,
                    opacity: indicator.ready ? 1 : 0,
                  }}
                />

                {availableTabs.map((tab, idx) => (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-[13px] md:text-[14px] font-sans transition-colors duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? "font-semibold text-[#000000]"
                        : "text-[#5D5D5D] hover:text-[#000000]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Caso haja apenas 1 aba disponível, exibe apenas seu título como cabeçalho */}
            {availableTabs.length === 1 && (
              <div className="border-b border-[#E5E7EB] pb-3 mb-4">
                <span className="text-[13px] md:text-[14px] font-sans font-semibold text-[#000000]">
                  {availableTabs[0].label}
                </span>
              </div>
            )}

            {/* Linhas Zebradas da Tabela */}
            <div className="flex flex-col w-full divide-y divide-gray-100/40">
              {pairedRows.map((pair, rowIdx) => {
                const [leftItem, rightItem] = pair;
                const isEven = rowIdx % 2 === 1;

                return (
                  <div
                    key={rowIdx}
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-2.5 px-3 rounded-[6px] transition-colors ${
                      isEven ? "bg-[#F7F7F8]" : "bg-white"
                    }`}
                  >
                    {/* Item Esquerdo */}
                    {leftItem && (
                      <div className="flex flex-col">
                        <span className="text-[11px] md:text-[12px] font-sans font-semibold text-[#000000] leading-snug">
                          {leftItem.Chave}
                        </span>
                        <span className="text-[12px] md:text-[13px] font-sans text-[#69736B] mt-0.5 leading-snug">
                          {leftItem.Valor}
                        </span>
                      </div>
                    )}

                    {/* Item Direito */}
                    {rightItem ? (
                      <div className="flex flex-col">
                        <span className="text-[11px] md:text-[12px] font-sans font-semibold text-[#000000] leading-snug">
                          {rightItem.Chave}
                        </span>
                        <span className="text-[12px] md:text-[13px] font-sans text-[#69736B] mt-0.5 leading-snug">
                          {rightItem.Valor}
                        </span>
                      </div>
                    ) : (
                      <div className="hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
