"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";
import { useProduct } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";

interface ProductCompreJuntoProps {
  product: any;
  activeImageUrl?: string | null;
}

// Formatar moeda brasileira BRL
function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface ComplementaryItem {
  product: any;
  name: string;
  brand: string;
  href: string;
  imageUrl: string | null;
  price: number;
  installments: number;
  isQuoteOnly: boolean;
  variation: any;
}

export default function ProductCompreJunto({ product, activeImageUrl }: ProductCompreJuntoProps) {
  const productCtx = useProduct();
  const cart = useCart();

  if (!product) return null;

  // Lista de produtos complementares vinculados no Strapi (exclui o próprio produto e suporta até 2 complementares, totalizando até 3 produtos no combo)
  const complementaryList: ComplementaryItem[] = useMemo(() => {
    if (!product.produtos_compre_junto || product.produtos_compre_junto.length === 0) {
      return [];
    }

    const filtered = product.produtos_compre_junto
      .filter((p: any) => p && p.id !== product.id)
      .slice(0, 2);

    return filtered.map((p: any) => {
      const name = p.Nome || "Produto";
      const brand = p.marca?.Nome || product.marca?.Nome || "Elements";
      const href = `/produto/${p.slug || p.Nome?.toLowerCase().replace(/\s+/g, "_")}`;

      // 1. Extração da imagem (prioriza primeira variação [0])
      let imageUrl: string | null = null;
      const firstVar = p.Variacoes?.[0];
      if (firstVar) {
        if (firstVar.Galeria && firstVar.Galeria.length > 0 && firstVar.Galeria[0]?.url) {
          imageUrl = getStrapiMedia(firstVar.Galeria[0].url);
        } else if (firstVar.Miniatura?.url) {
          imageUrl = getStrapiMedia(firstVar.Miniatura.url);
        }
      }
      if (!imageUrl && p.Variacoes && p.Variacoes.length > 0) {
        for (const v of p.Variacoes) {
          if (v.Galeria && v.Galeria.length > 0 && v.Galeria[0]?.url) {
            imageUrl = getStrapiMedia(v.Galeria[0].url);
            break;
          }
          if (v.Miniatura?.url) {
            imageUrl = getStrapiMedia(v.Miniatura.url);
            break;
          }
        }
      }
      if (!imageUrl && p.Foto_mais_vendidos?.url) {
        imageUrl = getStrapiMedia(p.Foto_mais_vendidos.url);
      }
      if (!imageUrl && p.Imagem_destaque?.url) {
        imageUrl = getStrapiMedia(p.Imagem_destaque.url);
      }

      // 2. Extração de preço
      let price = 0;
      if (firstVar?.Preco_promocional && firstVar.Preco_promocional > 0) {
        price = firstVar.Preco_promocional;
      } else if (firstVar?.Preco && firstVar.Preco > 0) {
        price = firstVar.Preco;
      } else if (firstVar?.Preco_diferenciado && firstVar.Preco_diferenciado > 0) {
        price = firstVar.Preco_diferenciado;
      } else if (p.Preco_promocional && p.Preco_promocional > 0) {
        price = p.Preco_promocional;
      } else {
        price = p.Preco || 0;
      }

      const installments = p.Parcelas || 10;
      const isQuoteOnly = !price || price <= 0;

      return {
        product: p,
        name,
        brand,
        href,
        imageUrl,
        price,
        installments,
        isQuoteOnly,
        variation: firstVar,
      };
    });
  }, [product.produtos_compre_junto, product.id, product.marca?.Nome]);

  // Se não houver produtos complementares vinculados no Strapi, não renderiza a seção
  if (complementaryList.length === 0) {
    return null;
  }

  // Imagem do produto principal (sincronizada dinamicamente com a variação/foto ativa no Hero)
  const productMainImg = useMemo(() => {
    if (productCtx?.activeGalleryImageUrl) return productCtx.activeGalleryImageUrl;
    if (productCtx?.activeVariationPhotoUrl) return productCtx.activeVariationPhotoUrl;
    if (activeImageUrl) return activeImageUrl;

    const firstVar = product.Variacoes?.[0];
    if (firstVar) {
      if (firstVar.Galeria && firstVar.Galeria.length > 0 && firstVar.Galeria[0]?.url) {
        return getStrapiMedia(firstVar.Galeria[0].url);
      }
      if (firstVar.Miniatura?.url) {
        return getStrapiMedia(firstVar.Miniatura.url);
      }
    }

    if (product.Variacoes && product.Variacoes.length > 0) {
      for (const v of product.Variacoes) {
        if (v.Galeria && v.Galeria.length > 0 && v.Galeria[0]?.url) return getStrapiMedia(v.Galeria[0].url);
        if (v.Miniatura?.url) return getStrapiMedia(v.Miniatura.url);
      }
    }
    if (product.Foto_mais_vendidos?.url) {
      return getStrapiMedia(product.Foto_mais_vendidos.url);
    }
    if (product.Imagem_destaque?.url) {
      return getStrapiMedia(product.Imagem_destaque.url);
    }
    return null;
  }, [product, activeImageUrl, productCtx?.activeGalleryImageUrl, productCtx?.activeVariationPhotoUrl]);

  // Preço do produto principal (sincronizado com o Hero: variação > promo válido > normal)
  const productMainPrice = useMemo(() => {
    if (productCtx?.selectedPrice && productCtx.selectedPrice > 0) {
      return productCtx.selectedPrice;
    }
    const firstVar = product.Variacoes && product.Variacoes.length > 0 ? product.Variacoes[0] : null;
    if (firstVar?.Preco_promocional && firstVar.Preco_promocional > 0) {
      return firstVar.Preco_promocional;
    }
    if (firstVar?.Preco && firstVar.Preco > 0) {
      return firstVar.Preco;
    }
    if (firstVar?.Preco_diferenciado && firstVar.Preco_diferenciado > 0) {
      return firstVar.Preco_diferenciado;
    }
    if (product.Preco_promocional && product.Preco_promocional > 0 && (!product.Preco || product.Preco_promocional <= product.Preco)) {
      return product.Preco_promocional;
    }
    return product.Preco || product.Preco_promocional || 0;
  }, [product, productCtx?.selectedPrice]);

  const isMainQuoteOnly = !productMainPrice || productMainPrice <= 0;
  const isBundleQuoteOnly = isMainQuoteOnly || complementaryList.some((c) => c.isQuoteOnly);
  const productMainInstallments = product.Parcelas || 10;

  // Total do combo (soma produto principal + todos os complementares)
  const bundleTotalOriginal = productMainPrice + complementaryList.reduce((acc, c) => acc + c.price, 0);
  const bundleDiscountPercent = 0;
  const bundleComboPrice = bundleDiscountPercent > 0
    ? bundleTotalOriginal * (1 - bundleDiscountPercent / 100)
    : bundleTotalOriginal;

  const handleBundleQuote = () => {
    const allNames = [product.Nome, ...complementaryList.map((c) => c.name)].join(" + ");
    const msg = `Olá! Gostaria de solicitar um orçamento para o combo: ${allNames}.`;
    const whatsappUrl = `https://wa.me/554530550000?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddBundleToCart = () => {
    // 1. Adiciona o produto principal
    const mainVariation = product.Variacoes?.[0];
    cart.addItem({
      id: `${product.id}-${mainVariation?.Nome_cor || "default"}-0`,
      productId: product.id,
      name: product.Nome,
      slug: product.slug || product.Nome.toLowerCase(),
      variationName: mainVariation?.Nome_cor || "Padrão",
      price: productMainPrice,
      isQuoteOnly: isMainQuoteOnly,
      imageUrl: productMainImg,
      quantity: 1,
    });

    // 2. Adiciona cada produto complementar
    complementaryList.forEach((comp) => {
      cart.addItem({
        id: `${comp.product.id}-${comp.variation?.Nome_cor || "default"}-0`,
        productId: comp.product.id,
        name: comp.name,
        slug: comp.product.slug || comp.product.Nome.toLowerCase(),
        variationName: comp.variation?.Nome_cor || "Padrão",
        price: comp.price,
        isQuoteOnly: comp.isQuoteOnly,
        imageUrl: comp.imageUrl,
        quantity: 1,
      });
    });
  };

  // Ajuste dinâmico de largura dos cards se houver 3 produtos no total (1 principal + 2 complementares)
  const isThreeProducts = complementaryList.length >= 2;
  const cardWidthClass = isThreeProducts
    ? "w-[210px] sm:w-[230px] md:w-[245px] xl:w-[275px]"
    : "w-[280px] md:w-[310px] lg:w-[330px] xl:w-[350px]";
  const cardMinHeightClass = isThreeProducts
    ? "min-h-[370px] md:min-h-[410px]"
    : "min-h-[400px] md:min-h-[440px]";
  const imageHeightClass = isThreeProducts
    ? "h-[175px] md:h-[210px]"
    : "h-[220px] md:h-[250px]";

  return (
    <section className="w-full mt-10 md:mt-24 px-4 sm:px-6 md:px-0">
      {/* ========================================================================= */}
      {/* VERSÃO DESKTOP: CONTAINER CINZA COM CARDS DE PRODUTO, SÍMBOLOS + E =       */}
      {/* ========================================================================= */}
      <div className="hidden md:block w-full bg-[#F7F7F8] border border-[#EBEBEB] rounded-[15px] p-6 sm:p-8 md:p-8 lg:p-10 xl:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-start gap-6 lg:gap-8 xl:gap-10">

          {/* Lado Esquerdo: Cards dos produtos separados por + e = */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-4 xl:gap-5 shrink-0 overflow-x-auto no-scrollbar max-w-full pb-2 lg:pb-0">

            {/* Card 1: Produto Principal */}
            <div className={`${cardWidthClass} bg-white rounded-[16px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-xs border border-gray-100 flex flex-col justify-between ${cardMinHeightClass} shrink-0`}>
              <div className={`relative w-full ${imageHeightClass} flex items-center justify-center p-2`}>
                {productMainImg ? (
                  <Image
                    src={productMainImg}
                    alt={product.Nome}
                    fill
                    className="object-contain p-2"
                    sizes="350px"
                  />
                ) : (
                  <div className="text-gray-300 font-sans text-xs">Sem imagem</div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col">
                <span className="text-[10px] md:text-[11px] font-sans font-semibold uppercase tracking-wider text-[#69736B]">
                  {product.marca?.Nome || "Elements"}
                </span>
                <h3 className="text-[13px] md:text-[14px] font-sans font-medium text-[#000000] mt-1 line-clamp-1" title={product.Nome}>
                  {product.Nome}
                </h3>
                <div className="mt-2 flex flex-col">
                  {isMainQuoteOnly ? (
                    <span className="text-[16px] md:text-[19px] font-heading font-bold text-[#000000]">
                      Sob consulta
                    </span>
                  ) : (
                    <>
                      <span className="text-[16px] md:text-[19px] font-heading font-bold text-[#000000]">
                        {formatBRL(productMainPrice)}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-sans text-[#69736B] mt-0.5">
                        Até {productMainInstallments}x de {formatBRL(productMainPrice / productMainInstallments)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Cards dos Produtos Complementares vinculados no Strapi */}
            {complementaryList.map((comp, idx) => (
              <React.Fragment key={comp.product.id || idx}>
                {/* Símbolo + */}
                <span className="text-[26px] md:text-[32px] font-light text-[#000000] select-none shrink-0 px-0.5 sm:px-1">
                  +
                </span>

                {/* Card Complementar */}
                <Link
                  href={comp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardWidthClass} bg-white rounded-[16px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-xs border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between ${cardMinHeightClass} shrink-0 group cursor-pointer`}
                >
                  <div className={`relative w-full ${imageHeightClass} flex items-center justify-center p-2`}>
                    {comp.imageUrl ? (
                      <Image
                        src={comp.imageUrl}
                        alt={comp.name}
                        fill
                        className="object-contain p-2"
                        sizes="350px"
                      />
                    ) : (
                      <div className="text-gray-300 font-sans text-xs">Sem imagem</div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col">
                    <span className="text-[10px] md:text-[11px] font-sans font-semibold uppercase tracking-wider text-[#69736B]">
                      {comp.brand}
                    </span>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <h3 className="text-[13px] md:text-[14px] font-sans font-medium text-[#000000] line-clamp-1 group-hover:underline" title={comp.name}>
                        {comp.name}
                      </h3>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400 group-hover:text-black transition-colors">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </div>
                    <div className="mt-2 flex flex-col">
                      {comp.isQuoteOnly ? (
                        <span className="text-[16px] md:text-[19px] font-heading font-bold text-[#000000]">
                          Sob consulta
                        </span>
                      ) : (
                        <>
                          <span className="text-[16px] md:text-[19px] font-heading font-bold text-[#000000]">
                            {formatBRL(comp.price)}
                          </span>
                          <span className="text-[10px] md:text-[11px] font-sans text-[#69736B] mt-0.5">
                            Até {comp.installments}x de {formatBRL(comp.price / comp.installments)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </React.Fragment>
            ))}

            {/* Símbolo = */}
            <span className="text-[26px] md:text-[32px] font-light text-[#000000] select-none shrink-0 px-0.5 sm:px-1">
              =
            </span>

          </div>

          {/* Lado Direito: Resumo da Oferta e Ação de Compra */}
          <div className="flex flex-col justify-center items-start text-left max-w-[340px] pl-0 lg:pl-2 shrink-0">
            <h2 className="text-[20px] md:text-[24px] font-heading font-semibold text-[#000000] leading-tight">
              Compre junto
            </h2>
            <p className="text-[12px] md:text-[13px] font-sans text-[#69736B] mt-1 leading-snug">
              Garanta desconto comprando um conjunto de produtos
            </p>

            {/* Lista dos Itens com bullets */}
            <ul className="mt-3.5 space-y-1.5 text-[12px] md:text-[13px] font-sans text-[#000000]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
                <span className="line-clamp-1 leading-tight">1x {product.Nome}</span>
              </li>
              {complementaryList.map((comp, idx) => (
                <li key={comp.product.id || idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
                  <Link
                    href={comp.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-1 leading-tight underline hover:text-black font-medium transition-colors inline-flex items-center gap-1"
                  >
                    1x {comp.name}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Preço do Combo */}
            <div className="mt-2 flex flex-col items-start">
              {isBundleQuoteOnly ? (
                <span className="text-[24px] md:text-[28px] font-heading font-bold text-[#000000] leading-none mt-1">
                  Sob consulta
                </span>
              ) : (
                <>
                  {bundleDiscountPercent > 0 && (
                    <span className="text-[13px] font-sans line-through text-stone-400 leading-none">
                      {formatBRL(bundleTotalOriginal)}
                    </span>
                  )}
                  <span className="text-[24px] md:text-[28px] font-heading font-bold text-[#000000] leading-none mt-1">
                    {formatBRL(bundleComboPrice)}
                  </span>
                </>
              )}
            </div>

            {/* Botão Adicionar Combo / Orçamento */}
            {isBundleQuoteOnly ? (
              <button
                type="button"
                onClick={handleBundleQuote}
                className="mt-4 py-3 px-6 rounded-full bg-[#222222] hover:bg-[#000000] text-white text-[13px] font-sans font-medium transition-all duration-200 active:scale-[0.99] shadow-xs cursor-pointer text-center"
              >
                Solicitar orçamento do combo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddBundleToCart}
                className="mt-4 py-3 px-6 rounded-full bg-[#222222] hover:bg-[#000000] text-white text-[13px] font-sans font-medium transition-all duration-200 active:scale-[0.99] shadow-xs cursor-pointer text-center"
              >
                Adicionar combo ao carrinho
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* VERSÃO MOBILE: RESUMO DIRETO LIMPO NO FUNDO BRANCO CONFORME DESIGN REFERÊNCIA */}
      {/* ========================================================================= */}
      <div className="block md:hidden flex-col w-full">
        <h2 className="text-[20px] font-heading font-bold text-[#000000] leading-tight">
          Compre junto
        </h2>
        <p className="text-[12px] font-sans text-[#69736B] mt-1 leading-snug">
          Garanta desconto exclusivo comprando o conjunto
        </p>

        <ul className="mt-3 space-y-1.5 text-[12px] font-sans text-[#000000]">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
            <span className="leading-tight">1x {product.Nome}</span>
          </li>
          {complementaryList.map((comp, idx) => (
            <li key={comp.product.id || idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
              <Link
                href={comp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="leading-tight underline hover:text-black font-medium transition-colors inline-flex items-center gap-1"
              >
                1x {comp.name}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-2.5 flex items-baseline gap-2.5">
          {isBundleQuoteOnly ? (
            <span className="text-[22px] font-heading font-bold text-[#000000] leading-none">
              Sob consulta
            </span>
          ) : (
            <>
              {bundleDiscountPercent > 0 && (
                <span className="text-[13px] font-sans line-through text-stone-400">
                  {formatBRL(bundleTotalOriginal)}
                </span>
              )}
              <span className="text-[22px] font-heading font-bold text-[#000000] leading-none">
                {formatBRL(bundleComboPrice)}
              </span>
            </>
          )}
        </div>

        {isBundleQuoteOnly ? (
          <button
            type="button"
            onClick={handleBundleQuote}
            className="mt-3.5 w-full py-3 px-6 rounded-full bg-[#000000] hover:bg-neutral-800 text-white text-[13px] font-sans font-medium transition-all duration-200 active:scale-[0.99] shadow-xs cursor-pointer text-center"
          >
            Solicitar orçamento do combo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddBundleToCart}
            className="mt-3.5 w-full py-3 px-6 rounded-full bg-[#000000] hover:bg-neutral-800 text-white text-[13px] font-sans font-medium transition-all duration-200 active:scale-[0.99] shadow-xs cursor-pointer text-center"
          >
            Adicionar combo ao carrinho
          </button>
        )}
      </div>
    </section>
  );
}
