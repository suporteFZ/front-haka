"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { getStrapiMedia } from "@/utils/api";

export interface ColorOption {
  name: string;
  hex?: string;
  thumbUrl?: string;
}

export interface VariationOptionMedia {
  url: string;
  alternativeText?: string;
  width?: number;
  height?: number;
}

export interface CorRevestimento {
  id?: number;
  Nome_cor: string;
  Cor_hex?: string;
  Miniatura?: VariationOptionMedia;
  Galeria?: VariationOptionMedia[];
  Preco?: number;
  Preco_promocional?: number;
  Preco_adicional?: number;
  Preco_diferenciado?: number;
  Estoque?: number;
}

export interface Revestimento {
  id?: number;
  Nome: string;
  Descricao?: string;
  Foto_amostra?: VariationOptionMedia;
  Cores: CorRevestimento[];
}

export interface VariationOption {
  id?: number;
  Nome: string;
  Foto?: VariationOptionMedia;
  Preco?: number;
  Preco_promocional?: number;
  Preco_adicional?: number;
  Cor_hex?: string;
  Foto_destaque?: VariationOptionMedia;
  Galeria?: VariationOptionMedia[];
}

export interface VariationGroup {
  id?: number;
  Titulo: string;
  Obrigatorio?: boolean;
  Opcoes: VariationOption[];
}

export interface OpcaoMedida {
  id?: number;
  Titulo: string;
  Descricao?: string;
  Preco?: number;
  Preco_promocional?: number | null;
  Preco_adicional?: number;
  Estoque?: number;
}

interface ProductContextType {
  product: any;

  // 1. Revestimentos em 3 Camadas (Material -> Cores com galeria e preços)
  hasRevestimentos: boolean;
  revestimentos: Revestimento[];
  selectedRevestimento: Revestimento | null;
  selectedCorRevestimento: CorRevestimento | null;
  setSelectedRevestimento: (rev: Revestimento | null) => void;
  setSelectedCorRevestimento: (cor: CorRevestimento | null) => void;
  selectRevestimentoAndCor: (rev: Revestimento, cor: CorRevestimento) => void;

  // 2. Grupos modulares de variação (estilo Cavaletti: Estrutura, Bases, etc.)
  hasVariationGroups: boolean;
  variationGroups: VariationGroup[];
  selectedGroupOptions: Record<string, VariationOption>;
  selectGroupOption: (groupTitle: string, option: VariationOption) => void;
  activeGroupPhotoUrl: string | null;

  // 3. Opções de Medidas / Dimensões (ex: Mesas 100cm, 120cm, etc.)
  hasMedidas: boolean;
  medidas: OpcaoMedida[];
  selectedMedida: OpcaoMedida | null;
  setSelectedMedida: (medida: OpcaoMedida | null) => void;

  // 4. Variações tradicionais (fallback por cor direta)
  variations: any[];
  availableColors: ColorOption[];
  availableSizes: string[];
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedSize: string | null;
  setSelectedSize: (size: string | null) => void;
  selectedVariationIndex: number;
  setSelectedVariationIndex: (index: number) => void;
  selectedVariation: any;

  // 5. Dados consolidados
  variationDisplayName: string;
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
  // -------------------------------------------------------------------------
  // 1. REVESTIMENTOS EM 3 CAMADAS (Material/Tecido -> Cores)
  // -------------------------------------------------------------------------
  const revestimentos: Revestimento[] = useMemo(
    () => product?.Revestimentos || [],
    [product?.Revestimentos]
  );
  const hasRevestimentos = revestimentos.length > 0;

  const [selectedRevestimento, setSelectedRevestimento] = useState<Revestimento | null>(null);
  const [selectedCorRevestimento, setSelectedCorRevestimento] = useState<CorRevestimento | null>(null);

  // Inicializa o primeiro revestimento e sua primeira cor ao carregar o produto
  useEffect(() => {
    if (revestimentos.length > 0) {
      const firstRev = revestimentos[0];
      setSelectedRevestimento(firstRev);
      if (firstRev.Cores && firstRev.Cores.length > 0) {
        setSelectedCorRevestimento(firstRev.Cores[0]);
      } else {
        setSelectedCorRevestimento(null);
      }
    } else {
      setSelectedRevestimento(null);
      setSelectedCorRevestimento(null);
    }
  }, [revestimentos]);

  const selectRevestimentoAndCor = useCallback((rev: Revestimento, cor: CorRevestimento) => {
    setSelectedRevestimento(rev);
    setSelectedCorRevestimento(cor);
  }, []);

