import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStrapiURL } from "@/utils/api";
import ProductListing from "@/components/common/ProductListing";
import { ProductCardItem } from "@/components/common/ProductCard";

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

    const res = await fetch(url, { cache: "no-store" });
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
      )}&filters[Ativo][$ne]=false&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Imagem_destaque]=true&populate[Foto_mais_vendidos]=true`
    );

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    return json.data || [];
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
