import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStrapiURL, fetchStrapi, getStrapiMedia } from "@/utils/api";
import { SITE_URL, generateProductSchema, generateBreadcrumbSchema } from "@/utils/seo";
import JsonLd from "@/components/seo/JsonLd";
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

// Extrai todos os slugs e IDs de categorias da mesma família (categoria atual, pai e subcategorias irmãs)
function extractCategoryFamily(product: any): { slugs: string[]; documentIds: string[] } {
  const slugs = new Set<string>();
  const documentIds = new Set<string>();

  const processCategory = (cat: any) => {
    if (!cat) return;
    if (cat.slug) slugs.add(cat.slug.toLowerCase().trim());
    if (cat.documentId) documentIds.add(cat.documentId);

    // Se a categoria tiver subcategorias vinculadas
    if (Array.isArray(cat.subcategorias)) {
      cat.subcategorias.forEach((sub: any) => {
        if (sub?.slug) slugs.add(sub.slug.toLowerCase().trim());
        if (sub?.documentId) documentIds.add(sub.documentId);
      });
    }

    // Se a categoria tiver uma categoria pai vinculada
    if (cat.categoria_pai) {
      if (cat.categoria_pai.slug) slugs.add(cat.categoria_pai.slug.toLowerCase().trim());
      if (cat.categoria_pai.documentId) documentIds.add(cat.categoria_pai.documentId);

      // As outras subcategorias irmãs sob o mesmo pai
      if (Array.isArray(cat.categoria_pai.subcategorias)) {
        cat.categoria_pai.subcategorias.forEach((sub: any) => {
          if (sub?.slug) slugs.add(sub.slug.toLowerCase().trim());
          if (sub?.documentId) documentIds.add(sub.documentId);
        });
      }
    }
  };

  // Categorias diretas do produto
  if (Array.isArray(product?.categorias)) {
    product.categorias.forEach(processCategory);
  } else if (product?.categoria) {
    processCategory(product.categoria);
  }

  // Categorias presentes nas Configurações do produto
  if (Array.isArray(product?.Configuracoes)) {
    product.Configuracoes.forEach((cfg: any) => {
      if (Array.isArray(cfg?.categorias)) {
        cfg.categorias.forEach(processCategory);
      }
    });
  }

  return {
    slugs: Array.from(slugs),
    documentIds: Array.from(documentIds),
  };
}

