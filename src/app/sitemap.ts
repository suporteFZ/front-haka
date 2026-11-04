import type { MetadataRoute } from "next";
import { SITE_URL } from "@/utils/seo";
import { getStrapiURL, fetchStrapi } from "@/utils/api";

export const revalidate = 3600; // Revalida a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Páginas Estáticas e Institucionais
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projetos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/showroom`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // 2. Produtos Dinâmicos
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const url = getStrapiURL(
      "/api/produtos?filters[Ativo][$ne]=false&pagination[pageSize]=100&fields[0]=slug&fields[1]=updatedAt"
    );
    const res = await fetchStrapi(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const products = json?.data || [];
      productEntries = products
        .filter((p: any) => Boolean(p.slug))
        .map((p: any) => ({
          url: `${SITE_URL}/produto/${p.slug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        }));
    }
  } catch (error) {
    console.error("Erro ao gerar sitemap de produtos:", error);
  }

  // 3. Categorias Dinâmicas
  let categoryEntries: MetadataRoute.Sitemap = [];
  try {
    const url = getStrapiURL(
      "/api/categorias?pagination[pageSize]=100&fields[0]=slug&fields[1]=updatedAt"
    );
    const res = await fetchStrapi(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const categories = json?.data || [];
      categoryEntries = categories
        .filter((c: any) => Boolean(c.slug))
        .map((c: any) => ({
          url: `${SITE_URL}/categoria/${c.slug}`,
          lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error("Erro ao gerar sitemap de categorias:", error);
  }

  // 4. Posts do Blog Dinâmicos
  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const url = getStrapiURL(
      "/api/posts?pagination[pageSize]=100&fields[0]=slug&fields[1]=updatedAt"
    );
    const res = await fetchStrapi(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const posts = json?.data || [];
      postEntries = posts
        .filter((post: any) => Boolean(post.slug))
        .map((post: any) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error("Erro ao gerar sitemap de posts:", error);
  }

  // 5. Projetos Dinâmicos
  let projectEntries: MetadataRoute.Sitemap = [];
  try {
    const url = getStrapiURL(
      "/api/projetos?pagination[pageSize]=100&fields[0]=slug&fields[1]=updatedAt"
    );
    const res = await fetchStrapi(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const projects = json?.data || [];
      projectEntries = projects
        .filter((proj: any) => Boolean(proj.slug))
        .map((proj: any) => ({
          url: `${SITE_URL}/projetos/${proj.slug}`,
          lastModified: proj.updatedAt ? new Date(proj.updatedAt) : now,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error("Erro ao gerar sitemap de projetos:", error);
  }

  return [
    ...staticPages,
    ...productEntries,
    ...categoryEntries,
    ...postEntries,
    ...projectEntries,
  ];
}
