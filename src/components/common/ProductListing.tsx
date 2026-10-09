"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import ProductCard, { ProductCardItem } from "@/components/common/ProductCard";

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface ProductListingProps {
  title: string;
  description?: string | null;
  products?: ProductCardItem[];
  initialProducts?: ProductCardItem[];
  initialPagination?: PaginationMeta;
  searchQuery?: string;
  categorySlug?: string;
  subcategorySlugs?: string[];
  brandSlug?: string;
  brandName?: string;
  isSearch?: boolean;
}

const PRICE_RANGES = [
  { id: "all", label: "Todas as faixas" },
  { id: "0-1500", label: "Até R$ 1.500", min: 0, max: 1500 },
  { id: "1500-3000", label: "R$ 1.500 a R$ 3.000", min: 1500, max: 3000 },
  { id: "3000-5000", label: "R$ 3.000 a R$ 5.000", min: 3000, max: 5000 },
  { id: "5000+", label: "Acima de R$ 5.000", min: 5000, max: Infinity },
];

const SORT_OPTIONS = [
  { id: "default", label: "Padrão" },
  { id: "price-asc", label: "Menor preço" },
  { id: "price-desc", label: "Maior preço" },
  { id: "name-asc", label: "Nome: A - Z" },
  { id: "name-desc", label: "Nome: Z - A" },
];

