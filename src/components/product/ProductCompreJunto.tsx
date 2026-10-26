"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";
import { useProduct } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import { getProductConfigurations, ConfiguracaoItem } from "@/utils/productUtils";

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
  configurations: ConfiguracaoItem[];
  selectedConfig: ConfiguracaoItem | null;
  imageUrl: string | null;
  price: number;
  installments: number;
  isQuoteOnly: boolean;
  variation: any;
}

// Card de Produto Complementar com Dropdown customizado (altura fixa idêntica e opções flutuando por cima)
function ComplementaryCard({
  comp,
  cardWidthClass,
  cardHeightClass,
  imageHeightClass,
  onSelectConfig,
}: {
  comp: ComplementaryItem;
  cardWidthClass: string;
  cardHeightClass: string;
  imageHeightClass: string;
  onSelectConfig: (productId: number, configKey: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      className={`${cardWidthClass} relative bg-white rounded-[16px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-xs border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between ${cardHeightClass} shrink-0 group ${
        isOpen ? "z-40 ring-1 ring-black/5" : "z-10"
      }`}
    >
      {/* Stretched Link cobrindo todo o card (menos o dropdown interativo) */}
      <Link
        href={comp.href}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-0 rounded-[16px] md:rounded-[20px]"
        aria-label={`Ver detalhes de ${comp.name}`}
        title={`Ver detalhes de ${comp.name}`}
      />

      {/* Foto do produto */}
      <div className={`relative z-1 w-full ${imageHeightClass} flex items-center justify-center p-2 pointer-events-none`}>
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

      {/* Área inferior: Dropdown de Modelo (entre a foto e o nome) + Marca + Nome + Preço */}
      <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col justify-between flex-1 pointer-events-none">
        <div className="flex flex-col">
          {/* Dropdown de Modelo customizado */}
          {comp.configurations.length > 1 && (
            <div
              ref={dropdownRef}
              className="relative z-30 mb-2 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#69736B]">
                  Modelo
                </span>
                <span className="text-[10px] font-sans text-stone-400">
                  {comp.configurations.length} opções
                </span>
              </div>

              {/* Botão Gatilho do Dropdown com estilo do site */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 bg-[#F7F7F8] hover:bg-[#F0F0F2] border ${
                  isOpen ? "border-black ring-1 ring-black bg-white" : "border-[#E5E7EB] hover:border-stone-400"
                } rounded-xl px-2.5 py-1.5 text-left transition-all duration-200 cursor-pointer shadow-2xs group/btn`}
              >
                <span className="text-[11px] md:text-[12px] font-sans font-medium text-[#000000] truncate">
                  {comp.selectedConfig?.Nome || "Selecione o modelo"}
                </span>
                <div
                  className={`shrink-0 text-stone-400 group-hover/btn:text-black transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-black" : ""
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Menu Suspenso Flutuante: abre por cima, sem limites de container, com sombra alta */}
              {isOpen && (
                <div
                  className="absolute -left-2 -right-2 top-full mt-2 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-2 z-50 max-h-[340px] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1.5 cart-scroll"
                >
                  {comp.configurations.map((c: any) => {
                    const isSelected =
                      String(comp.selectedConfig?.id) === String(c.id) ||
                      comp.selectedConfig?.Nome === c.Nome;
                    return (
                      <button
                        key={c.id || c.Nome}
                        type="button"
                        onClick={() => {
                          onSelectConfig(comp.product.id, c.id ? String(c.id) : c.Nome);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-start justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-[11px] md:text-[12px] font-sans transition-all cursor-pointer ${
                          isSelected
                            ? "bg-black text-white font-medium shadow-xs"
                            : "text-stone-700 hover:bg-stone-100 hover:text-black"
                        }`}
                      >
                        <span className="leading-snug line-clamp-2 flex-1">
                          {c.Nome}
                        </span>
                        {isSelected && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-white ml-1.5 mt-0.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Marca */}
          <span className="text-[10px] md:text-[11px] font-sans font-semibold uppercase tracking-wider text-[#69736B]">
            {comp.brand}
          </span>

          {/* Nome do Produto com ícone externo */}
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
        </div>

        {/* Preço */}
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
    </div>
  );
}

export default function ProductCompreJunto({ product, activeImageUrl }: ProductCompreJuntoProps) {
  const productCtx = useProduct();
  const cart = useCart();

  // Estado para armazenar o modelo selecionado de cada produto complementar { [productId]: configIdOrName }
  const [selectedConfigMap, setSelectedConfigMap] = useState<Record<number, string>>({});

  // Estado do dropdown mobile { [productId]: boolean }
  const [mobileOpenId, setMobileOpenId] = useState<number | null>(null);

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

      // Configurações (Modelos) do produto complementar
      const configurations = getProductConfigurations(p);
      const selectedKey = selectedConfigMap[p.id];
      const selectedConfig = configurations.length > 0
        ? (configurations.find((c: any) => String(c.id) === String(selectedKey) || c.Nome === selectedKey) || configurations[0])
        : null;

      // 1. Extração da imagem (prioriza a galeria/foto do modelo selecionado)
      let imageUrl: string | null = null;
      if (selectedConfig) {
        if (selectedConfig.Galeria && selectedConfig.Galeria.length > 0 && selectedConfig.Galeria[0]?.url) {
          imageUrl = getStrapiMedia(selectedConfig.Galeria[0].url);
        } else if (selectedConfig.Foto?.url) {
          imageUrl = getStrapiMedia(selectedConfig.Foto.url);
        }
      }

      if (!imageUrl) {
        const firstVar = p.Variacoes?.[0];
        if (firstVar) {
          if (firstVar.Galeria && firstVar.Galeria.length > 0 && firstVar.Galeria[0]?.url) {
            imageUrl = getStrapiMedia(firstVar.Galeria[0].url);
          } else if (firstVar.Miniatura?.url) {
            imageUrl = getStrapiMedia(firstVar.Miniatura.url);
          }
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
      if (!imageUrl && p.Galeria?.[0]?.url) {
        imageUrl = getStrapiMedia(p.Galeria[0].url);
      }
      if (!imageUrl && p.Imagem_destaque?.url) {
        imageUrl = getStrapiMedia(p.Imagem_destaque.url);
      }

      // 2. Extração de preço considerando o modelo selecionado
      let price = 0;
      if (selectedConfig) {
        if (selectedConfig.Preco_promocional && selectedConfig.Preco_promocional > 0) {
          price = selectedConfig.Preco_promocional;
        } else if (selectedConfig.Preco && selectedConfig.Preco > 0) {
          price = selectedConfig.Preco;
        } else if (p.Preco_promocional && p.Preco_promocional > 0) {
          price = p.Preco_promocional;
        } else {
          price = p.Preco || 0;
        }
        if (selectedConfig.Preco_adicional && Number(selectedConfig.Preco_adicional) > 0) {
          price += Number(selectedConfig.Preco_adicional);
        }
      } else {
        const firstVar = p.Variacoes?.[0];
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
      }

      const installments = p.Parcelas || 10;
      const isQuoteOnly = !price || price <= 0;

      return {
        product: p,
        name,
        brand,
        href,
        configurations,
        selectedConfig,
        imageUrl,
        price,
        installments,
        isQuoteOnly,
        variation: p.Variacoes?.[0],
      };
    });
  }, [product.produtos_compre_junto, product.id, product.marca?.Nome, selectedConfigMap]);

  // Se não houver produtos complementares vinculados no Strapi, não renderiza a seção
  if (complementaryList.length === 0) {
    return null;
  }

  // Imagem do produto principal: sempre a primeira foto da galeria da variação ativa ou do produto (nunca muda ao navegar no carrossel de fotos)
  const productMainImg = useMemo(() => {
    if (productCtx?.activeVariationPhotoUrl) return productCtx.activeVariationPhotoUrl;

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
    if (product.Galeria?.[0]?.url) {
      return getStrapiMedia(product.Galeria[0].url);
    }
    return null;
  }, [product, productCtx?.activeVariationPhotoUrl]);

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

  const isMainQuoteOnly = Boolean(productCtx?.isQuoteOnly) || !productMainPrice || productMainPrice <= 0;
  const isBundleQuoteOnly = isMainQuoteOnly || complementaryList.some((c) => c.isQuoteOnly);
  const productMainInstallments = product.Parcelas || 10;

  // Total do combo (soma produto principal + todos os complementares)
  const bundleTotalOriginal = productMainPrice + complementaryList.reduce((acc, c) => acc + c.price, 0);
  const bundleDiscountPercent = 0;
  const bundleComboPrice = bundleDiscountPercent > 0
    ? bundleTotalOriginal * (1 - bundleDiscountPercent / 100)
    : bundleTotalOriginal;

  const handleAddBundleToCart = () => {
    // 1. Adiciona o produto principal com opções selecionadas
    const options: string[] = [];
    if (productCtx?.hasConfiguracoes && productCtx.selectedConfiguracao) {
      options.push(`Modelo: ${productCtx.selectedConfiguracao.Nome}`);
    }
    if (!isMainQuoteOnly && productCtx?.hasRevestimentos && productCtx.selectedRevestimento && productCtx.selectedCorRevestimento) {
      options.push(`Revestimento: ${productCtx.selectedRevestimento.Nome} (${productCtx.selectedCorRevestimento.Nome_cor})`);
    }
    if (!isMainQuoteOnly && productCtx?.availableColors && productCtx.availableColors.length > 0 && productCtx.selectedColor) {
      options.push(`Cor: ${productCtx.selectedColor}`);
    } else if (!isMainQuoteOnly && !productCtx?.hasRevestimentos && product.Variacoes?.[0]?.Nome_cor) {
      options.push(`Cor: ${product.Variacoes[0].Nome_cor}`);
    }
    if (!isMainQuoteOnly && productCtx?.hasVariationGroups && productCtx.selectedGroupOptions) {
      Object.entries(productCtx.selectedGroupOptions).forEach(([groupTitle, opt]) => {
        options.push(`${groupTitle}: ${opt.Nome}`);
      });
    }
    if (!isMainQuoteOnly && productCtx?.hasMedidas && productCtx.selectedMedida) {
      options.push(`Medida: ${productCtx.selectedMedida.Titulo}`);
    }

    const mainVariationLabel = options.length > 0
      ? options.join(" • ")
      : (productCtx?.variationDisplayName || product.Variacoes?.[0]?.Nome_cor || "Padrão");

    const configKey = productCtx?.selectedConfiguracao ? `cfg:${productCtx.selectedConfiguracao.Nome}` : "";
    const mainCartId = isMainQuoteOnly
      ? `${product.id}-quote-${configKey}-0`
      : `${product.id}-${mainVariationLabel}-0`;

    cart.addItem({
      id: mainCartId,
      productId: product.id,
      name: product.Nome,
      slug: product.slug || product.Nome.toLowerCase(),
      variationName: mainVariationLabel,
      options: options.length > 0 ? options : undefined,
      price: isMainQuoteOnly ? 0 : productMainPrice,
      isQuoteOnly: isMainQuoteOnly,
      imageUrl: productMainImg,
      quantity: 1,
    });

    // 2. Adiciona cada produto complementar com o modelo selecionado
    complementaryList.forEach((comp) => {
      const compVariationLabel = comp.selectedConfig
        ? `Modelo: ${comp.selectedConfig.Nome}`
        : (comp.variation?.Nome_cor || "Padrão");
      const compConfigKey = comp.selectedConfig ? `cfg:${comp.selectedConfig.Nome}` : "";

      cart.addItem({
        id: comp.isQuoteOnly
          ? `${comp.product.id}-quote-${compConfigKey}-${comp.variation?.Nome_cor || "default"}-0`
          : `${comp.product.id}-${compConfigKey}-${comp.variation?.Nome_cor || "default"}-0`,
        productId: comp.product.id,
        name: comp.name,
        slug: comp.product.slug || comp.product.Nome.toLowerCase(),
        variationName: compVariationLabel,
        options: comp.selectedConfig ? [`Modelo: ${comp.selectedConfig.Nome}`] : undefined,
        price: comp.isQuoteOnly ? 0 : comp.price,
        isQuoteOnly: comp.isQuoteOnly,
        imageUrl: comp.imageUrl,
        quantity: 1,
      });
    });
  };

  const handleSelectConfig = (productId: number, configKey: string) => {
    setSelectedConfigMap((prev) => ({
      ...prev,
      [productId]: configKey,
    }));
  };

  // Verifica se algum produto complementar possui múltiplas opções/configurações (modelos)
  const hasAnyComplementaryOptions = useMemo(() => {
    return complementaryList.some((c) => c.configurations && c.configurations.length > 1);
  }, [complementaryList]);

  // Ajuste dinâmico de largura e altura fixa idêntica para todos os cards (compacto sem espaço vazio quando não há opções)
  const isThreeProducts = complementaryList.length >= 2;
  const cardWidthClass = isThreeProducts
    ? "w-[210px] sm:w-[230px] md:w-[245px] xl:w-[275px]"
    : "w-[280px] md:w-[310px] lg:w-[330px] xl:w-[350px]";
  const cardHeightClass = isThreeProducts
    ? (hasAnyComplementaryOptions ? "h-[390px] md:h-[410px]" : "h-[330px] md:h-[350px]")
    : (hasAnyComplementaryOptions ? "h-[400px] md:h-[420px]" : "h-[340px] md:h-[360px]");
  const imageHeightClass = isThreeProducts
    ? "h-[175px] md:h-[195px]"
    : "h-[195px] md:h-[215px]";

  return (
    <section className="w-full mt-10 md:mt-24 px-4 sm:px-6 md:px-0">
      {/* ========================================================================= */}
      {/* VERSÃO DESKTOP: CONTAINER CINZA COM CARDS DE PRODUTO, SÍMBOLOS + E =       */}
      {/* ========================================================================= */}
      <div className="hidden md:block w-full bg-[#F7F7F8] border border-[#EBEBEB] rounded-[15px] p-6 sm:p-8 md:p-8 lg:p-10 xl:p-12 overflow-visible">
        <div className="flex flex-col lg:flex-row items-center justify-start gap-6 lg:gap-8 xl:gap-10 overflow-visible">

          {/* Lado Esquerdo: Cards com items-stretch e altura idêntica absoluta */}
          <div className="flex items-stretch gap-3 sm:gap-4 lg:gap-4 xl:gap-5 shrink-0 max-w-full overflow-visible">

            {/* Card 1: Produto Principal (100% limpo, mesma altura exata do Card 2) */}
            <div className={`${cardWidthClass} bg-white rounded-[16px] md:rounded-[20px] p-4 sm:p-5 md:p-6 shadow-xs border border-gray-100 flex flex-col justify-between ${cardHeightClass} shrink-0`}>
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

              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col justify-between flex-1">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-[11px] font-sans font-semibold uppercase tracking-wider text-[#69736B]">
                    {product.marca?.Nome || "Elements"}
                  </span>
                  <h3 className="text-[13px] md:text-[14px] font-sans font-medium text-[#000000] mt-1 line-clamp-1" title={product.Nome}>
                    {product.Nome}
                  </h3>
                </div>
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
                {/* Símbolo + com self-center para alinhamento vertical perfeito */}
                <span className="text-[26px] md:text-[32px] font-light text-[#000000] select-none shrink-0 px-0.5 sm:px-1 self-center">
                  +
                </span>

                {/* Card Complementar com mesma altura exata e dropdown flutuando por cima */}
                <ComplementaryCard
                  comp={comp}
                  cardWidthClass={cardWidthClass}
                  cardHeightClass={cardHeightClass}
                  imageHeightClass={imageHeightClass}
                  onSelectConfig={handleSelectConfig}
                />
              </React.Fragment>
            ))}

            {/* Símbolo = com self-center */}
            <span className="text-[26px] md:text-[32px] font-light text-[#000000] select-none shrink-0 px-0.5 sm:px-1 self-center">
              =
            </span>
          </div>

          {/* Lado Direito: Resumo do Combo e Ação */}
          <div className="flex flex-col items-start justify-center min-w-[220px] max-w-[280px] shrink-0">
            <h2 className="text-[20px] md:text-[22px] font-heading font-bold text-[#000000] leading-tight">
              Compre junto
            </h2>
            <p className="text-[12px] font-sans text-[#69736B] mt-1 leading-snug">
              Garanta desconto comprando um conjunto de produtos
            </p>

            {/* Lista dos Itens do Combo */}
            <ul className="mt-4 space-y-2 text-[13px] font-sans text-[#000000]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2" />
                <div className="flex flex-col">
                  <span className="leading-tight font-medium">1x {product.Nome}</span>
                  {productCtx?.selectedConfiguracao && (
                    <span className="text-[11px] text-[#69736B] mt-0.5 leading-tight">
                      Modelo: {productCtx.selectedConfiguracao.Nome}
                    </span>
                  )}
                </div>
              </li>
              {complementaryList.map((comp, idx) => (
                <li key={comp.product.id || idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2" />
                  <div className="flex flex-col">
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
                    {comp.selectedConfig && (
                      <span className="text-[11px] text-[#69736B] mt-0.5 leading-tight">
                        Modelo: {comp.selectedConfig.Nome}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Preço do Combo */}
            <div className="mt-3 flex flex-col items-start">
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

            {/* Botão Adicionar Combo ao Carrinho */}
            <button
              type="button"
              onClick={handleAddBundleToCart}
              className="mt-4 py-3 px-6 rounded-full bg-[#222222] hover:bg-[#000000] text-white text-[13px] font-sans font-medium transition-all duration-200 active:scale-[0.99] shadow-xs cursor-pointer text-center whitespace-nowrap"
            >
              Adicionar combo ao carrinho
            </button>
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

        <ul className="mt-3.5 space-y-2.5 text-[12px] font-sans text-[#000000]">
          <li className="flex flex-col gap-1">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
              <span className="leading-tight font-medium">1x {product.Nome}</span>
            </div>
            {productCtx?.selectedConfiguracao && (
              <span className="pl-3.5 text-[11px] text-[#69736B]">
                Modelo: {productCtx.selectedConfiguracao.Nome}
              </span>
            )}
          </li>

          {complementaryList.map((comp, idx) => (
            <li key={comp.product.id || idx} className="flex flex-col gap-1">
              <div className="flex items-start gap-2">
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
              </div>

              {comp.configurations.length > 1 && (
                <div className="relative pl-3.5 mt-1 max-w-[280px]">
                  <button
                    type="button"
                    onClick={() => setMobileOpenId(mobileOpenId === comp.product.id ? null : comp.product.id)}
                    className={`w-full flex items-center justify-between gap-2 bg-[#F7F7F8] border ${
                      mobileOpenId === comp.product.id ? "border-black ring-1 ring-black bg-white" : "border-[#E5E7EB]"
                    } rounded-xl px-2.5 py-1.5 text-left text-[11px] font-sans font-medium text-black`}
                  >
                    <span className="truncate">
                      {comp.selectedConfig?.Nome || "Selecione o modelo"}
                    </span>
                    <div className={`shrink-0 text-stone-400 transition-transform ${
                      mobileOpenId === comp.product.id ? "rotate-180 text-black" : ""
                    }`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {mobileOpenId === comp.product.id && (
                    <div className="absolute left-3.5 right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-1 z-30 max-h-[200px] overflow-y-auto cart-scroll flex flex-col gap-0.5">
                      {comp.configurations.map((c: any) => {
                        const isSelected =
                          String(comp.selectedConfig?.id) === String(c.id) ||
                          comp.selectedConfig?.Nome === c.Nome;
                        return (
                          <button
                            key={c.id || c.Nome}
                            type="button"
                            onClick={() => {
                              handleSelectConfig(comp.product.id, c.id ? String(c.id) : c.Nome);
                              setMobileOpenId(null);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-[11px] font-sans ${
                              isSelected ? "bg-black text-white font-medium" : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <span className="truncate">{c.Nome}</span>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline gap-2.5">
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

        {/* Botão Adicionar Combo ao Carrinho (Mobile) */}
        <button
          type="button"
          onClick={handleAddBundleToCart}
          className="mt-3.5 w-full py-3 px-6 rounded-full bg-[#000000] hover:bg-neutral-800 text-white text-[13px] font-sans font-medium transition-all duration-200 active:scale-[0.99] shadow-xs cursor-pointer text-center"
        >
          Adicionar combo ao carrinho
        </button>
      </div>
    </section>
  );
}