  // -------------------------------------------------------------------------
  // 2. GRUPOS MODULARES DE VARIAÇÃO (ESTILO CAVALETTI: Encosto, Base, etc.)
  // -------------------------------------------------------------------------
  const variationGroups: VariationGroup[] = useMemo(
    () => product?.Grupos_variacao || [],
    [product?.Grupos_variacao]
  );
  const hasVariationGroups = variationGroups.length > 0;

  const [selectedGroupOptions, setSelectedGroupOptions] = useState<Record<string, VariationOption>>({});

  // Inicializa a seleção de cada grupo com a 1ª opção cadastrada
  useEffect(() => {
    if (variationGroups.length > 0) {
      const initial: Record<string, VariationOption> = {};
      variationGroups.forEach((group) => {
        if (group.Opcoes && group.Opcoes.length > 0) {
          initial[group.Titulo] = group.Opcoes[0];
        }
      });
      setSelectedGroupOptions(initial);
    } else {
      setSelectedGroupOptions({});
    }
  }, [variationGroups]);

  const selectGroupOption = useCallback((groupTitle: string, option: VariationOption) => {
    setSelectedGroupOptions((prev) => ({
      ...prev,
      [groupTitle]: option,
    }));
  }, []);

  // Foto representativa dos grupos (caso a opção selecionada tenha Foto_destaque ou Foto)
  const activeGroupPhotoUrl = useMemo(() => {
    if (!hasVariationGroups) return null;
    const opts = Object.values(selectedGroupOptions);
    for (const opt of opts) {
      if (opt.Foto_destaque?.url) {
        return getStrapiMedia(opt.Foto_destaque.url);
      }
    }
    for (const opt of opts) {
      if (opt.Foto?.url) {
        return getStrapiMedia(opt.Foto.url);
      }
    }
    return null;
  }, [hasVariationGroups, selectedGroupOptions]);

  // -------------------------------------------------------------------------
  // 2.5. OPÇÕES DE MEDIDAS (Tamanhos e Dimensões: ex: Mesas 100cm, 120cm)
  // -------------------------------------------------------------------------
  const medidas: OpcaoMedida[] = useMemo(
    () => product?.Opcoes_medida || [],
    [product?.Opcoes_medida]
  );
  const hasMedidas = medidas.length > 0;
  const [selectedMedida, setSelectedMedida] = useState<OpcaoMedida | null>(null);

  useEffect(() => {
    if (medidas.length > 0) {
      setSelectedMedida(medidas[0]);
    } else {
      setSelectedMedida(null);
    }
  }, [medidas]);

  // -------------------------------------------------------------------------
  // 3. VARIAÇÕES TRADICIONAIS (COR DIRETA COM GALERIA DE FOTOS) - FALLBACK
  // -------------------------------------------------------------------------
  const variations: any[] = useMemo(() => product?.Variacoes || [], [product?.Variacoes]);

  // Lista única de cores disponíveis nas variações tradicionais
  const availableColors = useMemo<ColorOption[]>(() => {
    const map = new Map<string, ColorOption>();
    variations.forEach((v: any) => {
      const name = v.Nome_cor?.trim();
      if (name && !map.has(name)) {
        const thumb = v.Miniatura
          ? getStrapiMedia(v.Miniatura.url)
          : v.Galeria && v.Galeria[0]
          ? getStrapiMedia(v.Galeria[0].url)
          : undefined;
        map.set(name, {
          name,
          hex: v.Cor_hex,
          thumbUrl: thumb || undefined,
        });
      }
    });
    return Array.from(map.values());
  }, [variations]);

  // Estados de seleção de cor tradicional
  const [selectedColor, setSelectedColorState] = useState<string | null>(null);
  const [activeGalleryImageUrl, setActiveGalleryImageUrl] = useState<string | null>(null);

  // Inicializa a seleção tradicional ao carregar o produto
  useEffect(() => {
    if (availableColors.length > 0) {
      setSelectedColorState(availableColors[0].name);
    } else {
      setSelectedColorState(null);
    }
  }, [availableColors]);

  // Resolve a variação tradicional selecionada com base na cor escolhida
  const selectedVariation = useMemo(() => {
    if (variations.length === 0) return null;

    if (availableColors.length > 0 && selectedColor) {
      const match = variations.find(
        (v: any) => v.Nome_cor?.trim().toLowerCase() === selectedColor.trim().toLowerCase()
      );
      if (match) return match;
    }

    return variations[0] || null;
  }, [variations, availableColors.length, selectedColor]);

