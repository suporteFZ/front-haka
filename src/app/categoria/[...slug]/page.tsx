import React from "react";
import { notFound } from "next/navigation";
import { getStrapiURL, fetchStrapi } from "@/utils/api";
import ProductListing from "@/components/common/ProductListing";
import { ProductCardItem } from "@/components/common/ProductCard";
import { expandProductsForListing } from "@/utils/productUtils";

interface CategoryPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Buscar dados da categoria com hierarquia (pais e filhas)
async function getCategoryData(slug: string) {
  try {
    const url = getStrapiURL(
      `/api/categorias?filters[slug][$eq]=${encodeURIComponent(
        slug
      )}&populate[Banner_desktop]=true&populate[Banner_mobile]=true&populate[categoria_pai][populate][categoria_pai]=true&populate[subcategorias]=true`
    );

    const res = await fetchStrapi(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.data || json.data.length === 0) return null;

    return json.data[0];
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    return null;
  }
}

// Buscar produtos vinculados à categoria ou suas subcategorias
async function getCategoryProducts(
  categorySlug: string,
  subcategorySlugs: string[] = []
): Promise<ProductCardItem[]> {
  try {
    const allSlugs = [categorySlug, ...subcategorySlugs].filter(Boolean);

    const orClauses: string[] = [];
    allSlugs.forEach((s) => {
      const enc = encodeURIComponent(s);
      orClauses.push(`filters[$or][${orClauses.length}][categorias][slug][$eq]=${enc}`);
      orClauses.push(`filters[$or][${orClauses.length}][Configuracoes][categorias][slug][$eq]=${enc}`);
    });

    const filterQuery = `&${orClauses.join("&")}`;

    const url = getStrapiURL(
      `/api/produtos?filters[Ativo][$ne]=false${filterQuery}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categorias]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
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
          `/api/produtos?filters[Ativo][$ne]=false${filterQuery}&pagination[page]=${p}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categorias]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
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

    return expandProductsForListing(rawItems, undefined, allSlugs);
  } catch (error) {
    console.error("Erro ao buscar produtos da categoria:", error);
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    notFound();
  }

  // O último slug do array é a categoria atual que estamos visualizando
  const currentSlug = slug[slug.length - 1];
  const category = await getCategoryData(currentSlug);

  if (!category) {
    notFound();
  }

  const subcategories = category.subcategorias || [];
  const subcategorySlugs = subcategories.map((s: any) => s.slug).filter(Boolean);
  const products = await getCategoryProducts(currentSlug, subcategorySlugs);

  return (
    <ProductListing
      title={category.Nome}
      description={category.Texto}
      products={products}
      initialProducts={products}
      categorySlug={currentSlug}
      subcategorySlugs={subcategorySlugs}
    />
  );
}
