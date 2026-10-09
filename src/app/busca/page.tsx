import React from "react";
import { getStrapiURL } from "@/utils/api";
import ProductListing from "@/components/common/ProductListing";
import { ProductCardItem } from "@/components/common/ProductCard";

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
    ].join("&");

    const url = getStrapiURL(
      `/api/produtos?filters[Ativo][$ne]=false&${filterQuery}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Imagem_destaque]=true&populate[Foto_mais_vendidos]=true`
    );

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    return json.data || [];
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
