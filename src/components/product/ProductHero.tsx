"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";
import { useProduct, VariationGroup, VariationOption, Revestimento, CorRevestimento, OpcaoMedida } from "@/context/ProductContext";
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
  Nome_cor?: string;
  Cor_hex?: string;
  Tamanho?: string;
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
    Galeria?: MediaItem[];
    Variacoes?: Variation[];
    Opcoes_medida?: OpcaoMedida[];
    Revestimentos?: Revestimento[];
    Grupos_variacao?: VariationGroup[];
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
  const productCtx = useProduct();
  const variations = product.Variacoes || [];

  // Revestimentos em 3 Camadas (Material -> Cores com fotos e preços)
  const hasRevestimentos = productCtx?.hasRevestimentos || (product.Revestimentos && product.Revestimentos.length > 0) || false;
  const revestimentos: Revestimento[] = productCtx?.revestimentos || product.Revestimentos || [];
  const selectedRevestimento = productCtx?.selectedRevestimento || (revestimentos.length > 0 ? revestimentos[0] : null);
  const selectedCorRevestimento = productCtx?.selectedCorRevestimento || (selectedRevestimento?.Cores && selectedRevestimento.Cores.length > 0 ? selectedRevestimento.Cores[0] : null);
  const selectRevestimentoAndCor = productCtx?.selectRevestimentoAndCor || (() => {});

  // Controle do acordeão principal de Revestimento e Cor (Camada 1)
  const [isRevestimentoSectionOpen, setIsRevestimentoSectionOpen] = useState(false);

  // Controle dos acordeões dos materiais (Camada 2): se null, todos fechados; se clicar, abre aquele
  const [openMaterialNome, setOpenMaterialNome] = useState<string | null>(null);
  const toggleMaterial = (nome: string) => {
    setOpenMaterialNome((prev) => (prev === nome ? null : nome));
  };

  const hasVariationGroups = productCtx?.hasVariationGroups || (product.Grupos_variacao && product.Grupos_variacao.length > 0) || false;
  const variationGroups: VariationGroup[] = productCtx?.variationGroups || product.Grupos_variacao || [];
  const selectedGroupOptions = productCtx?.selectedGroupOptions || {};
  const selectGroupOption = productCtx?.selectGroupOption || (() => {});
  const activeGroupPhotoUrl = productCtx?.activeGroupPhotoUrl || null;

  // Controle do acordeão principal de Componentes e Acessórios (Pai)
  const [isComponentsSectionOpen, setIsComponentsSectionOpen] = useState(false);

  // Controle dos acordeões dos componentes/acessórios: se null, todos fechados; se clicar, abre aquele
  const [openGroupTitulo, setOpenGroupTitulo] = useState<string | null>(null);
  const toggleGroup = (titulo: string) => {
    setOpenGroupTitulo((prev) => (prev === titulo ? null : titulo));
  };

  const selectedComponentsSummary = useMemo(() => {
    if (!variationGroups || variationGroups.length === 0) return "";
    const parts = variationGroups
      .map((g) => {
        const opt = selectedGroupOptions[g.Titulo];
        return opt ? `${g.Titulo}: ${opt.Nome}` : null;
      })
      .filter(Boolean);
    return parts.join(" • ");
  }, [variationGroups, selectedGroupOptions]);

  // Opções de Medidas / Dimensões (ex: Mesas 100cm, 120cm, etc.)
  const hasMedidas = productCtx?.hasMedidas || (product.Opcoes_medida && product.Opcoes_medida.length > 0) || false;
  const medidas: OpcaoMedida[] = productCtx?.medidas || product.Opcoes_medida || [];
  const [internalSelectedMedida, setInternalSelectedMedida] = useState<OpcaoMedida | null>(
    medidas.length > 0 ? medidas[0] : null
  );
  const selectedMedida = productCtx ? productCtx.selectedMedida : internalSelectedMedida;
  const setSelectedMedida = productCtx ? productCtx.setSelectedMedida : setInternalSelectedMedida;

  const availableColors = productCtx?.availableColors || [];

  // No mobile, quando não tiver os dois primeiros componentes (Cor e Medida), deixar Revestimento e Cor aberto
  useEffect(() => {
    const hasFirstTwo = availableColors.length > 0 || (hasMedidas && medidas.length > 0);
    if (!hasFirstTwo && hasRevestimentos) {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setIsRevestimentoSectionOpen(true);
        if (revestimentos.length > 0) {
          setOpenMaterialNome(selectedRevestimento?.Nome || revestimentos[0].Nome);
        }
      }
    }
  }, [product.id]);

  const selectedColor = productCtx?.selectedColor || null;
  const setSelectedColor = productCtx?.setSelectedColor || (() => {});

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

  // Variação ativa atual (resolvida pelo contexto dinâmico ou fallback)
  const currentVariation: Variation | undefined = productCtx?.selectedVariation || variations[selectedVariationIndex];

  // Imagens da galeria para a variação ativa e opções selecionadas
  const currentGallery: MediaItem[] = useMemo(() => {
    const photos: MediaItem[] = [];

    // 0. Fotos da cor do revestimento ativo (3 camadas)
    if (hasRevestimentos && selectedCorRevestimento) {
      const revPhotos: any[] = selectedCorRevestimento.Galeria && selectedCorRevestimento.Galeria.length > 0
        ? selectedCorRevestimento.Galeria
        : selectedCorRevestimento.Miniatura ? [selectedCorRevestimento.Miniatura] : [];

      for (const img of revPhotos) {
        if (!photos.some((p) => p.url === img.url)) {
          photos.push(img);
        }
      }
    }

    // 1. Fotos da cor/variação ativa da cadeira (cadeiras pré-setadas como Elements)
    if (currentVariation) {
      const varPhotos: MediaItem[] = currentVariation?.Galeria && currentVariation.Galeria.length > 0
        ? currentVariation.Galeria
        : currentVariation?.Miniatura ? [currentVariation.Miniatura] : [];

      for (const img of varPhotos) {
        if (!photos.some((p) => p.url === img.url)) {
          photos.push(img);
        }
      }
    }

    // 2. Galeria de fotos global do produto (fora de variações, para cadastro facilitado)
    if (product.Galeria && Array.isArray(product.Galeria)) {
      for (const img of product.Galeria) {
        if (img?.url && !photos.some((p) => p.url === img.url)) {
          photos.push(img);
        }
      }
    }

    // 3. Fotos das opções selecionadas nos grupos (se houver)
    if (hasVariationGroups) {
      Object.values(selectedGroupOptions).forEach((opt: any) => {
        if (opt.Foto_destaque && !photos.some((p) => p.url === opt.Foto_destaque.url)) {
          photos.push(opt.Foto_destaque);
        }
        if (opt.Galeria && Array.isArray(opt.Galeria)) {
          opt.Galeria.forEach((img: any) => {
            if (img?.url && !photos.some((p) => p.url === img.url)) {
              photos.push(img);
            }
          });
        }
        if (opt.Foto && !photos.some((p) => p.url === opt.Foto.url)) {
          photos.push(opt.Foto);
        }
      });
    }

    // 4. Imagem principal de destaque do produto
    const mainImg = product.Imagem_destaque;
    if (mainImg && !photos.some((p) => p.url === mainImg.url)) {
      photos.push(mainImg);
    }

    // 5. Outras fotos para enriquecer a navegação (outros revestimentos e variações)
    if (hasRevestimentos) {
      for (const rev of revestimentos) {
        if (!rev.Cores) continue;
        for (const cor of rev.Cores) {
          if (cor.Nome_cor === selectedCorRevestimento?.Nome_cor) continue;
          if (cor.Galeria && cor.Galeria.length > 0) {
            for (const img of cor.Galeria) {
              if (!photos.some((p) => p.url === img.url)) {
                photos.push(img as MediaItem);
              }
            }
          }
        }
      }
    }

    for (const v of variations) {
      if (v === currentVariation) continue;
      if (v.Galeria && v.Galeria.length > 0) {
        for (const img of v.Galeria) {
          if (!photos.some((p) => p.url === img.url)) {
            photos.push(img);
          }
        }
      }
    }

    if (photos.length > 0) return photos;
    return [];
  }, [hasRevestimentos, selectedCorRevestimento, revestimentos, currentVariation, product.Galeria, hasVariationGroups, selectedGroupOptions, product.Imagem_destaque, variations]);

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

  // Preço base e regular (suporta revestimentos em 3 camadas, cores legadas e grupos modulares)
  const basePrice = useMemo(() => {
    let base = 0;
    let additionalFromRevestimento = 0;

    // 0. Revestimento ativo (3 camadas)
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

    // 0.5. Medida selecionada (define preço base ou tem acréscimo)
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

    // 1. Preço da cor ativa da cadeira (legado)
    if (base === 0) {
      if (currentVariation?.Preco_promocional && Number(currentVariation.Preco_promocional) > 0) {
        base = Number(currentVariation.Preco_promocional);
      } else if (currentVariation?.Preco && Number(currentVariation.Preco) > 0) {
        base = Number(currentVariation.Preco);
      } else if (currentVariation?.Preco_diferenciado && Number(currentVariation.Preco_diferenciado) > 0) {
        base = Number(currentVariation.Preco_diferenciado);
      } else if (product.Preco_promocional && Number(product.Preco_promocional) > 0) {
        base = Number(product.Preco_promocional);
      } else if (product.Preco && Number(product.Preco) > 0) {
        base = Number(product.Preco);
      }
    }

    // 2. Se não achou na cor nem na raiz, busca em opções dos grupos
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

    // 3. Adicionais dos grupos + adicional do revestimento + adicional da medida
    const additionalFromGroups = hasVariationGroups
      ? Object.values(selectedGroupOptions).reduce(
          (sum, opt) => sum + (Number(opt.Preco_adicional) || 0),
          0
        )
      : 0;

    const totalAdditional = additionalFromRevestimento + additionalFromGroups + additionalFromMedida;

    return base > 0 ? base + totalAdditional : (totalAdditional > 0 ? totalAdditional : 0);
  }, [hasRevestimentos, selectedCorRevestimento, currentVariation, product, hasVariationGroups, selectedGroupOptions, hasMedidas, selectedMedida]);

  const regularPrice = useMemo(() => {
    let reg = 0;
    let additionalFromRevestimento = 0;

    // 0. Revestimento ativo (3 camadas)
    if (hasRevestimentos && selectedCorRevestimento) {
      if (selectedCorRevestimento.Preco && Number(selectedCorRevestimento.Preco) > 0) {
        reg = Number(selectedCorRevestimento.Preco);
      } else if (selectedCorRevestimento.Preco_diferenciado && Number(selectedCorRevestimento.Preco_diferenciado) > 0) {
        reg = Number(selectedCorRevestimento.Preco_diferenciado);
      }
      if (selectedCorRevestimento.Preco_adicional && Number(selectedCorRevestimento.Preco_adicional) > 0) {
        additionalFromRevestimento = Number(selectedCorRevestimento.Preco_adicional);
      }
    }

    // 0.5. Medida selecionada (regular)
    let additionalFromMedida = 0;
    if (hasMedidas && selectedMedida) {
      if (selectedMedida.Preco && Number(selectedMedida.Preco) > 0) {
        reg = Number(selectedMedida.Preco);
      } else if (selectedMedida.Preco_promocional && Number(selectedMedida.Preco_promocional) > 0) {
        reg = Number(selectedMedida.Preco_promocional);
      }
      if (selectedMedida.Preco_adicional && Number(selectedMedida.Preco_adicional) > 0) {
        additionalFromMedida = Number(selectedMedida.Preco_adicional);
      }
    }

    // 1. Preço regular da cor ativa da cadeira (legado)
    if (reg === 0) {
      if (currentVariation?.Preco && Number(currentVariation.Preco) > 0) {
        reg = Number(currentVariation.Preco);
      } else if (currentVariation?.Preco_diferenciado && Number(currentVariation.Preco_diferenciado) > 0) {
        reg = Number(currentVariation.Preco_diferenciado);
      } else if (product.Preco && Number(product.Preco) > 0) {
        reg = Number(product.Preco);
      } else if (product.Preco_promocional && Number(product.Preco_promocional) > 0) {
        reg = Number(product.Preco_promocional);
      }
    }

    const additionalFromGroups = hasVariationGroups
      ? Object.values(selectedGroupOptions).reduce(
          (sum, opt) => sum + (Number(opt.Preco_adicional) || 0),
          0
        )
      : 0;

    const totalAdditional = additionalFromRevestimento + additionalFromGroups + additionalFromMedida;

    return reg > 0 ? reg + totalAdditional : (totalAdditional > 0 ? totalAdditional : 0);
  }, [hasRevestimentos, selectedCorRevestimento, currentVariation, product, hasVariationGroups, selectedGroupOptions, hasMedidas, selectedMedida]);

  const hasDiscount = regularPrice > 0 && basePrice > 0 && basePrice < regularPrice;

  const isQuoteOnly = !basePrice || basePrice <= 0;

  const cart = useCart();

  const handleQuoteRequest = () => {
    const configLines: string[] = [];
    if (hasRevestimentos && selectedRevestimento && selectedCorRevestimento) {
      configLines.push(`• Revestimento: ${selectedRevestimento.Nome} (${selectedCorRevestimento.Nome_cor})${selectedCorRevestimento.Preco_adicional && Number(selectedCorRevestimento.Preco_adicional) > 0 ? ` (+${formatBRL(Number(selectedCorRevestimento.Preco_adicional))})` : ""}`);
    }
    if (availableColors.length > 0 && selectedColor) {
      configLines.push(`• Cor: ${selectedColor}`);
    }
    if (hasVariationGroups) {
      Object.entries(selectedGroupOptions).forEach(([groupTitle, opt]) => {
        configLines.push(`• ${groupTitle}: ${opt.Nome}${opt.Preco_adicional && Number(opt.Preco_adicional) > 0 ? ` (+${formatBRL(Number(opt.Preco_adicional))})` : ""}`);
      });
    }
    if (hasMedidas && selectedMedida) {
      configLines.push(`• Medida: ${selectedMedida.Titulo}${selectedMedida.Preco_adicional && Number(selectedMedida.Preco_adicional) > 0 ? ` (+${formatBRL(Number(selectedMedida.Preco_adicional))})` : ""}`);
    }

    const configDetails = configLines.length > 0 ? configLines.join("\n") : "";
    const variationLabel = productCtx?.variationDisplayName || (
      currentVariation?.Nome_cor ? `Cor: ${currentVariation.Nome_cor}` : ""
    );

    const msg = `Olá! Gostaria de solicitar um orçamento para o produto: *${product.Nome}*${
      configLines.length > 0
        ? `\n\n*Configurações Escolhidas:*\n${configDetails}`
        : (variationLabel ? ` (Variação: ${variationLabel})` : "")
    } - Quantidade: ${quantity}.`;
    const whatsappUrl = `https://wa.me/554530550000?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddToCart = () => {
    const thumbUrl = hasRevestimentos && selectedCorRevestimento
      ? (selectedCorRevestimento.Galeria?.[0] ? getStrapiMedia(selectedCorRevestimento.Galeria[0].url) : (selectedCorRevestimento.Miniatura ? getStrapiMedia(selectedCorRevestimento.Miniatura.url) : activeImageUrl))
      : hasVariationGroups
      ? (activeGroupPhotoUrl || (product.Imagem_destaque?.url ? getStrapiMedia(product.Imagem_destaque.url) : null))
      : (currentVariation?.Miniatura
          ? getStrapiMedia(currentVariation.Miniatura.url)
          : currentVariation?.Galeria && currentVariation.Galeria[0]
          ? getStrapiMedia(currentVariation.Galeria[0].url)
          : activeImageUrl);

    const selectedWarranty = product.garantias?.find((g: any) => g.id === selectedWarrantyId);

    const options: string[] = [];
    if (hasRevestimentos && selectedRevestimento && selectedCorRevestimento) {
      options.push(`Revestimento: ${selectedRevestimento.Nome} (${selectedCorRevestimento.Nome_cor})`);
    }
    if (availableColors.length > 0 && selectedColor) {
      options.push(`Cor: ${selectedColor}`);
    } else if (!hasRevestimentos && currentVariation?.Nome_cor) {
      options.push(`Cor: ${currentVariation.Nome_cor}`);
    }
    if (hasVariationGroups) {
      Object.entries(selectedGroupOptions).forEach(([groupTitle, opt]) => {
        options.push(`${groupTitle}: ${opt.Nome}`);
      });
    }
    if (hasMedidas && selectedMedida) {
      options.push(`Medida: ${selectedMedida.Titulo}`);
    }

    const variationLabel = options.length > 0 ? options.join(" • ") : "Padrão";

    const medidaKey = hasMedidas && selectedMedida ? `medida:${selectedMedida.Titulo}` : "";

    const compositeCartId = hasRevestimentos && selectedRevestimento && selectedCorRevestimento
      ? `${product.id}-${selectedRevestimento.Nome}:${selectedCorRevestimento.Nome_cor}-${Object.entries(selectedGroupOptions).map(([g, o]) => `${g}:${o.Nome}`).join("|")}-${medidaKey}-${selectedWarrantyId || 0}`
      : hasVariationGroups
      ? `${product.id}-${Object.entries(selectedGroupOptions).map(([g, o]) => `${g}:${o.Nome}`).join("|")}-${medidaKey}-${selectedWarrantyId || 0}`
      : `${product.id}-${variationLabel}-${selectedWarrantyId || 0}`;

    cart.addItem({
      id: compositeCartId,
      productId: product.id,
      name: product.Nome,
      slug: product.slug || product.Nome.toLowerCase(),
      variationName: variationLabel,
      options: options.length > 0 ? options : undefined,
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
        <div className="relative w-full flex flex-col items-center md:items-start justify-start">
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
            className={`group relative w-full aspect-square max-w-[950px] max-h-[calc(100vh-140px)] flex items-center justify-center select-none self-start touch-pan-y ${
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
          {/* 1. ESCOLHA DE COR TRADICIONAL / PRÉ-SETADA (Ex: Cadeiras Elements)      */}
          {/* ----------------------------------------------------------------------- */}
          {availableColors.length > 0 && (
            <div className="mt-5 md:mt-7 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] md:text-[15px] font-heading font-semibold text-[#000000]">
                  Cor
                </h2>
                {selectedColor && (
                  <span className="text-[12px] font-sans font-medium text-stone-600">
                    {selectedColor}
                  </span>
                )}
              </div>
              <p className="text-[12px] font-sans text-[#69736B] mt-0.5">
                Encontre a cor que mais combina com seu ambiente
              </p>

              {/* Lista de cards de cores */}
              <div className="mt-3 flex flex-col gap-2.5">
                {availableColors.map((colorObj) => {
                  const isSelected = colorObj.name.toLowerCase() === selectedColor?.toLowerCase();
                  const dotColor = normalizeHex(colorObj.hex);

                  return (
                    <button
                      key={colorObj.name}
                      type="button"
                      onClick={() => {
                        setIsZoomed(false);
                        setSelectedColor(colorObj.name);
                        setActiveImageIndex(0);
                      }}
                      className={`w-full px-4 py-2.5 md:py-3 rounded-[6px] border text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? "border-[#000000] bg-white shadow-xs"
                          : "border-[#D1D5DB] bg-white hover:border-[#9CA3AF]"
                      }`}
                    >
                      {/* Lado esquerdo: Bolinha de cor + Thumbnail opcional + Nome */}
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                          style={{ backgroundColor: dotColor }}
                          aria-hidden="true"
                        />

                        {colorObj.thumbUrl ? (
                          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-black/10 shrink-0">
                            <Image
                              src={colorObj.thumbUrl}
                              alt={colorObj.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : null}

                        <span className="text-[13px] md:text-[14px] font-sans font-medium text-[#000000]">
                          {colorObj.name}
                        </span>
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
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 1.5. OPÇÕES DE MEDIDAS (Tamanhos/Dimensões para Mesas, etc.)             */}
          {/* ----------------------------------------------------------------------- */}
          {hasMedidas && (
            <div className="mt-5 md:mt-7 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] md:text-[15px] font-heading font-semibold text-[#000000]">
                  Medida
                </h2>
                {selectedMedida && (
                  <span className="text-[12px] font-sans font-medium text-stone-600">
                    {selectedMedida.Titulo}
                  </span>
                )}
              </div>
              <p className="text-[12px] font-sans text-[#69736B] mt-0.5">
                Escolha o tamanho ideal para o seu espaço
              </p>

              {/* Lista de cards de medidas */}
              <div className="mt-3 flex flex-col gap-2.5">
                {medidas.map((med) => {
                  const isSelected = selectedMedida?.Titulo === med.Titulo;

                  return (
                    <button
                      key={med.Titulo}
                      type="button"
                      onClick={() => {
                        setIsZoomed(false);
                        setSelectedMedida(med);
                      }}
                      className={`w-full px-4 py-2.5 md:py-3 rounded-[6px] border text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? "border-[#000000] bg-white shadow-xs"
                          : "border-[#D1D5DB] bg-white hover:border-[#9CA3AF]"
                      }`}
                    >
                      {/* Lado esquerdo: Nome da medida + Descrição */}
                      <div className="flex flex-col">
                        <span className="text-[13px] md:text-[14px] font-sans font-medium text-[#000000]">
                          {med.Titulo}
                        </span>
                        {med.Descricao && (
                          <span className="text-[11px] font-sans text-stone-500 mt-0.5">
                            {med.Descricao}
                          </span>
                        )}
                      </div>

                      {/* Lado direito: Preço ou Acréscimo + Radio checkmark */}
                      <div className="flex items-center gap-3 shrink-0">
                        {med.Preco_adicional && Number(med.Preco_adicional) > 0 ? (
                          <span className="text-[12px] font-sans font-medium text-[#006642]">
                            +{formatBRL(Number(med.Preco_adicional))}
                          </span>
                        ) : med.Preco && Number(med.Preco) > 0 ? (
                          <span className="text-[12px] font-sans font-medium text-stone-700">
                            {formatBRL(Number(med.Preco_promocional || med.Preco))}
                          </span>
                        ) : null}

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
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 2. SELEÇÃO DE REVESTIMENTO E COR EM 3 CAMADAS (ESTILO CAVALETTI)        */}
          {/* ----------------------------------------------------------------------- */}
          {hasRevestimentos && (
            <div className="mt-5 md:mt-7 flex flex-col">
              {/* CAMADA 1: ACORDEÃO PRINCIPAL / PAI */}
              <button
                type="button"
                onClick={() => setIsRevestimentoSectionOpen((prev) => !prev)}
                className="w-full flex items-center justify-between border-b border-[#E5E7EB] pb-2 text-left group cursor-pointer transition-colors"
                aria-expanded={isRevestimentoSectionOpen}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] md:text-[16px] font-heading font-medium text-stone-900 group-hover:text-black">
                    Revestimento e cor
                  </span>
                  {selectedRevestimento && selectedCorRevestimento && (
                    <span className="text-[13px] font-sans text-stone-500 font-normal">
                      — {selectedRevestimento.Nome} ({selectedCorRevestimento.Nome_cor})
                    </span>
                  )}
                </div>

                <div className="text-stone-400 group-hover:text-stone-700 transition-colors p-1">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${!isRevestimentoSectionOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
              </button>

              {/* CONTEÚDO DO ACORDEÃO PAI (CAMADAS 2 E 3) */}
              {isRevestimentoSectionOpen && (
                <div className="mt-3.5 flex flex-col">
                  <p className="text-[12px] font-sans text-[#69736B] mb-3">
                    Selecione o tipo de acabamento e a cor ideal para o seu ambiente
                  </p>

                  {/* CAMADA 2: ACORDEÕES SANFONA POR TIPO DE REVESTIMENTO (MATERIAL) */}
                  <div className="flex flex-col gap-2.5">
                    {revestimentos.map((rev) => {
                      const isSelectedRev = selectedRevestimento?.Nome === rev.Nome;
                      const isMaterialOpen = openMaterialNome === rev.Nome;
                      const activeCorInThisRev = isSelectedRev ? selectedCorRevestimento : null;

                      return (
                        <div
                          key={rev.Nome}
                          className={`rounded-[8px] border transition-all overflow-hidden ${
                            isSelectedRev
                              ? "border-stone-900 bg-stone-50/20 shadow-xs"
                              : "border-stone-200 bg-white hover:border-stone-300"
                          }`}
                        >
                          {/* Cabeçalho Sanfona do Material */}
                          <button
                            type="button"
                            onClick={() => toggleMaterial(rev.Nome)}
                            className="w-full px-3.5 py-3 flex items-center justify-between text-left group cursor-pointer transition-colors"
                            aria-expanded={isMaterialOpen}
                          >
                            <div className="flex items-center gap-2.5">
                              {rev.Foto_amostra?.url && getStrapiMedia(rev.Foto_amostra.url) ? (
                                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-black/10 shrink-0">
                                  <Image
                                    src={getStrapiMedia(rev.Foto_amostra.url)!}
                                    alt={rev.Nome}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : null}

                              <div className="flex items-baseline gap-2">
                                <span className={`text-[13px] md:text-[14px] font-sans font-medium ${isSelectedRev ? "text-stone-900" : "text-stone-800 group-hover:text-black"}`}>
                                  {rev.Nome}
                                </span>
                                {rev.Cores && rev.Cores.length > 0 && (
                                  <span className="text-[11px] font-sans text-stone-400">
                                    ({rev.Cores.length} {rev.Cores.length === 1 ? "cor" : "cores"})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {activeCorInThisRev && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700">
                                  {activeCorInThisRev.Cor_hex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/10"
                                      style={{ backgroundColor: normalizeHex(activeCorInThisRev.Cor_hex) }}
                                    />
                                  )}
                                  <span className="text-[11px] font-sans font-medium">
                                    {activeCorInThisRev.Nome_cor}
                                  </span>
                                </div>
                              )}

                              <div className="text-stone-400 group-hover:text-stone-700 transition-colors p-0.5">
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className={`transition-transform duration-200 ${!isMaterialOpen ? "rotate-180" : ""}`}
                                >
                                  <polyline points="18 15 12 9 6 15" />
                                </svg>
                              </div>
                            </div>
                          </button>

                          {/* CAMADA 3: LISTAGEM DE CORES DO REVESTIMENTO (SANFONA ABERTA) */}
                          {isMaterialOpen && rev.Cores && rev.Cores.length > 0 && (
                            <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 flex flex-wrap gap-2 sm:gap-2.5 items-start">
                              {rev.Cores.map((cor) => {
                                const isCorSelected = isSelectedRev && selectedCorRevestimento?.Nome_cor === cor.Nome_cor;
                                const dotColor = normalizeHex(cor.Cor_hex);
                                const thumbImg = cor.Miniatura?.url ? getStrapiMedia(cor.Miniatura.url) : null;

                                return (
                                  <button
                                    key={cor.Nome_cor}
                                    type="button"
                                    onClick={() => {
                                      setIsZoomed(false);
                                      selectRevestimentoAndCor(rev, cor);
                                      setActiveImageIndex(0);
                                    }}
                                    className={`group/cor flex items-center gap-2 px-3 py-2 rounded-[6px] border transition-all cursor-pointer text-left min-h-[46px] ${
                                      isCorSelected
                                        ? "border-stone-900 bg-white ring-1 ring-stone-900 shadow-2xs"
                                        : "border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50/50"
                                    }`}
                                  >
                                    {thumbImg ? (
                                      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-black/10 shrink-0">
                                        <Image
                                          src={thumbImg}
                                          alt={cor.Nome_cor}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                                        style={{ backgroundColor: dotColor }}
                                        aria-hidden="true"
                                      />
                                    )}

                                    <div className="flex flex-col">
                                      <span className={`text-[12px] sm:text-[13px] font-sans ${isCorSelected ? "font-semibold text-stone-900" : "font-normal text-stone-700 group-hover/cor:text-black"}`}>
                                        {cor.Nome_cor}
                                      </span>
                                      {cor.Preco_adicional && Number(cor.Preco_adicional) > 0 ? (
                                        <span className="text-[10px] font-sans text-[#006642] font-medium leading-none mt-0.5">
                                          +{formatBRL(Number(cor.Preco_adicional))}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-sans text-stone-400 font-normal leading-none mt-0.5">
                                          Sem acréscimo
                                        </span>
                                      )}
                                    </div>

                                    {isCorSelected && (
                                      <div className="ml-1 w-3.5 h-3.5 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}



          {/* ----------------------------------------------------------------------- */}
          {/* 3. COMPONENTES E ACESSÓRIOS (ACORDEÃO PAI COM SUB-ACORDEÕES)             */}
          {/* ----------------------------------------------------------------------- */}
          {hasVariationGroups && (
            <div className="mt-5 md:mt-7 flex flex-col">
              {/* CAMADA 1: ACORDEÃO PRINCIPAL / PAI */}
              <button
                type="button"
                onClick={() => setIsComponentsSectionOpen((prev) => !prev)}
                className="w-full flex items-center justify-between border-b border-[#E5E7EB] pb-2 text-left group cursor-pointer transition-colors"
                aria-expanded={isComponentsSectionOpen}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] md:text-[16px] font-heading font-medium text-stone-900 group-hover:text-black">
                    Componentes e Acessórios
                  </span>
                  {selectedComponentsSummary && (
                    <span className="text-[13px] font-sans text-stone-500 font-normal">
                      — {selectedComponentsSummary}
                    </span>
                  )}
                </div>

                <div className="text-stone-400 group-hover:text-stone-700 transition-colors p-1">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${!isComponentsSectionOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
              </button>

              {/* CONTEÚDO DO ACORDEÃO PAI: LISTA DOS SUB-ACORDEÕES DE COMPONENTES */}
              {isComponentsSectionOpen && (
                <div className="mt-3.5 flex flex-col">
                  <p className="text-[12px] font-sans text-[#69736B] mb-3">
                    Personalize os componentes e opcionais da sua cadeira
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {variationGroups.map((group) => {
                      const isGroupOpen = openGroupTitulo === group.Titulo;
                      const currentSelected = selectedGroupOptions[group.Titulo];

                      return (
                        <div
                          key={group.Titulo}
                          className={`rounded-[8px] border transition-all overflow-hidden ${
                            currentSelected
                              ? "border-stone-900 bg-stone-50/20 shadow-xs"
                              : "border-stone-200 bg-white hover:border-stone-300"
                          }`}
                        >
                          {/* Cabeçalho Sanfona do Componente */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.Titulo)}
                            className="w-full px-3.5 py-3 flex items-center justify-between text-left group cursor-pointer transition-colors"
                            aria-expanded={isGroupOpen}
                          >
                            <div className="flex items-baseline gap-2">
                              <span className={`text-[13px] md:text-[14px] font-sans font-medium ${currentSelected ? "text-stone-900" : "text-stone-800 group-hover:text-black"}`}>
                                {group.Titulo}
                              </span>
                              {group.Opcoes && group.Opcoes.length > 0 && (
                                <span className="text-[11px] font-sans text-stone-400">
                                  ({group.Opcoes.length} {group.Opcoes.length === 1 ? "opção" : "opções"})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5">
                              {currentSelected && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700">
                                  {currentSelected.Foto?.url && getStrapiMedia(currentSelected.Foto.url) ? (
                                    <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden border border-black/10 shrink-0">
                                      <Image
                                        src={getStrapiMedia(currentSelected.Foto.url)!}
                                        alt={currentSelected.Nome}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : currentSelected.Cor_hex ? (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/10"
                                      style={{ backgroundColor: normalizeHex(currentSelected.Cor_hex) }}
                                    />
                                  ) : null}
                                  <span className="text-[11px] font-sans font-medium">
                                    {currentSelected.Nome}
                                  </span>
                                </div>
                              )}

                              <div className="text-stone-400 group-hover:text-stone-700 transition-colors">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className={`transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                            </div>
                          </button>

                          {/* Conteúdo: Botões em Pílula */}
                          {isGroupOpen && (
                            <div className="p-3 pt-1 flex flex-wrap gap-2 sm:gap-2.5 items-start">
                              {group.Opcoes?.map((opt) => {
                                const isSelected = currentSelected?.Nome === opt.Nome;
                                const photoUrl = opt.Foto?.url ? getStrapiMedia(opt.Foto.url) : null;
                                const dotColor = normalizeHex(opt.Cor_hex);

                                return (
                                  <button
                                    key={opt.Nome}
                                    type="button"
                                    onClick={() => {
                                      setIsZoomed(false);
                                      selectGroupOption(group.Titulo, opt);
                                      setActiveImageIndex(0);
                                    }}
                                    className={`group/opt flex items-center gap-2 px-3 py-2 rounded-[6px] border transition-all cursor-pointer text-left min-h-[46px] ${
                                      isSelected
                                        ? "border-stone-900 bg-white ring-1 ring-stone-900 shadow-2xs"
                                        : "border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50/50"
                                    }`}
                                  >
                                    {photoUrl ? (
                                      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-black/10 shrink-0">
                                        <Image
                                          src={photoUrl}
                                          alt={opt.Nome}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    ) : opt.Cor_hex ? (
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                                        style={{ backgroundColor: dotColor }}
                                        aria-hidden="true"
                                      />
                                    ) : null}

                                    <div className="flex flex-col">
                                      <span
                                        className={`text-[12px] sm:text-[13px] font-sans ${
                                          isSelected
                                            ? "font-semibold text-stone-900"
                                            : "font-normal text-stone-700 group-hover/opt:text-black"
                                        }`}
                                      >
                                        {opt.Nome}
                                      </span>
                                      {opt.Preco_adicional && Number(opt.Preco_adicional) > 0 ? (
                                        <span className="text-[10px] font-sans text-[#006642] font-medium leading-none mt-0.5">
                                          +{formatBRL(Number(opt.Preco_adicional))}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-sans text-stone-400 font-normal leading-none mt-0.5">
                                          Sem acréscimo
                                        </span>
                                      )}
                                    </div>

                                    {isSelected && (
                                      <div className="ml-1 w-3.5 h-3.5 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                                        <svg
                                          width="8"
                                          height="8"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Borda 100% (Apenas Mobile se houver variações) */}
          {(hasRevestimentos || hasVariationGroups || availableColors.length > 0 || hasMedidas) && (
            <div className="w-auto -mx-4 sm:-mx-6 border-b border-[#E5E7EB] my-5 md:hidden" />
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
