"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { getStrapiMedia } from "@/utils/api";
import { ConfiguracaoItem, getProductConfigurations, getAccessoryGroups, isConfigEqual } from "@/utils/productUtils";

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

  // 0. Configurações / Modelos principais do produto
  hasConfiguracoes: boolean;
  configuracoes: ConfiguracaoItem[];
  selectedConfiguracao: ConfiguracaoItem | null;
  setSelectedConfiguracao: (cfg: ConfiguracaoItem | null) => void;
  selectConfiguracao: (cfg: ConfiguracaoItem) => void;

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
  isQuoteOnly: boolean;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({
  product,
  children,
}: {
  product: any;
  children: React.ReactNode;
}) {
  // Verifica antecipadamente se o produto possui algum preço base ou se é estritamente "Sob consulta"
  const isProductQuoteOnly = useMemo(() => {
    // 0. Preço em configurações
    if (product?.Configuracoes && Array.isArray(product.Configuracoes)) {
      for (const c of product.Configuracoes) {
        if (c.Preco && Number(c.Preco) > 0) return false;
        if (c.Preco_promocional && Number(c.Preco_promocional) > 0) return false;
      }
    }

    // 1. Preço na raiz do produto
    if (product?.Preco && Number(product.Preco) > 0) return false;
    if (product?.Preco_promocional && Number(product.Preco_promocional) > 0) return false;

    // 2. Preço em variações tradicionais
    if (product?.Variacoes && Array.isArray(product.Variacoes)) {
      for (const v of product.Variacoes) {
        if (v.Preco && Number(v.Preco) > 0) return false;
        if (v.Preco_promocional && Number(v.Preco_promocional) > 0) return false;
        if (v.Preco_diferenciado && Number(v.Preco_diferenciado) > 0) return false;
      }
    }

    // 3. Preço em revestimentos / cores
    if (product?.Revestimentos && Array.isArray(product.Revestimentos)) {
      for (const r of product.Revestimentos) {
        if (r.Cores && Array.isArray(r.Cores)) {
          for (const c of r.Cores) {
            if (c.Preco && Number(c.Preco) > 0) return false;
            if (c.Preco_promocional && Number(c.Preco_promocional) > 0) return false;
            if (c.Preco_diferenciado && Number(c.Preco_diferenciado) > 0) return false;
          }
        }
      }
    }

    // 4. Preço em opções de grupos
    if (product?.Grupos_variacao && Array.isArray(product.Grupos_variacao)) {
      for (const g of product.Grupos_variacao) {
        if (g.Opcoes && Array.isArray(g.Opcoes)) {
          for (const o of g.Opcoes) {
            if (o.Preco && Number(o.Preco) > 0) return false;
            if (o.Preco_promocional && Number(o.Preco_promocional) > 0) return false;
          }
        }
      }
    }

    // 5. Preço em opções de medidas
    if (product?.Opcoes_medida && Array.isArray(product.Opcoes_medida)) {
      for (const m of product.Opcoes_medida) {
        if (m.Preco && Number(m.Preco) > 0) return false;
        if (m.Preco_promocional && Number(m.Preco_promocional) > 0) return false;
      }
    }

    return true;
  }, [product]);

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

  // Inicializa o primeiro revestimento e sua primeira cor (apenas se tiver preço/não for sob consulta)
  useEffect(() => {
    if (isProductQuoteOnly) {
      setSelectedRevestimento(null);
      setSelectedCorRevestimento(null);
      return;
    }
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
  }, [revestimentos, isProductQuoteOnly]);

  const selectRevestimentoAndCor = useCallback((rev: Revestimento, cor: CorRevestimento) => {
    if (isProductQuoteOnly) return;
    setSelectedRevestimento(rev);
    setSelectedCorRevestimento(cor);
  }, [isProductQuoteOnly]);

  // -------------------------------------------------------------------------
  // 1.5. CONFIGURAÇÕES / MODELOS PRINCIPAIS DA LINHA
  // -------------------------------------------------------------------------
  const configuracoes: ConfiguracaoItem[] = useMemo(
    () => getProductConfigurations(product),
    [product]
  );
  const hasConfiguracoes = configuracoes.length > 0;
  const [selectedConfiguracao, setSelectedConfiguracao] = useState<ConfiguracaoItem | null>(null);

  // Inicializa a configuração (verifica parâmetro ?config= na URL ou primeira opção)
  useEffect(() => {
    if (configuracoes.length === 0) {
      setSelectedConfiguracao(null);
      return;
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cfgIdParam = params.get("cfgId");
      if (cfgIdParam) {
        const matchedById = configuracoes.find((c) => String(c.id) === String(cfgIdParam));
        if (matchedById) {
          setSelectedConfiguracao(matchedById);
          return;
        }
      }

      const configParam = params.get("config");
      if (configParam) {
        const decoded = decodeURIComponent(configParam).toLowerCase().trim();
        const matched = configuracoes.find((c) => {
          const cName = c.Nome.toLowerCase().trim();
          return cName === decoded || cName.includes(decoded) || decoded.includes(cName);
        });
        if (matched) {
          setSelectedConfiguracao(matched);
          return;
        }
      }
    }
    setSelectedConfiguracao(configuracoes[0]);
  }, [configuracoes]);

  const selectConfiguracao = useCallback((cfg: ConfiguracaoItem) => {
    setSelectedConfiguracao(cfg);
  }, []);

  // -------------------------------------------------------------------------
  // 2. GRUPOS MODULARES DE ACESSÓRIOS (Bases, Braços, Apoio de Cabeça, etc.)
  // -------------------------------------------------------------------------
  const variationGroups: VariationGroup[] = useMemo(
    () => getAccessoryGroups(product),
    [product]
  );
  const hasVariationGroups = variationGroups.length > 0;

  const [selectedGroupOptions, setSelectedGroupOptions] = useState<Record<string, VariationOption>>({});

  // Inicializa a seleção de cada grupo com a 1ª opção cadastrada (apenas se não for sob consulta)
  useEffect(() => {
    if (isProductQuoteOnly) {
      setSelectedGroupOptions({});
      return;
    }
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
  }, [variationGroups, isProductQuoteOnly]);

  const selectGroupOption = useCallback((groupTitle: string, option: VariationOption) => {
    if (isProductQuoteOnly) return;
    setSelectedGroupOptions((prev) => ({
      ...prev,
      [groupTitle]: option,
    }));
  }, [isProductQuoteOnly]);

  // Foto representativa dos grupos (caso a opção selecionada tenha Galeria, Foto_destaque ou Foto)
  // Foto da opção ativa de grupos (apenas da Galeria)
  const activeGroupPhotoUrl = useMemo(() => {
    if (!hasVariationGroups || isProductQuoteOnly) return null;
    const opts = Object.values(selectedGroupOptions);
    for (const opt of opts) {
      if (opt.Galeria && opt.Galeria.length > 0 && opt.Galeria[0]?.url) {
        return getStrapiMedia(opt.Galeria[0].url);
      }
    }
    return null;
  }, [hasVariationGroups, selectedGroupOptions, isProductQuoteOnly]);

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
    if (isProductQuoteOnly) {
      setSelectedMedida(null);
      return;
    }
    if (medidas.length > 0) {
      setSelectedMedida(medidas[0]);
    } else {
      setSelectedMedida(null);
    }
  }, [medidas, isProductQuoteOnly]);

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
    if (isProductQuoteOnly) {
      setSelectedColorState(null);
      return;
    }
    if (availableColors.length > 0) {
      setSelectedColorState(availableColors[0].name);
    } else {
      setSelectedColorState(null);
    }
  }, [availableColors, isProductQuoteOnly]);

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

    // 0.1 Configuração / modelo selecionado
    if (hasConfiguracoes && selectedConfiguracao) {
      if (selectedConfiguracao.Preco_promocional && Number(selectedConfiguracao.Preco_promocional) > 0) {
        base = Number(selectedConfiguracao.Preco_promocional);
      } else if (selectedConfiguracao.Preco && Number(selectedConfiguracao.Preco) > 0) {
        base = Number(selectedConfiguracao.Preco);
      }
      if (selectedConfiguracao.Preco_adicional && Number(selectedConfiguracao.Preco_adicional) > 0) {
        additionalFromRevestimento += Number(selectedConfiguracao.Preco_adicional);
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

    return base > 0 ? base + totalAdditional : 0;
  }, [hasRevestimentos, selectedCorRevestimento, hasConfiguracoes, selectedConfiguracao, hasMedidas, selectedMedida, selectedVariation, product, hasVariationGroups, selectedGroupOptions]);

  const isQuoteOnly = isProductQuoteOnly || selectedPrice <= 0;

  // Nome legível da variação ativa (combina Configuração + Revestimento/Cor + Grupos modulares + Medidas)
  const variationDisplayName = useMemo(() => {
    const parts: string[] = [];

    if (hasConfiguracoes && selectedConfiguracao) {
      parts.push(
        selectedConfiguracao.Descricao
          ? `Configuração: ${selectedConfiguracao.Nome} (${selectedConfiguracao.Descricao})`
          : `Configuração: ${selectedConfiguracao.Nome}`
      );
    }

    if (!isQuoteOnly && hasRevestimentos && selectedRevestimento && selectedCorRevestimento) {
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

    if (!isQuoteOnly && hasVariationGroups) {
      Object.entries(selectedGroupOptions).forEach(([groupTitle, opt]) => {
        parts.push(`${groupTitle}: ${opt.Nome}`);
      });
    }

    if (hasMedidas && selectedMedida) {
      parts.push(`Medida: ${selectedMedida.Titulo}`);
    }

    return parts.length > 0 ? parts.join(" • ") : "Padrão";
  }, [hasConfiguracoes, selectedConfiguracao, isQuoteOnly, hasRevestimentos, selectedRevestimento, selectedCorRevestimento, availableColors, selectedVariation, selectedColor, hasVariationGroups, selectedGroupOptions, hasMedidas, selectedMedida]);

  // Foto representativa da variação selecionada (para uso no Compre Junto, carrinho, etc.)
  const activeVariationPhotoUrl = useMemo(() => {
    // 0. Foto da Configuração selecionada (apenas Galeria)
    if (hasConfiguracoes && selectedConfiguracao) {
      if (selectedConfiguracao.Galeria && selectedConfiguracao.Galeria.length > 0 && selectedConfiguracao.Galeria[0]?.url) {
        return getStrapiMedia(selectedConfiguracao.Galeria[0].url);
      }
    }

    // 0.5. Revestimento ativo com foto de galeria ou miniatura
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

    return null;
  }, [hasConfiguracoes, selectedConfiguracao, hasRevestimentos, selectedCorRevestimento, selectedVariation, activeGroupPhotoUrl, product]);

  return (
    <ProductContext.Provider
      value={{
        product,
        // Configurações / Modelos principais
        hasConfiguracoes,
        configuracoes,
        selectedConfiguracao,
        setSelectedConfiguracao,
        selectConfiguracao,

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
        isQuoteOnly,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  return useContext(ProductContext);
}
