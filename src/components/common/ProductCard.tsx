"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";

export interface ProductCardItem {
  id: number | string;
  documentId?: string;
  Nome: string;
  slug: string;
  Subtitulo?: string;
  Preco?: number;
  Preco_promocional?: number;
  Parcelas?: number;
  Ativo?: boolean;
  marca?: { Nome: string };
  categoria?: { id: number | string; documentId?: string; Nome?: string };
  Variacoes?: Array<{
    Nome_cor?: string;
    Preco?: number;
    Preco_promocional?: number;
    Preco_diferenciado?: number;
    Galeria?: any[];
    Miniatura?: any;
  }>;
  Imagem_destaque?: any;
  Foto_mais_vendidos?: any;
}

export default function ProductCard({ product }: { product: ProductCardItem }) {
  const [isHovered, setIsHovered] = useState(false);

  // Lógica de imagens exclusiva das variações (não utiliza Imagem_destaque pois é exclusiva do mega menu):
  // 1ª Foto (padrão): Miniatura da primeira variação, ou 1ª foto da sua galeria
  // 2ª Foto (hover): Próxima foto da galeria da primeira variação
  const firstVariation = product.Variacoes?.[0];
  const miniatura = firstVariation?.Miniatura;
  const galeria = firstVariation?.Galeria || [];

  const img1 =
    miniatura ||
    galeria[0] ||
    product.Foto_mais_vendidos ||
    product.Imagem_destaque ||
    null;

  let img2 = null;
  if (miniatura) {
    // Se a 1ª foto foi a Miniatura, a foto do hover é uma foto diferente da galeria
    img2 =
      galeria.find(
        (g: any) => g?.id !== miniatura?.id && g?.url !== miniatura?.url
      ) ||
      galeria[0] ||
      null;
  } else if (galeria.length > 1) {
    // Se não tem miniatura, a 1ª foto foi galeria[0], então a 2ª foto do hover é galeria[1]
    img2 = galeria[1] || null;
  }

  // Evita duplicar a mesma foto no hover caso sejam idênticas
  if (img2 && img1 && (img2.id === img1.id || img2.url === img1.url)) {
    img2 = null;
  }

  const img1Url = getStrapiMedia(img1?.url);
  const img2Url = getStrapiMedia(img2?.url);

  const brandName = product.marca?.Nome;

  // Lógica de preços das variações (menor preço disponível ou da 1ª variação)
  const prices = (product.Variacoes || [])
    .map((v) => {
      const p = v.Preco_promocional || v.Preco || v.Preco_diferenciado;
      return p && p > 0 ? Number(p) : null;
    })
    .filter((p): p is number => p !== null && p > 0);

  const firstVar = product.Variacoes?.[0];
  const firstVarPrice = firstVar?.Preco_promocional || firstVar?.Preco || firstVar?.Preco_diferenciado;
  const price = prices.length > 0 ? Math.min(...prices) : (firstVarPrice || product.Preco_promocional || product.Preco || 0);

  const regularPrice = firstVar?.Preco || firstVar?.Preco_diferenciado || product.Preco || 0;
  const hasDiscount = regularPrice > 0 && price > 0 && price < regularPrice;

  const isQuoteOnly = !price || price <= 0;
  const parcelas = product.Parcelas || 10;
  const valorParcela = price && parcelas ? price / parcelas : 0;

  // Formata preço em BRL
  const formatPrice = (value: number) =>
    (value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const productHref = `/produto/${product.slug || product.Nome.toLowerCase()}`;

  return (
    <Link
      href={productHref}
      className="flex flex-col h-full bg-white rounded-[16px] md:rounded-[20px] shadow-xs hover:shadow-md transition-all duration-300 group cursor-pointer p-3 md:p-4 pb-4 md:pb-6 border border-[#EDEDED]/80"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagem com hover (crossfade) e border-radius */}
      <div className="relative aspect-square w-full rounded-[12px] md:rounded-[16px] overflow-hidden bg-white flex items-center justify-center">
        {img1Url && (
          <Image
            src={img1Url}
            alt={img1?.alternativeText || product.Nome}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain p-2 transition-opacity duration-500 rounded-[12px] md:rounded-[16px] ${
              isHovered && img2Url ? "opacity-0" : "opacity-100"
            }`}
          />
        )}
        {img2Url && (
          <Image
            src={img2Url}
            alt={`${product.Nome} - vista alternativa`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain p-2 absolute inset-0 transition-opacity duration-500 rounded-[12px] md:rounded-[16px] ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {!img1Url && (
          <div className="w-full h-full flex items-center justify-center text-stone-300 font-sans text-sm">
            {product.Nome}
          </div>
        )}
      </div>

      {/* Linha divisória interna (recuada, não ocupa 100% da largura do card) */}
      <div className="w-full border-t border-[#EDEDED] my-2.5 md:my-4" />

      {/* Informações do produto */}
      <div className="flex flex-col flex-1 gap-1 md:gap-1.5 px-0.5 md:px-1">
        {/* Marca */}
        {brandName && (
          <span className="text-[9px] md:text-[11px] font-sans font-medium uppercase tracking-[0.12em] text-[#888888]">
            {brandName}
          </span>
        )}

        {/* Nome */}
        <h3 className="text-[13px] md:text-[16px] font-heading font-bold text-[#000000] leading-snug line-clamp-1 group-hover:text-black transition-colors">
          {product.Nome}
        </h3>

        {/* Descrição */}
        {product.Subtitulo && (
          <p className="text-[11px] md:text-[13px] font-sans text-[#777777] leading-relaxed line-clamp-2">
            {product.Subtitulo}
          </p>
        )}

        {/* Preço e Parcelas com mt-auto para alinhar horizontalmente todos os cards */}
        <div className="mt-auto pt-2 md:pt-3">
          {isQuoteOnly ? (
            <span className="text-[15px] md:text-[20px] font-heading font-bold text-[#000000] tracking-tight">
              Sob consulta
            </span>
          ) : (
            <>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[16px] md:text-[22px] font-heading font-bold text-[#000000] tracking-tight">
                  {formatPrice(price)}
                </span>
                {hasDiscount && (
                  <span className="text-[11px] md:text-[13px] font-sans text-[#888888] line-through">
                    {formatPrice(regularPrice)}
                  </span>
                )}
              </div>
              {parcelas > 1 && (
                <p className="hidden md:block text-[11px] md:text-[12px] font-sans text-[#888888] mt-0.5">
                  Até {parcelas}x de {formatPrice(valorParcela)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Link Detalhes abaixo do preço com espaçamento constante (Somente Desktop) */}
        <span className="hidden md:inline-flex pt-2 text-[13px] md:text-[14px] font-heading font-semibold text-[#000000] group-hover:text-black transition-colors items-center gap-1.5">
          Detalhes{" "}
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
