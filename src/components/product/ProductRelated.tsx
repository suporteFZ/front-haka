"use client";

import React, { useRef, useState, useEffect } from "react";
import ProductCard, { ProductCardItem } from "@/components/common/ProductCard";

interface ProductRelatedProps {
  products: ProductCardItem[];
  title?: string;
}

export default function ProductRelated({
  products,
  title = "Veja também",
}: ProductRelatedProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [products]);

  if (!products || products.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    // Rola aproximadamente a largura visível menos uma folga
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full mt-8 md:mt-12 mb-8 md:mb-12">
      {/* Cabeçalho da seção: Título à esquerda e Setas de Navegação à direita */}
      <div className="flex items-center justify-between mb-6 md:mb-8 px-4 sm:px-6 md:px-0">
        <h2 className="text-[26px] md:text-[34px] font-heading font-medium text-[#000000] tracking-tight">
          {title}
        </h2>

        {/* Botões de Navegação do Carrossel */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Anterior"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#000000] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Próximo"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#000000] hover:bg-[#F9FAFB] active:bg-[#F3F4F6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carrossel de Cards com Snap e Rolagem Fluida */}
      <div
        ref={sliderRef}
        onScroll={checkScroll}
        className="flex items-stretch gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory py-2 px-4 sm:px-6 md:px-0"
      >
        {products.map((item) => (
          <div
            key={item.id}
            className="w-[280px] sm:w-[320px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] shrink-0 snap-start flex flex-col"
          >
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
