"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";
import { useProduct } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";

interface MediaItem {
  id: number;
  url: string;
  alternativeText?: string;
  formats?: any;
  width?: number;
  height?: number;
}

interface Variation {
  id?: number;
  Nome_cor: string;
  Cor_hex?: string;
  Miniatura?: MediaItem;
  Galeria?: MediaItem[];
  Preco?: number;
  Preco_promocional?: number | null;
  Preco_diferenciado?: number;
  Estoque?: number;
}

interface Warranty {
  id: number;
  Nome: string;
  Descricao?: string;
  Preco_adicional?: number;
}

interface ProductHeroProps {
  product: {
    id: number;
    Nome: string;
    slug: string;
    Subtitulo?: string;
    Preco?: number;
    Preco_promocional?: number | null;
    Estoque?: number;
    Parcelas?: number | null;
    Imagem_destaque?: MediaItem;
    Variacoes?: Variation[];
    garantias?: Warranty[];
    categoria?: {
      Nome: string;
      slug: string;
    };
    marca?: {
      Nome: string;
      slug: string;
    };
    produtos_compre_junto?: Array<{
      id: number;
      Nome: string;
      slug: string;
      Preco: number;
      Preco_promocional?: number | null;
      Parcelas?: number | null;
      marca?: {
        Nome: string;
        slug?: string;
      };
      Imagem_destaque?: MediaItem;
      Foto_mais_vendidos?: MediaItem;
      Variacoes?: Variation[];
    }>;
  };
}