  // Índice da variação selecionada
  const selectedVariationIndex = useMemo(() => {
    if (!selectedVariation) return 0;
    const idx = variations.indexOf(selectedVariation);
    return idx >= 0 ? idx : 0;
  }, [variations, selectedVariation]);

  const setSelectedVariationIndex = useCallback(
    (index: number) => {
      const v = variations[index];
      if (v && v.Nome_cor?.trim()) {
        setSelectedColorState(v.Nome_cor.trim());
      }
    },
    [variations]
  );

  const setSelectedColor = useCallback((color: string | null) => {
    setSelectedColorState(color);
  }, []);

  // Compatibilidade caso algum componente ainda consulte tamanho
  const availableSizes: string[] = [];
  const selectedSize: string | null = null;
  const setSelectedSize = useCallback((_size: string | null) => {}, []);

  // -------------------------------------------------------------------------
  // 4. CONSOLIDAÇÃO DE DADOS (NOME, FOTOS E PREÇO)
  // -------------------------------------------------------------------------
  // Nome legível da variação ativa (combina Revestimento/Cor + Grupos modulares + Medidas)
  const variationDisplayName = useMemo(() => {
    const parts: string[] = [];

    if (hasRevestimentos && selectedRevestimento && selectedCorRevestimento) {
      parts.push(`Revestimento: ${selectedRevestimento.Nome} (${selectedCorRevestimento.Nome_cor})`);
    }

    if (availableColors.length > 0 && selectedColor) {
      parts.push(`Cor: ${selectedColor}`);
    } else if (!hasRevestimentos && (selectedVariation?.Nome_cor || selectedColor)) {
      const color = selectedVariation?.Nome_cor?.trim() || selectedColor;
      if (color) {
        parts.push(`Cor: ${color}`);
      }
    }

    if (hasVariationGroups) {
      Object.entries(selectedGroupOptions).forEach(([groupTitle, opt]) => {
        parts.push(`${groupTitle}: ${opt.Nome}`);
      });
    }

    if (hasMedidas && selectedMedida) {
      parts.push(`Medida: ${selectedMedida.Titulo}`);
    }

    return parts.length > 0 ? parts.join(" • ") : "Padrão";
  }, [hasRevestimentos, selectedRevestimento, selectedCorRevestimento, availableColors, selectedVariation, selectedColor, hasVariationGroups, selectedGroupOptions, hasMedidas, selectedMedida]);

  // Foto representativa da variação selecionada (para uso no Compre Junto, carrinho, etc.)
  const activeVariationPhotoUrl = useMemo(() => {
    // 0. Revestimento ativo com foto de galeria ou miniatura
    if (hasRevestimentos && selectedCorRevestimento) {
      if (selectedCorRevestimento.Galeria && selectedCorRevestimento.Galeria.length > 0) {
        return getStrapiMedia(selectedCorRevestimento.Galeria[0].url);
      }
      if (selectedCorRevestimento.Miniatura?.url) {
        return getStrapiMedia(selectedCorRevestimento.Miniatura.url);
      }
    }

    // 1. Galeria/miniatura da cor tradicional selecionada da cadeira
    if (selectedVariation?.Galeria && selectedVariation.Galeria.length > 0) {
      return getStrapiMedia(selectedVariation.Galeria[0].url);
    }
    if (selectedVariation?.Miniatura?.url) {
      return getStrapiMedia(selectedVariation.Miniatura.url);
    }

    // 2. Foto de destaque ou foto do grupo selecionado
    if (activeGroupPhotoUrl) return activeGroupPhotoUrl;

    // 3. Galeria global do produto (fora de variações)
    if (product?.Galeria && Array.isArray(product.Galeria) && product.Galeria.length > 0 && product.Galeria[0]?.url) {
      return getStrapiMedia(product.Galeria[0].url);
    }

    // 4. Imagem destaque do produto
    if (product?.Imagem_destaque?.url) {
      return getStrapiMedia(product.Imagem_destaque.url);
    }
    return null;
  }, [hasRevestimentos, selectedCorRevestimento, selectedVariation, activeGroupPhotoUrl, product]);

