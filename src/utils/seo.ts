import { getStrapiMedia } from "./api";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://haka.com.br";
export const SITE_NAME = "Haka | Ergonomia e Design Corporativo";
export const DEFAULT_DESCRIPTION =
  "Especialista em cadeiras ergonômicas de alta performance, mobiliário corporativo inteligente e soluções de bem-estar para escritórios e home office. Atendimento corporativo em todo o Brasil.";

/**
 * Retorna URL absoluta segura baseada no SITE_URL
 */
export function absoluteUrl(path = ""): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * 1. Schema.org: Organization
 * Representa a empresa, dados de contato, redes e autoridade (GEO e Google Knowledge Graph)
 */
export function generateOrganizationSchema(globalData?: any) {
  const logoUrl = globalData?.Logo?.url
    ? getStrapiMedia(globalData.Logo.url)
    : absoluteUrl("/icon.png");

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Haka Ergonomia & Design Corporativo",
    legalName: "Haka Mobiliário e Ergonomia Ltda",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      caption: "Haka Ergonomia",
    },
    image: logoUrl,
    description: DEFAULT_DESCRIPTION,
    email: "contato@haka.com.br",
    telephone: "+55-45-99999-9999",
    sameAs: [
      "https://www.instagram.com/hakaergonomia",
      "https://www.linkedin.com/company/haka-ergonomia",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+55-45-99999-9999",
        contactType: "customer service",
        areaServed: "BR",
        availableLanguage: ["Portuguese"],
      },
      {
        "@type": "ContactPoint",
        telephone: "+55-45-99999-9999",
        contactType: "sales",
        areaServed: "BR",
        availableLanguage: ["Portuguese"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
    },
  };
}

/**
 * 2. Schema.org: WebSite
 * Define o site oficial e habilita a busca interna para os mecanismos de busca
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Haka",
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/busca?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * 3. Schema.org: Product
 * Validação para resultados enriquecidos do Google (Rich Results) e catálogo para IAs
 */
export function generateProductSchema(product: any) {
  if (!product) return null;

  // Coleta imagens
  const images: string[] = [];
  if (product.Imagem_destaque?.url) {
    images.push(getStrapiMedia(product.Imagem_destaque.url));
  }
  if (product.Foto_mais_vendidos?.url) {
    images.push(getStrapiMedia(product.Foto_mais_vendidos.url));
  }
  if (Array.isArray(product.Galeria)) {
    product.Galeria.forEach((img: any) => {
      if (img?.url) images.push(getStrapiMedia(img.url));
    });
  }
  if (Array.isArray(product.Variacoes)) {
    product.Variacoes.forEach((v: any) => {
      if (v?.Miniatura?.url) images.push(getStrapiMedia(v.Miniatura.url));
    });
  }

  // Preço
  const prices: number[] = (product.Variacoes || [])
    .map((v: any) => v.Preco_promocional || v.Preco || v.Preco_diferenciado)
    .filter((p: any) => typeof p === "number" && p > 0);

  const finalPrice =
    prices.length > 0
      ? Math.min(...prices)
      : product.Preco_promocional || product.Preco || 0;

  const productUrl = absoluteUrl(`/produto/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.Nome,
    image: images.length > 0 ? Array.from(new Set(images)) : [absoluteUrl("/icon.png")],
    description:
      product.Subtitulo ||
      `Cadeira ergonômica corporativa ${product.Nome} da Haka. Design inteligente e ergonomia de alta performance.`,
    sku: `HAKA-${product.id || product.slug}`,
    brand: {
      "@type": "Brand",
      name: product.marca?.Nome || "Haka",
    },
    category:
      Array.isArray(product.categorias) && product.categorias.length > 0
        ? product.categorias[0].Nome
        : "Cadeiras Ergonômicas",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BRL",
      price: finalPrice > 0 ? finalPrice.toFixed(2) : "0.00",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Haka",
      },
    },
  };
}

/**
 * 4. Schema.org: BlogPosting
 * Para artigos do Blog (Resultados enriquecidos de notícias/artigos e GEO para citação por IAs)
 */
export function generateBlogPostingSchema(post: any) {
  if (!post) return null;

  const postUrl = absoluteUrl(`/blog/${post.slug}`);
  const rawCover = post.Banner?.url;
  const coverUrl = rawCover
    ? rawCover.startsWith("http")
      ? rawCover
      : getStrapiMedia(rawCover)
    : absoluteUrl("/icon.png");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    headline: post.Titulo,
    description: post.Resumo || post.Titulo,
    image: [coverUrl],
    datePublished: post.publishedAt || post.createdAt || new Date().toISOString(),
    dateModified: post.updatedAt || post.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "Haka Ergonomia",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Haka Ergonomia & Design Corporativo",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.png"),
      },
    },
    inLanguage: "pt-BR",
  };
}

/**
 * 5. Schema.org: BreadcrumbList
 * Organização semântica das páginas para Google e IAs entenderem a árvore de navegação
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/**
 * 6. Schema.org: LocalBusiness / Showroom
 * Para a página de Showroom (GEO local e Google Maps / Local pack)
 */
export function generateShowroomSchema(data?: any) {
  const showroomUrl = absoluteUrl("/showroom");

  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${showroomUrl}#showroom`,
    name: "Showroom Haka Ergonomia",
    description:
      data?.Hero_descricao ||
      "Espaço físico para experimentar cadeiras ergonômicas de alta performance e mobiliário corporativo da Haka.",
    url: showroomUrl,
    telephone: "+55-45-99999-9999",
    priceRange: "$$$",
    parentOrganization: {
      "@type": "Organization",
      name: "Haka",
      url: SITE_URL,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
    },
  };
}
