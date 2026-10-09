import React from "react";
import { notFound } from "next/navigation";
import { getStrapiURL } from "@/utils/api";
import ProductListing from "@/components/common/ProductListing";
import { ProductCardItem } from "@/components/common/ProductCard";

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

    const res = await fetch(url, { cache: "no-store" });
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

    let filterQuery = "";
    if (allSlugs.length === 1) {
      filterQuery = `&filters[categoria][slug][$eq]=${encodeURIComponent(allSlugs[0])}`;
    } else {
      filterQuery = allSlugs
        .map(
          (s, idx) =>
            `&filters[$or][${idx}][categoria][slug][$eq]=${encodeURIComponent(s)}`
        )
        .join("");
    }

    const url = getStrapiURL(
      `/api/produtos?filters[Ativo][$ne]=false${filterQuery}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Imagem_destaque]=true&populate[Foto_mais_vendidos]=true`
    );

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    return json.data || [];
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