// Buscar produtos relacionados da mesma família de categorias (excluindo o produto atual)
async function getRelatedProducts(
  categorySlugs: string[],
  currentProductId: string | number,
  currentDocumentId?: string,
  brandSlug?: string
) {
  try {
    const orClauses: string[] = [];

    // Filtra por categorias da família tanto nas categorias do produto quanto em Configuracoes.categorias
    categorySlugs.slice(0, 50).forEach((slug, idx) => {
      const enc = encodeURIComponent(slug);
      orClauses.push(`filters[$or][0][categorias][slug][$in][${idx}]=${enc}`);
      orClauses.push(`filters[$or][1][Configuracoes][categorias][slug][$in][${idx}]=${enc}`);
    });

    const categoryFilter = orClauses.length > 0 ? `&${orClauses.join("&")}` : "";

    const url = getStrapiURL(
      `/api/produtos?filters[Ativo][$ne]=false${categoryFilter}&pagination[pageSize]=24&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categorias]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
    );

    const res = await fetchStrapi(url, { cache: "no-store" });
    let items: any[] = [];
    if (res.ok) {
      const json = await res.json();
      items = json.data || [];
    }

    // Filtra para remover o produto atual (por id e documentId)
    let filtered = items.filter(
      (p: any) =>
        String(p.id) !== String(currentProductId) &&
        (!currentDocumentId || p.documentId !== currentDocumentId) &&
        p.Ativo !== false
    );

    // Fallback caso a categoria não tenha outros produtos: busca produtos da mesma marca
    if (filtered.length === 0 && brandSlug) {
      const brandUrl = getStrapiURL(
        `/api/produtos?filters[Ativo][$ne]=false&filters[marca][slug][$eq]=${encodeURIComponent(
          brandSlug
        )}&pagination[pageSize]=16&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categorias]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true`
      );
      const brandRes = await fetchStrapi(brandUrl, { cache: "no-store" });
      if (brandRes.ok) {
        const brandJson = await brandRes.json();
        filtered = (brandJson.data || []).filter(
          (p: any) =>
            String(p.id) !== String(currentProductId) &&
            (!currentDocumentId || p.documentId !== currentDocumentId) &&
            p.Ativo !== false
        );
      }
    }

    return filtered;
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
      "populate[Configuracoes][populate]": "*",
      "populate[Opcoes_medida]": "true",
      "populate[Revestimentos][populate][Cores][populate]": "*",
      "populate[Revestimentos][populate][Foto_amostra]": "true",
      "populate[Grupos_variacao][populate][Opcoes][populate]": "*",
      "populate[garantias]": "true",
      "populate[categorias][populate][categoria_pai][populate]": "subcategorias",
      "populate[categorias][populate][subcategorias]": "true",
      "populate[marca]": "true",
      "populate[Imagem_destaque]": "true",
      "populate[Galeria]": "true",
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
      "populate[produtos_compre_junto][populate][Configuracoes][populate]": "*",
      "populate[produtos_compre_junto][populate][Grupos_variacao][populate][Opcoes][populate]": "*",
      "populate[produtos_compre_junto][populate][Variacoes][populate]": "*",
      "populate[produtos_compre_junto][populate][marca]": "true",
      "populate[produtos_compre_junto][populate][Imagem_destaque]": "true",
      "populate[produtos_compre_junto][populate][Foto_mais_vendidos]": "true",
      "populate[produtos_compre_junto][populate][Galeria]": "true",
    });

    const url = getStrapiURL(`/api/produtos?${qs.toString()}`);
    const res = await fetchStrapi(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.data || json.data.length === 0) {
      // Tentativa alternativa caso o slug tenha sido passado com traço ou sublinhado diferente
      const fallbackSlug = slug.includes("-") ? slug.replace(/-/g, "_") : slug.replace(/_/g, "-");
      const qsFallback = new URLSearchParams({
        "filters[slug][$eq]": fallbackSlug,
        "filters[Ativo][$ne]": "false",
        "populate[Variacoes][populate]": "*",
        "populate[Opcoes_medida]": "true",
        "populate[Revestimentos][populate][Cores][populate]": "*",
        "populate[Revestimentos][populate][Foto_amostra]": "true",
        "populate[Grupos_variacao][populate][Opcoes][populate]": "*",
        "populate[garantias]": "true",
        "populate[categorias][populate][categoria_pai][populate]": "subcategorias",
        "populate[categorias][populate][subcategorias]": "true",
        "populate[marca]": "true",
        "populate[Imagem_destaque]": "true",
        "populate[Galeria]": "true",
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
        "populate[produtos_compre_junto][populate][Configuracoes][populate]": "*",
        "populate[produtos_compre_junto][populate][Grupos_variacao][populate][Opcoes][populate]": "*",
        "populate[produtos_compre_junto][populate][Variacoes][populate]": "*",
        "populate[produtos_compre_junto][populate][marca]": "true",
        "populate[produtos_compre_junto][populate][Imagem_destaque]": "true",
        "populate[produtos_compre_junto][populate][Foto_mais_vendidos]": "true",
        "populate[produtos_compre_junto][populate][Galeria]": "true",
      });
      const resFallback = await fetchStrapi(getStrapiURL(`/api/produtos?${qsFallback.toString()}`), { cache: "no-store" });
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
      title: "Produto não encontrado | Haka",
      robots: { index: false, follow: false },
    };
  }

  const rawImage =
    product.Imagem_destaque?.url ||
    product.Foto_mais_vendidos?.url ||
    (Array.isArray(product.Galeria) && product.Galeria[0]?.url);
  const imageUrl = rawImage ? getStrapiMedia(rawImage) : `${SITE_URL}/icon.png`;

  const description =
    product.Subtitulo ||
    `Conheça a cadeira ergonômica ${product.Nome} da Haka. Design inteligente, ergonomia avançada e conforto para ambientes corporativos de alta performance.`;

  return {
    title: `${product.Nome} | Haka - Ergonomia Corporativa`,
    description,
    alternates: {
      canonical: `/produto/${slug}`,
    },
    openGraph: {
      title: `${product.Nome} | Haka`,
      description,
      url: `${SITE_URL}/produto/${slug}`,
      siteName: "Haka",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 800,
          alt: product.Nome,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.Nome} | Haka`,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
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

  const categoryFamily = extractCategoryFamily(product);
  const relatedProducts = await getRelatedProducts(
    categoryFamily.slugs,
    product.id,
    product.documentId,
    product.marca?.slug
  );

  const mainCategory =
    Array.isArray(product.categorias) && product.categorias.length > 0
      ? product.categorias[0]
      : null;

  const breadcrumbs = [
    { name: "Início", url: "/" },
    ...(mainCategory
      ? [{ name: mainCategory.Nome, url: `/categoria/${mainCategory.slug}` }]
      : []),
    { name: product.Nome, url: `/produto/${slug}` },
  ];

  return (
    <ProductProvider product={product}>
      {/* Schemas Schema.org: Product (Google Rich Results) + BreadcrumbList */}
      <JsonLd data={generateProductSchema(product)} />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />

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