function normalizeHex(hex?: string): string {
  if (!hex) return "#1F2937";
  const clean = hex.trim();
  if (clean.startsWith("#")) {
    if (clean.length === 5) return clean.slice(0, 4);
    return clean;
  }
  return `#${clean}`;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductHero({ product }: ProductHeroProps) {
  const variations = product.Variacoes || [];
  const productCtx = useProduct();
  const [internalVariationIndex, setInternalVariationIndex] = useState(0);

  const selectedVariationIndex = productCtx ? productCtx.selectedVariationIndex : internalVariationIndex;
  const setSelectedVariationIndex = productCtx ? productCtx.setSelectedVariationIndex : setInternalVariationIndex;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Garantia padrão inclusa + garantias estendidas do Strapi
  // selectedWarrantyId === 0 representa a "Garantia padrão"
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number>(0);

  // Quantidade
  const [quantity, setQuantity] = useState(1);

  // Zoom interativo na foto ao clicar
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // No mobile, desabilita totalmente o zoom para permitir navegação deslizante livre
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    if (!activeImageUrl) return;
    if (!isZoomed) {
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setZoomPos({ x, y });
      }
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    if (!isZoomed || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  const handleMouseLeave = () => {
    if (isZoomed) {
      setIsZoomed(false);
    }
  };

  // Barra de compra rápida flutuante (abre no scroll ao passar da metade da foto)
  const [isFloatingBarOpen, setIsFloatingBarOpen] = useState(false);
  const manualCloseScrollY = useRef<number | null>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroSectionRef.current || !imageContainerRef.current) return;

      const sectionRect = heroSectionRef.current.getBoundingClientRect();
      const photoHeight = imageContainerRef.current.offsetHeight || 600;

      // Dispara a abertura quando a rolagem passa da metade da foto do produto
      const passedHalfPhoto = -sectionRect.top + 140 >= photoHeight / 2;

      if (passedHalfPhoto) {
        if (manualCloseScrollY.current === null) {
          setIsFloatingBarOpen(true);
        }
      } else {
        // Usuário retornou para o topo da página (antes da metade da foto)
        manualCloseScrollY.current = null;
        setIsFloatingBarOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Variação ativa atual
  const currentVariation = variations[selectedVariationIndex];

  // Imagens da galeria para a variação ativa (foto da cor ativa + fotos de ambiente/detalhes)
  const currentGallery: MediaItem[] = useMemo(() => {
    const varPhotos = currentVariation?.Galeria && currentVariation.Galeria.length > 0
      ? currentVariation.Galeria
      : currentVariation?.Miniatura ? [currentVariation.Miniatura] : [];

    const otherPhotos: MediaItem[] = [];
    for (const v of variations) {
      if (v === currentVariation) continue;
      if (v.Galeria && v.Galeria.length > 0) {
        for (const img of v.Galeria) {
          if (!varPhotos.some((vp) => vp.url === img.url) && !otherPhotos.some((op) => op.url === img.url)) {
            otherPhotos.push(img);
          }
        }
      }
    }

    const combined = [...varPhotos, ...otherPhotos];
    if (combined.length > 0) return combined;

    if (product.Imagem_destaque) return [product.Imagem_destaque];
    return [];
  }, [currentVariation, variations, product.Imagem_destaque]);

  // Imagem ativa atualmente na tela
  const activeImage = currentGallery[activeImageIndex] || currentGallery[0];
  const activeImageUrl = activeImage ? getStrapiMedia(activeImage.url) : null;

  // Sincroniza a imagem ativa com o contexto global do produto (para Compre Junto, etc.)
  useEffect(() => {
    if (productCtx && activeImageUrl) {
      productCtx.setActiveGalleryImageUrl(activeImageUrl);
    }
  }, [productCtx, activeImageUrl]);

  // Navegação da galeria
  const handlePrevImage = () => {
    setIsZoomed(false);
    if (currentGallery.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? currentGallery.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setIsZoomed(false);
    if (currentGallery.length <= 1) return;
    setActiveImageIndex((prev) => (prev === currentGallery.length - 1 ? 0 : prev + 1));
  };

  // Suporte a swipe/deslizamento no mobile
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Se o deslizamento horizontal for maior que o vertical e tiver pelo menos 30px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (diffX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleSelectVariation = (index: number) => {
    setIsZoomed(false);
    setSelectedVariationIndex(index);
    setActiveImageIndex(0); // Reseta a imagem para a primeira foto da cor escolhida
  };

  // Preço base e regular (prioriza variação selecionada)
  const basePrice = useMemo(() => {
    if (currentVariation?.Preco_promocional && currentVariation.Preco_promocional > 0) {
      return currentVariation.Preco_promocional;
    }
    if (currentVariation?.Preco && currentVariation.Preco > 0) {
      return currentVariation.Preco;
    }
    if (currentVariation?.Preco_diferenciado && currentVariation.Preco_diferenciado > 0) {
      return currentVariation.Preco_diferenciado;
    }
    if (product.Preco_promocional && product.Preco_promocional > 0) {
      return product.Preco_promocional;
    }
    return product.Preco || 0;
  }, [currentVariation, product]);

  const regularPrice = useMemo(() => {
    if (currentVariation?.Preco && currentVariation.Preco > 0) {
      return currentVariation.Preco;
    }
    if (currentVariation?.Preco_diferenciado && currentVariation.Preco_diferenciado > 0) {
      return currentVariation.Preco_diferenciado;
    }
    return product.Preco || 0;
  }, [currentVariation, product]);

  const hasDiscount = regularPrice > 0 && basePrice > 0 && basePrice < regularPrice;

  const isQuoteOnly = !basePrice || basePrice <= 0;

  const cart = useCart();

  const handleQuoteRequest = () => {
    const corName = currentVariation?.Nome_cor;
    const msg = `Olá! Gostaria de solicitar um orçamento para o produto: ${product.Nome}${corName ? ` (Cor: ${corName})` : ""} - Qtd: ${quantity}.`;
    const whatsappUrl = `https://wa.me/554530550000?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddToCart = () => {
    const thumbUrl = currentVariation?.Miniatura
      ? getStrapiMedia(currentVariation.Miniatura.url)
      : currentVariation?.Galeria && currentVariation.Galeria[0]
      ? getStrapiMedia(currentVariation.Galeria[0].url)
      : activeImageUrl;

    const selectedWarranty = product.garantias?.find((g: any) => g.id === selectedWarrantyId);

    cart.addItem({
      id: `${product.id}-${currentVariation?.Nome_cor || "default"}-${selectedWarrantyId || 0}`,
      productId: product.id,
      name: product.Nome,
      slug: product.slug || product.Nome.toLowerCase(),
      variationName: currentVariation?.Nome_cor || "Padrão",
      warrantyName: selectedWarranty?.Nome,
      price: unitTotalPrice,
      isQuoteOnly: isQuoteOnly,
      imageUrl: thumbUrl || null,
      quantity: quantity,
    });
  };

  // Preço adicional da garantia selecionada
  const warrantyAdditionalPrice = useMemo(() => {
    if (selectedWarrantyId === 0) return 0;
    const found = product.garantias?.find((g) => g.id === selectedWarrantyId);
    return found?.Preco_adicional || 0;
  }, [selectedWarrantyId, product.garantias]);

  const unitTotalPrice = basePrice + warrantyAdditionalPrice;
  const unitRegularPrice = regularPrice + warrantyAdditionalPrice;

  // Lista de garantias: Padrão + Strapi
  const warrantyList = [
    {
      id: 0,
      Nome: "Garantia padrão",
      Descricao: "",
      Preco_adicional: 0,
    },
    ...(product.garantias || []),
  ];

  return (
    <section ref={heroSectionRef} className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_560px] xl:grid-cols-[minmax(0,1fr)_600px] gap-8 lg:gap-10 xl:gap-[50px] items-start">
        
        {/* ========================================================================= */}
        {/* LADO ESQUERDO: GALERIA DE IMAGENS DO PRODUTO COM ZOOM NO CLIQUE           */}
        {/* ========================================================================= */}
        <div className="relative w-full lg:sticky lg:top-36 flex flex-col items-center md:items-start justify-start">
          {/* Container amplo para a cadeira ocupar 100% da largura da tela no mobile */}
          <div
            ref={imageContainerRef}
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => {
              touchStartX.current = null;
              touchStartY.current = null;
            }}
            style={{
              aspectRatio:
                activeImage?.width && activeImage?.height
                  ? `${activeImage.width} / ${activeImage.height}`
                  : "1 / 1",
            }}
            className={`group relative w-full aspect-square max-w-[950px] max-h-[950px] flex items-center justify-center select-none self-start touch-pan-y ${
              activeImageUrl ? (isZoomed ? "md:cursor-zoom-out" : "md:cursor-zoom-in") : ""
            }`}
          >
            {activeImageUrl ? (
              <div className="relative w-full h-full overflow-hidden rounded-none md:rounded-[26px] flex items-center justify-center bg-white">
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out will-change-transform"
                  style={{
                    transform: isZoomed ? "scale(2.2)" : "scale(1)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  }}
                >
                  <Image
                    src={activeImageUrl}
                    alt={product.Nome}
                    fill
                    priority
                    draggable={false}
                    className="object-contain select-none pointer-events-none transition-transform"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 1000px"
                    quality={95}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span className="text-xs font-sans">Sem imagem cadastrada</span>
              </div>
            )}

            {/* Setas de navegação (Previous / Next) - Apenas Desktop */}
            {currentGallery.length > 1 && (
              <div
                className={`hidden md:block transition-opacity duration-200 ${
                  isZoomed ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  aria-label="Imagem anterior"
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#D1D5DB] bg-white flex items-center justify-center text-stone-600 hover:text-black hover:border-black transition-all z-20 cursor-pointer shadow-xs hover:scale-105"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="Próxima imagem"
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#D1D5DB] bg-white flex items-center justify-center text-stone-600 hover:text-black hover:border-black transition-all z-20 cursor-pointer shadow-xs hover:scale-105"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Indicador discreto de zoom no canto inferior (Apenas Desktop) */}
            {activeImageUrl && (
              <div
                className={`hidden md:flex absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] font-sans items-center gap-1.5 pointer-events-none transition-opacity duration-300 shadow-md ${
                  isZoomed ? "opacity-90" : "opacity-0 group-hover:opacity-80"
                }`}
              >
                {isZoomed ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>Clique para fechar zoom</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>Clique para ampliar</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dots de navegação da galeria (Apenas Mobile) */}
          {currentGallery.length > 1 && (
            <div className="flex md:hidden items-center justify-center gap-2 mt-3.5 select-none">
              {currentGallery.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(false);
                    setActiveImageIndex(dotIdx);
                  }}
                  aria-label={`Ver foto ${dotIdx + 1} de ${currentGallery.length}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    dotIdx === activeImageIndex
                      ? "w-2 h-2 bg-[#000000]"
                      : "w-2 h-2 bg-[#D1D5DB] hover:bg-stone-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* LADO DIREITO: INFOS, SELETOR DE COR, GARANTIA E AÇÕES DE COMPRA          */}
        {/* ========================================================================= */}
        <div className="w-full max-w-[600px] flex flex-col justify-start px-4 sm:px-6 md:px-0">
          
          {/* Título do Produto */}
          <h1 className="text-[26px] md:text-[32px] font-heading font-semibold text-[#000000] leading-tight tracking-tight">
            {product.Nome}
          </h1>

          {/* Subtítulo / Descrição Curta */}
          {product.Subtitulo && (
            <p className="mt-2 text-[12px] md:text-[13px] font-sans text-[#69736B] leading-relaxed">
              {product.Subtitulo}
            </p>
          )}

          {/* Preço e Parcelamento (Apenas Mobile - no Desktop fica no bloco de compra inferior) */}
          <div className="mt-4 flex flex-col md:hidden">
            {isQuoteOnly ? (
              <span className="text-[24px] md:text-[28px] font-heading font-bold text-[#000000] leading-none">
                Sob consulta
              </span>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] md:text-[30px] font-heading font-bold text-[#000000] leading-none">
                    {formatBRL(unitTotalPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[14px] md:text-[15px] font-sans text-[#69736B] line-through">
                      {formatBRL(unitRegularPrice)}
                    </span>
                  )}
                </div>
                <span className="text-[12px] md:text-[13px] font-sans text-[#69736B] mt-1.5">
                  Até {product.Parcelas || 10}x sem juros no cartão
                </span>
              </>
            )}
          </div>

          {/* Borda 100% (Apenas Mobile) */}
          <div className="w-auto -mx-4 sm:-mx-6 border-b border-[#E5E7EB] my-5 md:hidden" />

          {/* ----------------------------------------------------------------------- */}
          {/* SELEÇÃO DE COR                                                          */}
          {/* ----------------------------------------------------------------------- */}
          {variations.length > 0 && (
            <>
              <div className="mt-5 md:mt-7 flex flex-col">
                <h2 className="text-[14px] md:text-[15px] font-heading font-semibold text-[#000000]">
                  Escolha a cor
                </h2>
                <p className="text-[12px] font-sans text-[#69736B] mt-0.5">
                  Encontre a cor que mais combina com seu ambiente
                </p>

                {/* Lista de cards de cores */}
                <div className="mt-3 flex flex-col gap-2.5">
                  {variations.map((v, idx) => {
                    const isSelected = idx === selectedVariationIndex;
                    const thumbUrl = v.Miniatura
                      ? getStrapiMedia(v.Miniatura.url)
                      : v.Galeria && v.Galeria[0]
                      ? getStrapiMedia(v.Galeria[0].url)
                      : null;
                    const dotColor = normalizeHex(v.Cor_hex);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectVariation(idx)}
                        className={`w-full px-4 py-2.5 md:py-3 rounded-[6px] border text-left transition-all flex items-center justify-between group cursor-pointer ${
                          isSelected
                            ? "border-[#000000] bg-white shadow-xs"
                            : "border-[#D1D5DB] bg-white hover:border-[#9CA3AF]"
                        }`}
                      >
                        {/* Lado esquerdo: Bolinha de cor + Thumbnail + Nome */}
                        <div className="flex items-center gap-3">
                          {/* Bolinha com a cor exata */}
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: dotColor }}
                            aria-hidden="true"
                          />

                          {/* Thumbnail miniatura da cadeira (sem moldura quadrada cinza) */}
                          <div className="relative w-8 h-8 md:w-9 md:h-9 shrink-0 flex items-center justify-center">
                            {thumbUrl ? (
                              <Image
                                src={thumbUrl}
                                alt={v.Nome_cor}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-xs" />
                            )}
                          </div>

                          {/* Nome da cor */}
                          <span className="text-[13px] md:text-[14px] font-sans font-medium text-[#000000]">
                            {v.Nome_cor}
                          </span>
                        </div>

                        {/* Lado direito: Radio button circular */}
                        <div className="shrink-0 flex items-center justify-center">
                          {isSelected ? (
                            <div className="w-[18px] h-[18px] rounded-full bg-[#000000] flex items-center justify-center text-white">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-[18px] h-[18px] rounded-full border border-[#D1D5DB] group-hover:border-gray-400 transition-colors" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Borda 100% (Apenas Mobile) */}
              <div className="w-auto -mx-4 sm:-mx-6 border-b border-[#E5E7EB] my-5 md:hidden" />
            </>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* SELEÇÃO DE GARANTIA (EXIBIDA APENAS SE HOUVER GARANTIAS NO STRAPI)      */}
          {/* ----------------------------------------------------------------------- */}
          {product.garantias && product.garantias.length > 0 && (
            <>
              <div className="mt-5 md:mt-6 flex flex-col">
                <h2 className="text-[14px] md:text-[15px] font-heading font-semibold text-[#000000]">
                  Garantia
                </h2>
                <p className="text-[12px] font-sans text-[#69736B] mt-0.5">
                  Garanta qualidade duradoura
                </p>

                <div className="mt-3 flex flex-col gap-2.5">
                  {warrantyList.map((item) => {
                    const isSelected = item.id === selectedWarrantyId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedWarrantyId(item.id)}
                        className={`w-full px-4 py-3 rounded-[6px] border text-left transition-all flex items-center justify-between group cursor-pointer ${
                          isSelected
                            ? "border-[#000000] bg-white shadow-xs"
                            : "border-[#D1D5DB] bg-white hover:border-[#9CA3AF]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] md:text-[14px] font-sans font-medium text-[#000000]">
                              {item.Nome}
                            </span>
                            {item.Preco_adicional && item.Preco_adicional > 0 ? (
                              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                                +{formatBRL(item.Preco_adicional)}
                              </span>
                            ) : null}
                          </div>
                          {item.Descricao && (
                            <span className="text-[11px] md:text-[12px] font-sans text-[#69736B] mt-0.5">
                              {item.Descricao}
                            </span>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center justify-center">
                          {isSelected ? (
                            <div className="w-[18px] h-[18px] rounded-full bg-[#000000] flex items-center justify-center text-white">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-[18px] h-[18px] rounded-full border border-[#D1D5DB] group-hover:border-gray-400 transition-colors" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Borda 100% no final da seção (Apenas Mobile) */}
              <div className="w-auto -mx-4 sm:-mx-6 border-b border-[#E5E7EB] mt-5 md:hidden" />
            </>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* BLOCO DE COMPRA (EXIBIDO NO FLUXO NORMAL NO DESKTOP)                    */}
          {/* ----------------------------------------------------------------------- */}
          <div className="hidden md:flex flex-col mt-7 pt-1">
            {isQuoteOnly ? (
              <div className="flex flex-col">
                <span className="text-[22px] font-heading font-bold text-[#000000] leading-none">
                  Sob consulta
                </span>
                <p className="text-[11px] font-sans text-[#69736B] italic mt-1.5 leading-snug">
                  Entre em contato para solicitar um orçamento personalizado deste produto
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-sans text-[#000000]">
                    A partir de
                  </span>
                  <span className="text-[20px] font-heading font-bold text-[#000000] leading-none">
                    {formatBRL(unitTotalPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[13px] font-sans text-[#69736B] line-through">
                      {formatBRL(unitRegularPrice)}
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-sans text-[#69736B] italic mt-1.5 leading-snug">
                  Finalize seu carrinho e nossos atendentes entrarão em contato para realizar sua compra
                </p>
              </>
            )}

            <div className="flex items-center gap-3 mt-4">
              {/* Seletor de quantidade */}
              <div className="flex items-center justify-between border border-[#D1D5DB] rounded-full px-3.5 py-2 w-[110px] bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="text-stone-500 hover:text-black text-[15px] px-1 select-none cursor-pointer"
                >
                  −
                </button>
                <span className="text-[13px] font-sans font-medium text-[#000000]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar quantidade"
                  className="text-stone-500 hover:text-black text-[15px] px-1 select-none cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 px-6 rounded-full bg-[#000000] hover:bg-[#222222] active:scale-[0.99] text-white text-[13px] font-sans font-medium transition-all duration-200 shadow-xs cursor-pointer text-center whitespace-nowrap"
              >
                Adicionar no carrinho
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* BOTÃO FLUTUANTE QUE SE TRANSFORMA NA CÁPSULA (APENAS DESKTOP/TABLET)       */}
      {/* ========================================================================= */}
      <div className="hidden md:flex fixed bottom-6 md:bottom-8 inset-x-0 z-50 pointer-events-none justify-center px-[17px] md:px-8">
        <div className="w-full max-w-[1600px] flex items-center justify-start pointer-events-none">
          <div className="pointer-events-auto">
            {/* Container Unificado que se expande e recolhe suavemente (Morphing) */}
            <div
              className={`relative flex items-center bg-white border border-[#D1D5DB] rounded-full overflow-hidden transition-all duration-600 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                isFloatingBarOpen
                  ? "w-[92vw] sm:w-[500px] md:w-[530px] max-w-[92vw] sm:max-w-[500px] md:max-w-[530px] h-[46px] md:h-[48px] py-1 md:py-1.5 pl-2 md:pl-2.5 pr-1 md:pr-1.5 shadow-xl cursor-default"
                  : "w-11 h-11 md:w-12 md:h-12 max-w-[44px] md:max-w-[48px] p-0 justify-center shadow-lg cursor-pointer hover:scale-105 hover:border-black active:scale-95"
              }`}
              onClick={
                !isFloatingBarOpen
                  ? () => {
                      manualCloseScrollY.current = null;
                      setIsFloatingBarOpen(true);
                    }
                  : undefined
              }
              title={!isFloatingBarOpen ? (isQuoteOnly ? "Solicitar orçamento" : "Ver informações e comprar") : undefined}
            >
              {/* Ícone / Miniatura */}
              <button
                type="button"
                onClick={(e) => {
                  if (isFloatingBarOpen) {
                    e.stopPropagation();
                    manualCloseScrollY.current = window.scrollY;
                    setIsFloatingBarOpen(false);
                  }
                }}
                title={isFloatingBarOpen ? "Recolher para botão" : "Abrir barra de compra rápida"}
                className={`relative shrink-0 flex items-center justify-center rounded-full transition-all duration-600 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isFloatingBarOpen
                    ? "w-7 h-7 md:w-8 md:h-8 hover:bg-gray-100 cursor-pointer mr-2 md:mr-2.5"
                    : "w-11 h-11 md:w-12 md:h-12 pointer-events-none"
                }`}
              >
                {currentVariation?.Miniatura ? (
                  <div className="relative w-6 h-6 md:w-7 md:h-7">
                    <Image
                      src={getStrapiMedia(currentVariation.Miniatura.url) || ""}
                      alt={product.Nome}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
                    <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0Z"/>
                    <path d="M5 18v2"/>
                    <path d="M19 18v2"/>
                  </svg>
                )}
              </button>

              {/* Conteúdo Expandido (Nome, Preço, Quantidade, Adicionar) com transição suave */}
              <div
                className={`flex items-center justify-between gap-2.5 md:gap-3.5 flex-1 min-w-0 transition-opacity duration-200 ease-in-out ${
                  isFloatingBarOpen
                    ? "opacity-100 pointer-events-auto delay-150"
                    : "opacity-0 pointer-events-none delay-0 select-none"
                }`}
                aria-hidden={!isFloatingBarOpen}
              >
                {/* Informações: Nome + Preço */}
                <div className="flex flex-col min-w-0 pr-1 md:pr-2">
                  <span className="text-[12px] md:text-[13px] font-sans font-medium text-[#000000] truncate leading-tight">
                    {product.Nome}
                  </span>
                  {isQuoteOnly ? (
                    <span className="text-[10px] md:text-[11px] font-heading font-semibold text-[#000000] leading-none mt-0.5 whitespace-nowrap">
                      Sob consulta
                    </span>
                  ) : (
                    <span className="text-[10px] md:text-[11px] font-sans text-[#69736B] leading-none mt-0.5 whitespace-nowrap">
                      A partir de <strong className="font-semibold text-[#000000]">{formatBRL(unitTotalPrice)}</strong>
                    </span>
                  )}
                </div>

                {/* Controles: Quantidade + Botão Adicionar */}
                <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
                  {/* Seletor de quantidade */}
                  <div className="flex items-center justify-between border border-[#D1D5DB] rounded-full px-2 py-0.5 md:py-1 w-[72px] md:w-[80px] bg-white shrink-0">
                    <button
                      type="button"
                      tabIndex={isFloatingBarOpen ? 0 : -1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuantity((q) => Math.max(1, q - 1));
                      }}
                      aria-label="Diminuir quantidade"
                      className="text-stone-500 hover:text-black text-[13px] px-1 select-none cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-[11px] md:text-[12px] font-sans font-medium text-[#000000]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      tabIndex={isFloatingBarOpen ? 0 : -1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuantity((q) => q + 1);
                      }}
                      aria-label="Aumentar quantidade"
                      className="text-stone-500 hover:text-black text-[13px] px-1 select-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    tabIndex={isFloatingBarOpen ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart();
                    }}
                    className="py-1.5 md:py-2 px-3.5 md:px-5 rounded-full bg-[#222222] text-white text-[12px] md:text-[13px] font-sans font-medium hover:bg-[#000000] active:scale-[0.99] transition-all duration-200 text-center flex items-center justify-center shrink-0 shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    Adicionar no carrinho
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA FIXA DE PREÇO E COMPRA NO MOBILE (SUBSTITUI A BOLINHA FLUTUANTE)    */}
      {/* ========================================================================= */}
      <div className="block md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#EBEBEB] px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3 max-w-[480px] mx-auto">
          {/* Lado Esquerdo: Preço e Parcelas */}
          <div className="flex flex-col min-w-0">
            {isQuoteOnly ? (
              <>
                <span className="text-[11px] font-sans text-[#69736B] leading-none">
                  Preço
                </span>
                <span className="text-[18px] font-heading font-bold text-[#000000] leading-tight mt-0.5">
                  Sob consulta
                </span>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-[11px] font-sans text-[#69736B]">
                    A partir de
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] font-sans text-[#69736B] line-through">
                      {formatBRL(unitRegularPrice)}
                    </span>
                  )}
                </div>
                <span className="text-[18px] font-heading font-bold text-[#000000] leading-tight mt-0.5">
                  {formatBRL(unitTotalPrice)}
                </span>
                <span className="text-[10px] font-sans text-[#69736B] leading-none mt-0.5">
                  Até {product.Parcelas || 10}x de {formatBRL(unitTotalPrice / (product.Parcelas || 10))}
                </span>
              </>
            )}
          </div>

          {/* Lado Direito: Botão */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="py-3 px-6 rounded-full bg-[#000000] hover:bg-[#222222] active:scale-[0.98] text-white text-[13px] font-sans font-medium transition-all duration-200 shadow-xs cursor-pointer whitespace-nowrap"
          >
            Adicionar no carrinho
          </button>
        </div>
      </div>
    </section>
  );
}