export default function ProductListing({
  title,
  description,
  products: propProducts,
  initialProducts,
  initialPagination,
  searchQuery,
  categorySlug,
  subcategorySlugs,
  brandSlug,
  brandName,
  isSearch = false,
}: ProductListingProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const effectiveSearchQuery = searchQuery || searchParams?.get("q") || "";
  const effectiveCategorySlug =
    categorySlug ||
    (pathname?.startsWith("/categoria/")
      ? pathname.split("/").filter(Boolean).pop()
      : "");

  const initialItems = initialProducts || propProducts || [];
  const [products, setProducts] = useState<ProductCardItem[]>(initialItems.slice(0, 20));
  // Mantém catálogo de produtos conhecidos para não perder opções de marcas e cores ao filtrar
  const [allProductsCatalog, setAllProductsCatalog] = useState<ProductCardItem[]>(initialItems);
  const [page, setPage] = useState(initialPagination?.page || 1);
  const [pageCount, setPageCount] = useState(
    initialPagination?.pageCount || Math.ceil(initialItems.length / 20) || 1
  );
  const [hasMore, setHasMore] = useState(
    (initialPagination?.page || 1) <
      (initialPagination?.pageCount || Math.ceil(initialItems.length / 20) || 1)
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filtros ativos
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [selectedSort, setSelectedSort] = useState("default");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Estados da Gaveta Mobile
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState("all");
  const [tempBrand, setTempBrand] = useState("all");
  const [tempColor, setTempColor] = useState("all");
  const [mobileExpandedSections, setMobileExpandedSections] = useState<{
    price: boolean;
    brand: boolean;
    color: boolean;
  }>({
    price: false,
    brand: false,
    color: false,
  });

  const toggleMobileSection = (section: "price" | "brand" | "color") => {
    setMobileExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toolbarRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Trava scroll da página quando gavetas mobile estiverem abertas
  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen, isMobileSortOpen]);

  // Fecha dropdowns de desktop ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extrair marcas únicas dos produtos conhecidos do catálogo
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    allProductsCatalog.forEach((p) => {
      if (p.marca?.Nome) brands.add(p.marca.Nome);
    });
    return Array.from(brands).sort((a, b) => a.localeCompare(b));
  }, [allProductsCatalog]);

  // Extrair cores únicas das variações dos produtos conhecidos do catálogo
  const availableColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    allProductsCatalog.forEach((p) => {
      p.Variacoes?.forEach((v: any) => {
        if (v.Nome_cor) {
          colorMap.set(v.Nome_cor, v.Cor_hex || "#888888");
        }
      });
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [allProductsCatalog]);

  // Função para buscar produtos (para paginação ou nova filtragem)
  const fetchProducts = useCallback(
    async (pageToFetch: number, isNewFilter = false) => {
      try {
        const params = new URLSearchParams();
        if (effectiveSearchQuery) params.set("q", effectiveSearchQuery);
        if (effectiveCategorySlug) {
          params.set("category", effectiveCategorySlug);
          if (subcategorySlugs && subcategorySlugs.length > 0) {
            params.set("subcategories", subcategorySlugs.join(","));
          }
        }
        if (brandSlug) {
          params.set("brandSlug", brandSlug);
        } else if (selectedBrand !== "all") {
          params.set("brand", selectedBrand);
        }
        if (selectedColor !== "all") params.set("color", selectedColor);

        if (selectedPriceRange !== "all") {
          const range = PRICE_RANGES.find((r) => r.id === selectedPriceRange);
          if (range?.min !== undefined) params.set("priceMin", String(range.min));
          if (range?.max !== undefined && range.max !== Infinity) {
            params.set("priceMax", String(range.max));
          }
        }

        if (selectedSort !== "default") params.set("sort", selectedSort);

        params.set("page", String(pageToFetch));
        params.set("pageSize", "20");

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) return;

        const json = await res.json();
        const newItems: ProductCardItem[] = json.data || [];
        const meta: PaginationMeta = json.meta?.pagination || {
          page: pageToFetch,
          pageSize: 20,
          pageCount: 1,
          total: newItems.length,
        };

        if (newItems.length > 0) {
          setAllProductsCatalog((prev) => {
            const map = new Map<string, ProductCardItem>();
            prev.forEach((p) => map.set(String(p.id), p));
            newItems.forEach((p) => map.set(String(p.id), p));
            return Array.from(map.values());
          });
        }

        if (isNewFilter) {
          setProducts(newItems);
        } else {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((item) => String(item.id)));
            const filteredNew = newItems.filter(
              (item) => !existingIds.has(String(item.id))
            );
            return [...prev, ...filteredNew];
          });
        }

        setPage(meta.page);
        setPageCount(meta.pageCount);
        setHasMore(meta.page < meta.pageCount);
      } catch (err) {
        console.error("Erro ao carregar mais produtos:", err);
      }
    },
    [effectiveSearchQuery, effectiveCategorySlug, subcategorySlugs, brandSlug, selectedBrand, selectedColor, selectedPriceRange, selectedSort]
  );

  // Resetar quando a busca inicial ou categoria mudar (ex: nova navegação)
  useEffect(() => {
    const items = initialProducts || propProducts || [];
    setProducts(items.slice(0, 20));
    setAllProductsCatalog(items);
    setPage(initialPagination?.page || 1);
    const calculatedPageCount =
      initialPagination?.pageCount || Math.ceil(items.length / 20) || 1;
    setPageCount(calculatedPageCount);
    setHasMore((initialPagination?.page || 1) < calculatedPageCount);
    setSelectedPriceRange("all");
    setSelectedBrand("all");
    setSelectedColor("all");
    setSelectedSort("default");
    isInitialMount.current = true;
  }, [initialProducts, propProducts, initialPagination, effectiveSearchQuery, effectiveCategorySlug, subcategorySlugs, brandSlug]);

  // Recarregar da página 1 quando filtros mudarem
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsLoadingMore(true);
    fetchProducts(1, true).finally(() => {
      setIsLoadingMore(false);
    });
  }, [selectedPriceRange, selectedBrand, selectedColor, selectedSort, fetchProducts]);

  // Infinite Scroll Trigger via IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          fetchProducts(page + 1, false).finally(() => {
            setIsLoadingMore(false);
          });
        }
      },
      {
        rootMargin: "300px",
        threshold: 0.1,
      }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, page, fetchProducts]);

  const hasActiveFilters =
    selectedPriceRange !== "all" ||
    (!brandSlug && selectedBrand !== "all") ||
    selectedColor !== "all" ||
    selectedSort !== "default";

  const handleClearFilters = () => {
    setSelectedPriceRange("all");
    setSelectedBrand("all");
    setSelectedColor("all");
    setSelectedSort("default");
    setOpenDropdown(null);
  };

  return (
    <div className="w-full min-h-screen bg-white text-black pt-24 md:pt-36 pb-20 md:pb-28">
      <div className="w-full max-w-[1600px] mx-auto px-[17px] md:px-8">
        {/* Cabeçalho da Página: Título e Descrição */}
        <div className="flex flex-col">
          <h1 className="text-[32px] md:text-[44px] font-heading font-medium md:font-semibold text-black leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2.5 md:mt-3 text-[13px] md:text-[14px] font-sans text-[#777777] max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Borda dividindo em cima dos filtros */}
        <div className="w-full border-t border-[#EDEDED] mt-6 md:mt-10 mb-5 md:mb-8" />

        {/* ========================================================================= */}
        {/* BARRA DE FILTROS DESKTOP (Centralizada)                                   */}
        {/* ========================================================================= */}
        <div
          ref={toolbarRef}
          className="relative hidden md:flex flex-wrap items-center justify-center gap-6 md:gap-8"
        >
          {/* Dropdown: Faixa de Preço */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "price" ? null : "price")
              }
              className={`flex items-center gap-1.5 text-[13px] md:text-[14px] font-sans cursor-pointer transition-colors ${
                selectedPriceRange !== "all"
                  ? "font-semibold text-black"
                  : "text-stone-800 hover:text-black"
              }`}
            >
              <span>Faixa de Preço</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 text-stone-700 ${
                  openDropdown === "price" ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {openDropdown === "price" && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-2 z-30 flex flex-col gap-1">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => {
                      setSelectedPriceRange(range.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-sans transition-colors cursor-pointer ${
                      selectedPriceRange === range.id
                        ? "bg-stone-100 font-semibold text-black"
                        : "hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown: Marcas */}
          {!brandSlug && (
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "brand" ? null : "brand")
                }
                className={`flex items-center gap-1.5 text-[13px] md:text-[14px] font-sans cursor-pointer transition-colors ${
                  selectedBrand !== "all"
                    ? "font-semibold text-black"
                    : "text-stone-800 hover:text-black"
                }`}
              >
                <span>Marcas</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 text-stone-700 ${
                    openDropdown === "brand" ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {openDropdown === "brand" && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg p-2 z-30 flex flex-col gap-1 max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand("all");
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-sans transition-colors cursor-pointer ${
                      selectedBrand === "all"
                        ? "bg-stone-100 font-semibold text-black"
                        : "hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    Todas as marcas
                  </button>
                  {availableBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(brand);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-sans transition-colors cursor-pointer ${
                        selectedBrand === brand
                          ? "bg-stone-100 font-semibold text-black"
                          : "hover:bg-stone-50 text-stone-700"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dropdown: Cor */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "color" ? null : "color")
              }
              className={`flex items-center gap-1.5 text-[13px] md:text-[14px] font-sans cursor-pointer transition-colors ${
                selectedColor !== "all"
                  ? "font-semibold text-black"
                  : "text-stone-800 hover:text-black"
              }`}
            >
              <span>Cor</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 text-stone-700 ${
                  openDropdown === "color" ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {openDropdown === "color" && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg p-2 z-30 flex flex-col gap-1 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedColor("all");
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-sans transition-colors cursor-pointer ${
                    selectedColor === "all"
                      ? "bg-stone-100 font-semibold text-black"
                      : "hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  Todas as cores
                </button>
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color.name);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-sans transition-colors cursor-pointer flex items-center gap-2 ${
                      selectedColor === color.name
                        ? "bg-stone-100 font-semibold text-black"
                        : "hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown: Ordenar por (com ícone específico de linhas e seta para baixo) */}
          <div className="relative md:ml-4">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "sort" ? null : "sort")
              }
              className={`flex items-center gap-2 text-[13px] md:text-[14px] font-sans cursor-pointer transition-colors ${
                selectedSort !== "default"
                  ? "font-semibold text-black"
                  : "text-stone-800 hover:text-black"
              }`}
            >
              <span>Ordenar por</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-stone-700"
              >
                <path d="M4 6h9" />
                <path d="M4 12h7" />
                <path d="M4 18h5" />
                <path d="M18 7v10" />
                <path d="M15 14l3 3 3-3" />
              </svg>
            </button>

            {openDropdown === "sort" && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg p-2 z-30 flex flex-col gap-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedSort(opt.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-sans transition-colors cursor-pointer ${
                      selectedSort === opt.id
                        ? "bg-stone-100 font-semibold text-black"
                        : "hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão sutil Limpar Filtros quando ativo */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[12px] md:text-[13px] font-sans text-stone-500 hover:text-red-600 underline transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE FILTROS MOBILE (Filtros na esquerda, Ordenar por na direita)     */}
        {/* ========================================================================= */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Botão Filtros */}
          <button
            type="button"
            onClick={() => {
              setTempPriceRange(selectedPriceRange);
              setTempBrand(selectedBrand);
              setTempColor(selectedColor);
              setIsMobileFilterOpen(true);
            }}
            className={`flex items-center gap-1.5 text-[14px] font-sans cursor-pointer transition-colors ${
              hasActiveFilters ? "font-bold text-black" : "text-black"
            }`}
          >
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-black inline-block" />
            )}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-stone-700"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Botão Ordenar por */}
          <button
            type="button"
            onClick={() => setIsMobileSortOpen(true)}
            className="flex items-center gap-1.5 text-[14px] font-sans text-black cursor-pointer"
          >
            <span>Ordenar por</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-stone-700"
            >
              <path d="M4 6h9" />
              <path d="M4 12h7" />
              <path d="M4 18h5" />
              <path d="M18 7v10" />
              <path d="M15 14l3 3 3-3" />
            </svg>
          </button>
        </div>

        {/* Grade de Produtos (2 colunas no Mobile, 4 colunas no Desktop) */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mt-6 md:mt-10">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Sentinel para o Infinite Scroll */}
            <div ref={observerTargetRef} className="h-10 w-full" />

            {/* Loading Spinner discreto */}
            {isLoadingMore && (
              <div className="w-full py-8 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-[18px] font-heading font-medium text-black">
              Nenhum produto encontrado
            </h3>
            <p className="text-[13px] font-sans text-stone-500 max-w-sm mt-1">
              {hasActiveFilters
                ? "Tente ajustar ou limpar os filtros para encontrar o que procura."
                : isSearch
                ? "Não encontramos resultados para esta busca. Tente palavras-chave diferentes."
                : brandName || brandSlug
                ? `Não há produtos disponíveis da marca ${brandName || title} no momento.`
                : "Não há produtos disponíveis nesta categoria no momento."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 px-6 py-2.5 rounded-full bg-black text-white text-[13px] font-sans font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            ) : (
              <Link
                href="/"
                className="mt-4 px-6 py-2.5 rounded-full bg-black text-white text-[13px] font-sans font-medium hover:bg-neutral-800 transition-colors"
              >
                Ver catálogo completo
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GAVETA DE FILTROS MOBILE (Abre da direita com opções e botões no rodapé)  */}
      {/* ========================================================================= */}
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300 ${
          isMobileFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileFilterOpen(false)}
      />

      {/* Drawer */}
      <div
        data-lenis-prevent
        className={`md:hidden fixed top-0 right-0 h-full w-full max-w-md bg-white z-[80] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${
          isMobileFilterOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Top Header da Gaveta */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-[18px] font-heading font-bold text-black">
            Filtros
          </h2>
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-label="Fechar filtros"
            className="p-1 cursor-pointer text-stone-600 hover:text-black transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Conteúdo com scroll das opções de filtro em formato dropdown / acordeão */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-stone-150 flex flex-col">
          {/* Seção Dropdown: Faixa de Preço */}
          <div className="flex flex-col py-3">
            <button
              type="button"
              onClick={() => toggleMobileSection("price")}
              className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
            >
              <div className="flex flex-col">
                <span className="text-[15px] font-heading font-semibold text-black">
                  Faixa de Preço
                </span>
                {tempPriceRange !== "all" && (
                  <span className="text-[12px] font-sans text-stone-500 mt-0.5">
                    {PRICE_RANGES.find((r) => r.id === tempPriceRange)?.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {tempPriceRange !== "all" && (
                  <span className="w-2 h-2 rounded-full bg-black inline-block" />
                )}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-stone-500 transition-transform duration-200 ${
                    mobileExpandedSections.price ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                mobileExpandedSections.price
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pt-2 pb-1 flex flex-col gap-2">
                  {PRICE_RANGES.map((range) => {
                    const isSelected = tempPriceRange === range.id;
                    return (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setTempPriceRange(range.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[13px] font-sans transition-all text-left cursor-pointer ${
                          isSelected
                            ? "border-black bg-stone-50 font-semibold text-black"
                            : "border-stone-200 text-stone-700 hover:border-stone-300"
                        }`}
                      >
                        <span>{range.label}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-black bg-black" : "border-stone-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Seção Dropdown: Marcas */}
          {!brandSlug && availableBrands.length > 0 && (
            <div className="flex flex-col py-3">
              <button
                type="button"
                onClick={() => toggleMobileSection("brand")}
                className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="text-[15px] font-heading font-semibold text-black">
                    Marcas
                  </span>
                  {tempBrand !== "all" && (
                    <span className="text-[12px] font-sans text-stone-500 mt-0.5">
                      {tempBrand}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {tempBrand !== "all" && (
                    <span className="w-2 h-2 rounded-full bg-black inline-block" />
                  )}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-stone-500 transition-transform duration-300 ease-out ${
                      mobileExpandedSections.brand ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  mobileExpandedSections.brand
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pt-2 pb-1 max-h-64 overflow-y-auto pr-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setTempBrand("all")}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[13px] font-sans transition-all text-left cursor-pointer ${
                        tempBrand === "all"
                          ? "border-black bg-stone-50 font-semibold text-black"
                          : "border-stone-200 text-stone-700 hover:border-stone-300"
                      }`}
                    >
                      <span>Todas as marcas</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          tempBrand === "all"
                            ? "border-black bg-black"
                            : "border-stone-300"
                        }`}
                      >
                        {tempBrand === "all" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                    {availableBrands.map((brand) => {
                      const isSelected = tempBrand === brand;
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setTempBrand(brand)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[13px] font-sans transition-all text-left cursor-pointer ${
                            isSelected
                              ? "border-black bg-stone-50 font-semibold text-black"
                              : "border-stone-200 text-stone-700 hover:border-stone-300"
                          }`}
                        >
                          <span>{brand}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-black bg-black"
                                : "border-stone-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seção Dropdown: Cor */}
          {availableColors.length > 0 && (
            <div className="flex flex-col py-3">
              <button
                type="button"
                onClick={() => toggleMobileSection("color")}
                className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="text-[15px] font-heading font-semibold text-black">
                    Cor
                  </span>
                  {tempColor !== "all" && (
                    <span className="text-[12px] font-sans text-stone-500 mt-0.5">
                      {tempColor}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {tempColor !== "all" && (
                    <span className="w-2 h-2 rounded-full bg-black inline-block" />
                  )}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-stone-500 transition-transform duration-300 ease-out ${
                      mobileExpandedSections.color ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  mobileExpandedSections.color
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pt-2 pb-1 max-h-64 overflow-y-auto pr-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setTempColor("all")}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[13px] font-sans transition-all text-left cursor-pointer ${
                        tempColor === "all"
                          ? "border-black bg-stone-50 font-semibold text-black"
                          : "border-stone-200 text-stone-700 hover:border-stone-300"
                      }`}
                    >
                      <span>Todas as cores</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          tempColor === "all"
                            ? "border-black bg-black"
                            : "border-stone-300"
                        }`}
                      >
                        {tempColor === "all" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                    {availableColors.map((color) => {
                      const isSelected = tempColor === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setTempColor(color.name)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[13px] font-sans transition-all text-left cursor-pointer ${
                            isSelected
                              ? "border-black bg-stone-50 font-semibold text-black"
                              : "border-stone-200 text-stone-700 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-4 h-4 rounded-full border border-stone-300 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span>{color.name}</span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-black bg-black"
                                : "border-stone-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo da Gaveta Mobile: Limpar Filtros e Aplicar Filtros */}
        <div className="p-5 pb-8 border-t border-stone-200 bg-white flex items-center gap-3 flex-shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => {
              setTempPriceRange("all");
              setTempBrand("all");
              setTempColor("all");
              setSelectedPriceRange("all");
              setSelectedBrand("all");
              setSelectedColor("all");
              setIsMobileFilterOpen(false);
            }}
            className="flex-1 py-3.5 px-4 rounded-full border border-black text-black bg-white hover:bg-stone-50 active:scale-[0.99] text-[13px] font-sans font-medium transition-all text-center cursor-pointer"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPriceRange(tempPriceRange);
              setSelectedBrand(tempBrand);
              setSelectedColor(tempColor);
              setIsMobileFilterOpen(false);
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-[13px] font-sans font-medium transition-all text-center cursor-pointer"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL / BOTTOM SHEET DE ORDENAR POR MOBILE                                */}
      {/* ========================================================================= */}
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300 ${
          isMobileSortOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileSortOpen(false)}
      />

      {/* Bottom Sheet */}
      <div
        data-lenis-prevent
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[80] transform transition-transform duration-300 ease-out flex flex-col p-5 pb-8 shadow-xl ${
          isMobileSortOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <h3 className="text-[17px] font-heading font-bold text-black">
            Ordenar por
          </h3>
          <button
            type="button"
            onClick={() => setIsMobileSortOpen(false)}
            aria-label="Fechar ordenação"
            className="p-1 cursor-pointer text-stone-600 hover:text-black"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-1 pt-3">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSelectedSort(opt.id);
                setIsMobileSortOpen(false);
              }}
              className={`w-full text-left py-3 px-3 rounded-lg text-[14px] font-sans transition-colors cursor-pointer flex items-center justify-between ${
                selectedSort === opt.id
                  ? "bg-stone-100 font-semibold text-black"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span>{opt.label}</span>
              {selectedSort === opt.id && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
