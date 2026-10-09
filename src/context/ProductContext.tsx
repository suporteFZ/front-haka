"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { getStrapiMedia } from "@/utils/api";

interface ProductContextType {
  product: any;
  selectedVariationIndex: number;
  setSelectedVariationIndex: (index: number) => void;
  selectedVariation: any;
  activeVariationPhotoUrl: string | null;
  activeGalleryImageUrl: string | null;
  setActiveGalleryImageUrl: (url: string | null) => void;
  selectedPrice: number;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({
  product,
  children,
}: {
  product: any;
  children: React.ReactNode;
}) {
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [activeGalleryImageUrl, setActiveGalleryImageUrl] = useState<string | null>(null);

  const variations = product?.Variacoes || [];
  const selectedVariation = variations[selectedVariationIndex] || variations[0] || null;

  // Foto representativa da variação selecionada (para uso no Compre Junto, etc.)
  const activeVariationPhotoUrl = useMemo(() => {
    if (!selectedVariation) {
      if (product?.Imagem_destaque?.url) return getStrapiMedia(product.Imagem_destaque.url);
      return null;
    }
    if (selectedVariation.Galeria && selectedVariation.Galeria.length > 0) {
      return getStrapiMedia(selectedVariation.Galeria[0].url);
    }
    if (selectedVariation.Miniatura?.url) {
      return getStrapiMedia(selectedVariation.Miniatura.url);
    }
    if (product?.Imagem_destaque?.url) {
      return getStrapiMedia(product.Imagem_destaque.url);
    }
    return null;
  }, [selectedVariation, product]);

  // Preço da variação selecionada (prioriza Preco_promocional e Preco da variação)
  const selectedPrice = useMemo(() => {
    if (selectedVariation?.Preco_promocional && selectedVariation.Preco_promocional > 0) {
      return selectedVariation.Preco_promocional;
    }
    if (selectedVariation?.Preco && selectedVariation.Preco > 0) {
      return selectedVariation.Preco;
    }
    if (selectedVariation?.Preco_diferenciado && selectedVariation.Preco_diferenciado > 0) {
      return selectedVariation.Preco_diferenciado;
    }
    if (product?.Preco_promocional && product.Preco_promocional > 0) {
      return product.Preco_promocional;
    }
    return product?.Preco || 0;
  }, [selectedVariation, product]);

  return (
    <ProductContext.Provider
      value={{
        product,
        selectedVariationIndex,
        setSelectedVariationIndex,
        selectedVariation,
        activeVariationPhotoUrl,
        activeGalleryImageUrl,
        setActiveGalleryImageUrl,
        selectedPrice,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  return useContext(ProductContext);
}
