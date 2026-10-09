"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";

interface ProductAccordionProps {
  product: any;
}

export default function ProductAccordion({ product }: ProductAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!product) return null;

  // Imagem em destaque fixa da cadeira cadastrada no Strapi
  const featuredImgUrl =
    getStrapiMedia(product.Foto_fixa_acordeao?.url) ||
    getStrapiMedia(product.Imagem_destaque?.url);

  // Itens cadastrados no Strapi (apenas itens válidos com título e texto)
  const items = (product.Itens_acordeao || []).filter(
    (item: any) => item && item.Titulo?.trim() && item.Texto?.trim()
  );

  const hasImg = Boolean(featuredImgUrl);
  const hasItems = items.length > 0;

  // Se não houver itens nem imagem no Strapi, não renderiza a seção
  if (!hasImg && !hasItems) {
    return null;
  }

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full mt-10 md:mt-28 px-4 sm:px-6 md:px-0">
      {/* Título no mobile (conforme design de referência) */}
      <h2 className="block md:hidden text-[20px] sm:text-[22px] font-heading font-bold text-[#000000] mb-4 leading-tight">
        Componentes em Detalhes
      </h2>

      <div
        className={`w-full ${
          hasImg && hasItems
            ? "flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-16"
            : "max-w-[800px] mx-auto"
        }`}
      >
        {/* ===================================================================== */}
        {/* LADO ESQUERDO: IMAGEM EM DESTAQUE FIXA DA CADEIRA (APENAS DESKTOP)   */}
        {/* ===================================================================== */}
        {hasImg && (
          <div
            className={`hidden md:flex items-center justify-center relative min-h-[380px] sm:min-h-[480px] md:min-h-[580px] lg:min-h-[660px] ${
              hasItems ? "w-full lg:w-1/2" : "w-full"
            }`}
          >
            <div className="relative w-full h-[380px] sm:h-[480px] md:h-[580px] lg:h-[660px] flex items-center justify-center">
              <Image
                src={featuredImgUrl!}
                alt={product.Foto_fixa_acordeao?.alternativeText || product.Nome || "Cadeira em Destaque"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* LADO DIREITO: LISTA DE DROPDOWNS (INFORMAÇÕES EM DROP)               */}
        {/* ===================================================================== */}
        {hasItems && (
          <div className={`flex flex-col border-t border-[#EBEBEB] ${hasImg ? "w-full lg:w-1/2" : "w-full"}`}>
            {items.map((item: any, idx: number) => {
              const isOpen = openIndex === idx;

              return (
                <div key={idx} className="flex flex-col border-b border-[#EBEBEB]">
                  <button
                    type="button"
                    onClick={() => toggleItem(idx)}
                    className="w-full flex items-center justify-between py-3.5 sm:py-4 text-left group cursor-pointer focus:outline-hidden"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`text-[13px] md:text-[14px] font-sans font-semibold transition-colors ${
                        isOpen ? "text-[#000000]" : "text-[#000000] group-hover:text-black"
                      }`}
                    >
                      {item.Titulo}
                    </span>

                    <div
                      className={`transform transition-transform duration-300 flex items-center justify-center w-5 h-5 text-stone-500 group-hover:text-black ${isOpen ? "rotate-180 text-black" : ""
                        }`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {/* Conteúdo expansível do item */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[300px] opacity-100 pb-4" : "max-h-0 opacity-0 pb-0"
                      }`}
                  >
                    <p className="text-[12px] md:text-[13px] font-sans text-[#565656] leading-relaxed pr-4">
                      {item.Texto}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
