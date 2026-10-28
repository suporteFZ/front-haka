import React, { Suspense } from "react";
import { Metadata } from "next";
import { getStrapiURL, fetchStrapi } from "@/utils/api";
import ProductListing from "@/components/common/ProductListing";
import { ProductCardItem } from "@/components/common/ProductCard";
import { expandProductsForListing } from "@/utils/productUtils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo Completo | Haka",
  description:
    "Confira todas as opções de mobiliário corporativo, cadeiras e soluções ergonômicas para seu ambiente.",
};

// Buscar todos os produtos ativos do catálogo
async function getAllProducts(): Promise<ProductCardItem[]> {
  try {
    const url = getStrapiURL(
      "/api/produtos?filters[Ativo][$ne]=false&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categorias][populate][categoria_pai]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true"
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
          `/api/produtos?filters[Ativo][$ne]=false&pagination[page]=${p}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categorias][populate][categoria_pai]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
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

    return expandProductsForListing(rawItems);
  } catch (error) {
    console.error("Erro ao buscar todos os produtos do catálogo:", error);
    return [];
  }
}

export default async function AllCategoriesCatalogPage() {
  const products = await getAllProducts();

  return (
    <Suspense fallback={null}>
      <ProductListing
        title="Catálogo Completo"
        description="Confira todas as opções de mobiliário corporativo, cadeiras e soluções para o seu ambiente."
        products={products}
        initialProducts={products}
      />
    </Suspense>
  );
}
