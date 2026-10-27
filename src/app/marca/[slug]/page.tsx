import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStrapiURL, fetchStrapi } from "@/utils/api";
import ProductListing from "@/components/common/ProductListing";
import { ProductCardItem } from "@/components/common/ProductCard";
import { expandProductsForListing } from "@/utils/productUtils";

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Buscar dados da marca pelo slug (ou Nome como fallback resiliente)
async function getBrandData(slug: string) {
  try {
    const encoded = encodeURIComponent(slug);
    const url = getStrapiURL(
      `/api/marcas?filters[$or][0][slug][$eqi]=${encoded}&filters[$or][1][Nome][$eqi]=${encoded}`
    );

    const res = await fetchStrapi(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.data || json.data.length === 0) return null;

    return json.data[0];
  } catch (error) {
    console.error("Erro ao buscar marca:", error);
    return null;
  }
}

// Buscar produtos vinculados à marca (apenas ativos)
async function getBrandProducts(brandSlug: string): Promise<ProductCardItem[]> {
  try {
    const url = getStrapiURL(
      `/api/produtos?filters[marca][slug][$eqi]=${encodeURIComponent(
        brandSlug
      )}&filters[Ativo][$ne]=false&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
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
          `/api/produtos?filters[marca][slug][$eqi]=${encodeURIComponent(
            brandSlug
          )}&filters[Ativo][$ne]=false&pagination[page]=${p}&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
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
    console.error("Erro ao buscar produtos da marca:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return { title: "Marca | Haka" };

  const brand = await getBrandData(slug);
  if (!brand) return { title: "Marca não encontrada | Haka" };

  return {
    title: `${brand.Nome} | Haka`,
    description: `Confira todos os produtos da marca ${brand.Nome} na Haka. Qualidade, ergonomia e inovação para o seu ambiente.`,
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const brand = await getBrandData(slug);

  if (!brand) {
    notFound();
  }

  const products = await getBrandProducts(brand.slug || slug);

  return (
    <ProductListing
      title={brand.Nome}
      products={products}
      initialProducts={products}
      brandSlug={brand.slug || slug}
      brandName={brand.Nome}
    />
  );
}
