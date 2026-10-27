import React from "react";
import { getStrapiURL, fetchStrapi } from "@/utils/api";
import ProductListing from "@/components/common/ProductListing";
import { ProductCardItem } from "@/components/common/ProductCard";
import { expandProductsForListing } from "@/utils/productUtils";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

// Buscar produtos no Strapi por termo de busca
async function getSearchProducts(query: string): Promise<ProductCardItem[]> {
  if (!query) return [];

  try {
    const encoded = encodeURIComponent(query);
    const filterQuery = [
      `filters[$or][0][Nome][$containsi]=${encoded}`,
      `filters[$or][1][Subtitulo][$containsi]=${encoded}`,
      `filters[$or][2][marca][Nome][$containsi]=${encoded}`,
      `filters[$or][3][categoria][Nome][$containsi]=${encoded}`,
      `filters[$or][4][Grupos_variacao][Opcoes][Nome][$containsi]=${encoded}`,
      `filters[$or][5][Configuracoes][Nome][$containsi]=${encoded}`,
    ].join("&");

    const url = getStrapiURL(
      `/api/produtos?filters[Ativo][$ne]=false&${filterQuery}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
    );

    const res = await fetchStrapi(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    let rawItems = json.data || [];

    const totalPages = json.meta?.pagination?.pageCount || 1;
    if (totalPages > 1) {
      const pagePromises = [];
      for (let p = 2; p <= totalPages; p++) {
        const nextUrl = getStrapiURL(
          `/api/produtos?filters[Ativo][$ne]=false&${filterQuery}&pagination[page]=${p}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
        );
        pagePromises.push(
          fetchStrapi(nextUrl, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.data || [])
            .catch(() => [])
        );
      }
      const otherPages = await Promise.all(pagePromises);
      otherPages.forEach((items) => {
        rawItems = rawItems.concat(items);
      });
    }

    return expandProductsForListing(rawItems, query);
  } catch (error) {
    console.error("Erro ao buscar produtos na pesquisa:", error);
    return [];
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const products = query ? await getSearchProducts(query) : [];

  const title = query ? `Resultados para "${query}"` : "Busca";
  const description = query
    ? `${products.length} ${products.length === 1 ? "produto encontrado" : "produtos encontrados"}`
    : "Digite o termo desejado no campo de busca para encontrar produtos.";

  return (
    <ProductListing
      title={title}
      description={description}
      products={products}
      isSearch={true}
    />
  );
}
