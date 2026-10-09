import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStrapiURL } from "@/utils/api";
import ProductHero from "@/components/product/ProductHero";
import ProductBanner from "@/components/product/ProductBanner";
import ProductTechSpecs from "@/components/product/ProductTechSpecs";
import ProductAccordion from "@/components/product/ProductAccordion";
import ProductVideo from "@/components/product/ProductVideo";
import ProductCompreJunto from "@/components/product/ProductCompreJunto";
import ProductRelated from "@/components/product/ProductRelated";
import { ProductProvider } from "@/context/ProductContext";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Buscar produtos relacionados da mesma categoria (excluindo o produto atual)
async function getRelatedProducts(
  categoryDocumentId: string | undefined,
  currentProductId: string | number,
  currentDocumentId?: string
) {
  if (!categoryDocumentId) return [];

  try {
    const qs = new URLSearchParams({
      "filters[categoria][documentId][$eq]": categoryDocumentId,
      "filters[Ativo][$ne]": "false",
      "populate[Variacoes][populate]": "*",
      "populate[marca]": "true",
      "populate[categoria]": "true",
      "populate[Imagem_destaque]": "true",
      "populate[Foto_mais_vendidos]": "true",
      "pagination[pageSize]": "20",
    });

    const url = getStrapiURL(`/api/produtos?${qs.toString()}`);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    const items = json.data || [];

    // Filtra para remover o produto atual (por id e documentId)
    return items.filter(
      (p: any) =>
        p.id !== currentProductId &&
        (!currentDocumentId || p.documentId !== currentDocumentId) &&
        p.Ativo !== false
    );
  } catch (error) {
    console.error("Erro ao buscar produtos relacionados:", error);
    return [];
  }
}

// Buscar dados detalhados do produto pelo slug
async function getProductData(slug: string) {
  try {
    const qs = new URLSearchParams({
      "filters[slug][$eq]": slug,
      "filters[Ativo][$ne]": "false",
      "populate[Variacoes][populate]": "*",
      "populate[garantias]": "true",
      "populate[categoria]": "true",
      "populate[marca]": "true",
      "populate[Imagem_destaque]": "true",
      "populate[Foto_mais_vendidos]": "true",
      "populate[Imagem_recursos]": "true",
      "populate[Imagem_recursos_mobile]": "true",
      "populate[Especificacoes]": "true",
      "populate[Medidas]": "true",
      "populate[Dimensoes]": "true",
      "populate[Foto_fixa_acordeao]": "true",
      "populate[Itens_acordeao]": "true",
      "populate[Video_arquivo]": "true",
      "populate[Thumbnail_video]": "true",
      "populate[produtos_compre_junto][populate][Variacoes][populate]": "*",
      "populate[produtos_compre_junto][populate][marca]": "true",
      "populate[produtos_compre_junto][populate][Imagem_destaque]": "true",
      "populate[produtos_compre_junto][populate][Foto_mais_vendidos]": "true",
    });

    const url = getStrapiURL(`/api/produtos?${qs.toString()}`);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.data || json.data.length === 0) {
      // Tentativa alternativa caso o slug tenha sido passado com traço ou sublinhado diferente
      const fallbackSlug = slug.includes("-") ? slug.replace(/-/g, "_") : slug.replace(/_/g, "-");
      const qsFallback = new URLSearchParams({
        "filters[slug][$eq]": fallbackSlug,
        "filters[Ativo][$ne]": "false",
        "populate[Variacoes][populate]": "*",
        "populate[garantias]": "true",
        "populate[categoria]": "true",
        "populate[marca]": "true",
        "populate[Imagem_destaque]": "true",
        "populate[Foto_mais_vendidos]": "true",
        "populate[Imagem_recursos]": "true",
        "populate[Imagem_recursos_mobile]": "true",
        "populate[Especificacoes]": "true",
        "populate[Medidas]": "true",
        "populate[Dimensoes]": "true",
        "populate[Foto_fixa_acordeao]": "true",
        "populate[Itens_acordeao]": "true",
        "populate[Video_arquivo]": "true",
        "populate[Thumbnail_video]": "true",
        "populate[produtos_compre_junto][populate][Variacoes][populate]": "*",
        "populate[produtos_compre_junto][populate][marca]": "true",
        "populate[produtos_compre_junto][populate][Imagem_destaque]": "true",
        "populate[produtos_compre_junto][populate][Foto_mais_vendidos]": "true",
      });
      const resFallback = await fetch(getStrapiURL(`/api/produtos?${qsFallback.toString()}`), { cache: "no-store" });
      if (resFallback.ok) {
        const jsonFallback = await resFallback.json();
        if (jsonFallback.data && jsonFallback.data.length > 0) {
          return jsonFallback.data[0];
        }
      }
      return null;
    }

    return json.data[0];
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductData(slug);

  if (!product || product.Ativo === false) {
    return {
      title: "Produto não encontrado - Haka",
    };
  }

  return {
    title: `${product.Nome} - Haka`,
    description: product.Subtitulo || "Detalhes do produto na loja Haka",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const product = await getProductData(slug);
  if (!product || product.Ativo === false) {
    notFound();
  }

  const category = product.categoria;
  const relatedProducts = await getRelatedProducts(
    category?.documentId,
    product.id,
    product.documentId
  );

  return (
    <ProductProvider product={product}>
      <div className="w-full min-h-screen bg-white text-[#000000] px-0 md:px-8 min-[1600px]:px-0 flex justify-center">
        {/* Container Principal com largura de 1600px e espaçamento otimizado para mobile e desktop */}
        <div className="w-full max-w-[1600px] pt-26 sm:pt-24 md:pt-32 pb-24 md:pb-28 flex flex-col gap-6 md:gap-8">

          {/* Breadcrumb de navegação (Comentado para uso futuro caso necessário)
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12px] md:text-[13px] font-sans text-[#69736B]">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            {category && (
              <>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="hover:text-black transition-colors"
                >
                  {category.Nome}
                </Link>
                <span className="text-gray-300">/</span>
              </>
            )}
            <span className="text-[#000000] font-medium line-clamp-1">
              {product.Nome}
            </span>
          </nav>
          */}

          {/* Hero do Produto (Galeria + Variações + Garantia + Compra) */}
          <div className="w-full order-1">
            <ProductHero product={product} />
          </div>

          {/* 1. Banner 100% no Container */}
          <div className="w-full order-2 md:order-3">
            <ProductBanner product={product} />
          </div>

          {/* 2. Player de Vídeo Institucional */}
          <div className="w-full order-3 md:order-6">
            <ProductVideo product={product} />
          </div>

          {/* 3. Informações em Drop / Componentes em Detalhes */}
          <div className="w-full order-4 md:order-5">
            <ProductAccordion product={product} />
          </div>

          {/* 4. 50% Título e Texto + 50% Tabela Tabeada / Especificações Técnicas */}
          <div className="w-full order-5 md:order-4">
            <ProductTechSpecs product={product} />
          </div>

          {/* 5. Seção Compre Junto (no desktop fica logo abaixo do Hero; no mobile vem por último) */}
          <div className="w-full order-6 md:order-2">
            <ProductCompreJunto product={product} />
          </div>

          {/* 6. Seção Veja Também (Produtos da mesma categoria, por último na página) */}
          {relatedProducts.length > 0 && (
            <div className="w-full order-7">
              <ProductRelated products={relatedProducts} />
            </div>
          )}

        </div>
      </div>
    </ProductProvider>
  );
}
