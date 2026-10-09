"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";

interface ProductItem {
  id: number | string;
  Nome: string;
  slug: string;
  Subtitulo?: string;
  Altura_recomendada?: string;
  Peso_maximo?: string;
  marca?: {
    Nome: string;
  };
  garantias?: Array<{
    Nome: string;
    Descricao?: string;
  }>;
  Variacoes?: Array<{
    Nome_cor?: string;
    Miniatura?: any;
    Galeria?: any[];
  }>;
  Imagem_destaque?: any;
  Foto_mais_vendidos?: any;
  Ativo?: boolean;
}

export default function BestSellers({
  data,
  products,
}: {
  data?: any;
  products?: ProductItem[];
}) {
  const [activeMobileId, setActiveMobileId] = useState<number | string | null>(null);

  // Usa os produtos vinculados na seção ou a lista de mais vendidos passada (filtrando apenas produtos ativos)
  const rawList = (data?.produtos && data.produtos.length > 0)
    ? data.produtos
    : (products && products.length > 0)
    ? products
    : [];

  const productList = rawList.filter((p: ProductItem) => p.Ativo !== false);

  const title = data?.Titulo || "Mais vendidas";

  if (productList.length === 0) {
    return null;
  }

  // Prepara itens para o carrossel contínuo do mobile (garantindo largura mínima para o loop infinito)
  const baseList =
    productList.length < 4
      ? [...productList, ...productList, ...productList, ...productList]
      : productList;

  const row1Items = baseList;
  const row2Items = [...baseList].reverse();

  return (
    <section className="w-full bg-white py-12 md:py-24 flex flex-col items-center justify-center overflow-hidden">
      {/* Título da Seção (dentro do container padrão de 1600px) */}
      <div className="w-full max-w-[1600px] px-[17px] md:px-8 mb-6 md:mb-10">
        <h2 className="text-[30px] md:text-[40px] font-heading font-medium md:font-semibold text-[#000000] leading-tight">
          {title}
        </h2>
      </div>

      {/* VERSÃO MOBILE: Carrossel animado contínuo em 2 linhas (apenas foto, cima para esquerda, baixo para direita) */}
      <div className="w-full flex md:hidden flex-col gap-0 overflow-hidden select-none">
        <style>{`
          @keyframes scrollRowLeft {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scrollRowRight {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-left {
            display: flex;
            width: max-content;
            animation: scrollRowLeft 22s linear infinite;
            will-change: transform;
          }
          .animate-marquee-right {
            display: flex;
            width: max-content;
            animation: scrollRowRight 22s linear infinite;
            will-change: transform;
          }
          .animate-marquee-left:active,
          .animate-marquee-right:active {
            animation-play-state: paused;
          }
        `}</style>

        {/* Linha 1: Scroll contínuo para a esquerda */}
        <div className="w-full overflow-hidden flex">
          <div className="animate-marquee-left flex flex-nowrap">
            <div className="flex flex-nowrap">
              {row1Items.map((product: ProductItem, idx: number) => (
                <MobileCard key={`r1-a-${product.id}-${idx}`} product={product} />
              ))}
            </div>
            <div className="flex flex-nowrap" aria-hidden="true">
              {row1Items.map((product: ProductItem, idx: number) => (
                <MobileCard key={`r1-b-${product.id}-${idx}`} product={product} />
              ))}
            </div>
          </div>
        </div>

        {/* Linha 2: Scroll contínuo para a direita */}
        <div className="w-full overflow-hidden flex">
          <div className="animate-marquee-right flex flex-nowrap">
            <div className="flex flex-nowrap">
              {row2Items.map((product: ProductItem, idx: number) => (
                <MobileCard key={`r2-a-${product.id}-${idx}`} product={product} />
              ))}
            </div>
            <div className="flex flex-nowrap" aria-hidden="true">
              {row2Items.map((product: ProductItem, idx: number) => (
                <MobileCard key={`r2-b-${product.id}-${idx}`} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VERSÃO DESKTOP: Grade de Produtos em 4 colunas com card de hover */}
      <div className="hidden md:grid w-full max-w-[1920px] grid-cols-2 lg:grid-cols-4 gap-0 rounded-none border-0 shadow-none">
        {productList.map((product: ProductItem) => {
          // Lógica: Sempre pega a primeira imagem da primeira variação (ou fallback para miniatura/imagem destaque)
          const firstVariation = product.Variacoes?.[0];
          const firstImageObj =
            product.Foto_mais_vendidos ||
            firstVariation?.Galeria?.[0] ||
            firstVariation?.Miniatura ||
            product.Imagem_destaque;

          const imageUrl = getStrapiMedia(firstImageObj?.url);
          const isMobileOpen = activeMobileId === product.id;

          const brandName = product.marca?.Nome || "Elements";
          const warrantyText =
            product.garantias?.[0]?.Nome ||
            product.garantias?.[0]?.Descricao;

          return (
            <Link
              key={product.id}
              href={`/produto/${product.slug || product.Nome.toLowerCase().replace(/\s+/g, "-")}`}
              className="group relative w-full aspect-square bg-stone-100 overflow-hidden cursor-pointer select-none rounded-none block"
            >
              {/* Imagem do Produto */}
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={firstImageObj?.alternativeText || product.Nome}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 font-sans text-sm">
                  {product.Nome}
                </div>
              )}

              {/* Card com as informações (sobe de baixo para cima com borda arredondada apenas no topo) */}
              <div
                className={`absolute inset-x-0 bottom-0 w-full p-6 md:p-7 pb-7 rounded-t-[20px] md:rounded-t-[24px] rounded-b-none bg-[#000000]/70 backdrop-blur-md text-white shadow-2xl transition-all duration-500 ease-out flex flex-col justify-between z-20 ${
                  isMobileOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-[110%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                }`}
              >
                {/* Linha superior: Nome do Produto + Marca */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[20px] font-heading font-medium text-white leading-tight">
                      {product.Nome}
                    </h3>
                    {brandName && (
                      <div className="text-right flex-shrink-0 flex items-center">
                        <span className="text-[8px] uppercase tracking-wider text-white/70 font-sans font-medium mr-1.5">
                          MARCA
                        </span>
                        <span className="text-[14px] font-heading font-medium text-white">
                          {brandName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Subtítulo / Descrição rápida */}
                  {product.Subtitulo && (
                    <p className="mt-3 text-[13px] font-sans text-white/90 leading-relaxed line-clamp-2">
                      {product.Subtitulo}
                    </p>
                  )}
                </div>

                {/* Linha inferior: Especificações Técnicas + Botão DETALHES (com mais respiro) */}
                <div className="mt-7 flex items-end justify-between gap-3">
                  <div className="flex flex-col gap-2 text-white">
                    {product.Altura_recomendada && (
                      <div className="text-[14px]">
                        <strong className="font-heading font-bold text-white">Altura recomendada: </strong>
                        <span className="font-heading font-normal text-white/85">{product.Altura_recomendada}</span>
                      </div>
                    )}
                    {product.Peso_maximo && (
                      <div className="text-[14px]">
                        <strong className="font-heading font-bold text-white">Peso máximo: </strong>
                        <span className="font-heading font-normal text-white/85">{product.Peso_maximo}</span>
                      </div>
                    )}
                    {warrantyText && (
                      <div className="text-[14px]">
                        <strong className="font-heading font-bold text-white">Garantia: </strong>
                        <span className="font-heading font-normal text-white/85">{warrantyText}</span>
                      </div>
                    )}
                  </div>

                  {/* Botão DETALHES (estilizado visualmente como botão dentro do card clicável) */}
                  <span
                    className="px-6 py-2.5 rounded-full bg-white text-[#000000] text-[12px] font-sans font-bold tracking-wider group-hover:bg-gray-100 transition-colors uppercase flex-shrink-0 shadow-md"
                  >
                    DETALHES
                  </span>
                </div>
              </div>

            </Link>
          );
        })}
      </div>
    </section>
  );
}

// Card simplificado para o carrossel contínuo mobile (apenas a foto)
function MobileCard({ product }: { product: ProductItem }) {
  const firstVariation = product.Variacoes?.[0];
  const firstImageObj =
    product.Foto_mais_vendidos ||
    firstVariation?.Galeria?.[0] ||
    firstVariation?.Miniatura ||
    product.Imagem_destaque;

  const imageUrl = getStrapiMedia(firstImageObj?.url);

  return (
    <Link
      href={`/produto/${product.slug || product.Nome.toLowerCase()}`}
      className="relative w-[170px] sm:w-[200px] aspect-square bg-stone-100 flex-shrink-0 block overflow-hidden"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={firstImageObj?.alternativeText || product.Nome}
          fill
          sizes="200px"
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-stone-400 font-sans text-xs p-2 text-center">
          {product.Nome}
        </div>
      )}
    </Link>
  );
}