  // Preço da variação selecionada (combina preço de revestimento/cor + adicionais dos grupos)
  const selectedPrice = useMemo(() => {
    let base = 0;
    let additionalFromRevestimento = 0;

    // 0. Revestimento ativo
    if (hasRevestimentos && selectedCorRevestimento) {
      if (selectedCorRevestimento.Preco_promocional && Number(selectedCorRevestimento.Preco_promocional) > 0) {
        base = Number(selectedCorRevestimento.Preco_promocional);
      } else if (selectedCorRevestimento.Preco && Number(selectedCorRevestimento.Preco) > 0) {
        base = Number(selectedCorRevestimento.Preco);
      } else if (selectedCorRevestimento.Preco_diferenciado && Number(selectedCorRevestimento.Preco_diferenciado) > 0) {
        base = Number(selectedCorRevestimento.Preco_diferenciado);
      }
      if (selectedCorRevestimento.Preco_adicional && Number(selectedCorRevestimento.Preco_adicional) > 0) {
        additionalFromRevestimento = Number(selectedCorRevestimento.Preco_adicional);
      }
    }

    // 0.5. Medida selecionada (pode definir o preço base ou ter acréscimo)
    let additionalFromMedida = 0;
    if (hasMedidas && selectedMedida) {
      if (selectedMedida.Preco_promocional && Number(selectedMedida.Preco_promocional) > 0) {
        base = Number(selectedMedida.Preco_promocional);
      } else if (selectedMedida.Preco && Number(selectedMedida.Preco) > 0) {
        base = Number(selectedMedida.Preco);
      }
      if (selectedMedida.Preco_adicional && Number(selectedMedida.Preco_adicional) > 0) {
        additionalFromMedida = Number(selectedMedida.Preco_adicional);
      }
    }

    // 1. Preço da cor tradicional da cadeira (fallback) se não achou no revestimento
    if (base === 0) {
      if (selectedVariation?.Preco_promocional && Number(selectedVariation.Preco_promocional) > 0) {
        base = Number(selectedVariation.Preco_promocional);
      } else if (selectedVariation?.Preco && Number(selectedVariation.Preco) > 0) {
        base = Number(selectedVariation.Preco);
      } else if (selectedVariation?.Preco_diferenciado && Number(selectedVariation.Preco_diferenciado) > 0) {
        base = Number(selectedVariation.Preco_diferenciado);
      } else if (product?.Preco_promocional && Number(product.Preco_promocional) > 0) {
        base = Number(product.Preco_promocional);
      } else if (product?.Preco && Number(product.Preco) > 0) {
        base = Number(product.Preco);
      }
    }

    // 2. Se não achou na cor nem na raiz, verifica se alguma opção de grupo tem preço
    if (base === 0 && hasVariationGroups) {
      for (const opt of Object.values(selectedGroupOptions)) {
        if (opt.Preco_promocional && Number(opt.Preco_promocional) > 0) {
          base = Number(opt.Preco_promocional);
          break;
        }
        if (opt.Preco && Number(opt.Preco) > 0) {
          base = Number(opt.Preco);
          break;
        }
      }
    }

    // 3. Soma os adicionais de cada opção de grupo + adicional do revestimento + adicional da medida
    const additionalFromGroups = hasVariationGroups
      ? Object.values(selectedGroupOptions).reduce(
          (sum, opt) => sum + (Number(opt.Preco_adicional) || 0),
          0
        )
      : 0;

    const totalAdditional = additionalFromRevestimento + additionalFromGroups + additionalFromMedida;

    return base > 0 ? base + totalAdditional : (totalAdditional > 0 ? totalAdditional : 0);
  }, [hasRevestimentos, selectedCorRevestimento, hasMedidas, selectedMedida, selectedVariation, product, hasVariationGroups, selectedGroupOptions]);

  return (
    <ProductContext.Provider
      value={{
        product,
        // Revestimentos em 3 camadas
        hasRevestimentos,
        revestimentos,
        selectedRevestimento,
        selectedCorRevestimento,
        setSelectedRevestimento,
        setSelectedCorRevestimento,
        selectRevestimentoAndCor,

        // Grupos modulares
        hasVariationGroups,
        variationGroups,
        selectedGroupOptions,
        selectGroupOption,
        activeGroupPhotoUrl,

        // Opções de medidas / dimensões
        hasMedidas,
        medidas,
        selectedMedida,
        setSelectedMedida,

        // Variações tradicionais (fallback)
        variations,
        availableColors,
        availableSizes,
        selectedColor,
        setSelectedColor,
        selectedSize,
        setSelectedSize,
        selectedVariationIndex,
        setSelectedVariationIndex,
        selectedVariation,

        // Dados consolidados
        variationDisplayName,
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
