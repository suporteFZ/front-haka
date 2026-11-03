import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import ShortVideos from "@/components/home/ShortVideos";
import Feedbacks from "@/components/home/Feedbacks";
import FeaturedProduct from "@/components/home/FeaturedProduct";
import BestSellers from "@/components/home/BestSellers";
import Catalog from "@/components/home/Catalog";
import ProjectsCall, { ProjetoItem } from "@/components/home/ProjectsCall";
import BlogCall from "@/components/home/BlogCall";
import { PostItem, FALLBACK_POSTS } from "@/data/blog";
import { getStrapiURL, fetchStrapi } from "@/utils/api";
import { expandProductsForListing } from "@/utils/productUtils";

export const revalidate = 60;

async function getHomeData() {
  const query =
    "/api/pagina-home?populate[Banner][populate]=*&populate[Categoria][populate][Categoria][populate]=*&populate[Videos_curtos][populate][Videos][populate]=*&populate[Feedbacks][populate]=*&populate[Projetos][populate][projetos][populate]=*&populate[Produto_destaque][populate][Caracteristicas][populate]=*&populate[Produto_destaque][populate][ImagemPrincipal]=true&populate[Mais_vendidos][populate][produtos][populate][Variacoes][populate]=*&populate[Mais_vendidos][populate][produtos][populate][marca]=true&populate[Mais_vendidos][populate][produtos][populate][garantias]=true&populate[Mais_vendidos][populate][produtos][populate][Foto_mais_vendidos]=true&populate[Catalogo][populate][categorias][populate][Logo_marca]=true&populate[Catalogo][populate][categorias][populate][subcategorias]=true";
  try {
    const url = getStrapiURL(query);
    const res = await fetchStrapi(url, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (error) {
    console.error("Erro ao buscar dados da Home local:", error);
  }

  // Fallback para o endpoint remoto caso a Home local não tenha sido preenchida no Strapi
  try {
    const prodRes = await fetch(`https://haka-admin.fzcommerce.com.br${query}`, { next: { revalidate: 60 } });
    if (prodRes.ok) {
      const json = await prodRes.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.error("Erro no fallback de produção da Home:", err);
  }

  return null;
}

// Buscar produtos marcados com o booleano "Mais_vendido: true" como fallback/garantia
async function getBestSellers() {
  const query =
    "/api/produtos?filters[Mais_vendido][$eq]=true&filters[Ativo][$ne]=false&populate[Variacoes][populate]=*&populate[marca]=true&populate[Galeria]=true&populate[garantias]=true&populate[Foto_mais_vendidos]=true";
  try {
    const url = getStrapiURL(query);
    const res = await fetchStrapi(url, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && json.data.length > 0) return json.data;
    }
  } catch (error) {
    console.error("Erro ao buscar produtos mais vendidos:", error);
  }

  try {
    const prodRes = await fetch(`https://haka-admin.fzcommerce.com.br${query}`, { next: { revalidate: 60 } });
    if (prodRes.ok) {
      const json = await prodRes.json();
      if (json?.data && json.data.length > 0) return json.data;
    }
  } catch (_) {}

  return [];
}

// Buscar produtos ativos para o catálogo (com variações para o hover da segunda foto e configurações expandidas)
async function getCatalogProducts() {
  const query =
    "/api/produtos?filters[Ativo][$ne]=false&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[Configuracoes][populate]=*&populate[Grupos_variacao][populate][Opcoes][populate]=*&populate[marca]=true&populate[categorias][populate][categoria_pai]=true&populate[Galeria]=true&populate[Foto_mais_vendidos]=true";
  try {
    const url = getStrapiURL(query);
    const res = await fetchStrapi(url, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && json.data.length > 3) {
        return expandProductsForListing(json.data);
      }
    }
  } catch (error) {
    console.error("Erro ao buscar produtos do catálogo:", error);
  }

  try {
    const prodRes = await fetch(`https://haka-admin.fzcommerce.com.br${query}`, { next: { revalidate: 60 } });
    if (prodRes.ok) {
      const json = await prodRes.json();
      return expandProductsForListing(json?.data || []);
    }
  } catch (_) {}

  return [];
}

// Buscar projetos marcados com "Destaque_home: true" (ou primeiros projetos do Strapi)
async function getFeaturedProjects(): Promise<ProjetoItem[]> {
  try {
    // 1. Tenta buscar os 2 últimos projetos marcados com Destaque_home = true
    const url = getStrapiURL(
      "/api/projetos?filters[Destaque_home][$eq]=true&populate[0]=Logo_cliente&populate[1]=Imagem_capa&populate[2]=categorias&sort[0]=createdAt:desc&pagination[pageSize]=2"
    );
    const res = await fetchStrapi(url, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.slice(0, 2);
      }
    }

    // 2. Se nenhum estiver marcado como destaque, busca os 2 últimos projetos postados
    const fallbackUrl = getStrapiURL(
      "/api/projetos?populate[0]=Logo_cliente&populate[1]=Imagem_capa&populate[2]=categorias&sort[0]=createdAt:desc&pagination[pageSize]=2"
    );
    const fallbackRes = await fetch(fallbackUrl, { next: { revalidate: 60 } });
    if (fallbackRes.ok) {
      const fallbackJson = await fallbackRes.json();
      if (fallbackJson?.data && Array.isArray(fallbackJson.data) && fallbackJson.data.length > 0) {
        return fallbackJson.data.slice(0, 2);
      }
    }

    return [];
  } catch (error) {
    console.error("Erro ao buscar projetos em destaque para a home:", error);
    return [];
  }
}

// Buscar os 4 posts mais recentes para a seção de Blog na home
async function getLatestPosts(): Promise<PostItem[]> {
  try {
    const url = getStrapiURL(
      "/api/posts?populate[0]=Banner&sort[0]=createdAt:desc&pagination[pageSize]=4"
    );
    const res = await fetchStrapi(url, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.slice(0, 4);
      }
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar posts para a home:", error);
    return [];
  }
}

export default async function Home() {
  const [homeData, bestSellers, catalogProducts, featuredProjects, latestPosts] = await Promise.all([
    getHomeData(),
    getBestSellers(),
    getCatalogProducts(),
    getFeaturedProjects(),
    getLatestPosts(),
  ]);

  if (!homeData) {
    return <div className="text-white text-center mt-20">Carregando dados...</div>;
  }

  const { Banner, Categoria, Videos_curtos } = homeData;

  return (
    <div className="flex flex-col w-full">
      {/* SEÇÃO BANNER */}
      <HeroBanner bannerData={Banner} />

      {/* PRÓXIMA SEÇÃO: CATEGORIAS EM DESTAQUE */}
      {Categoria && (
        <FeaturedCategories data={Categoria} />
      )}

      {/* SEÇÃO VÍDEOS CURTOS */}
      {Videos_curtos && (
        <ShortVideos data={Videos_curtos} />
      )}

      {/* SEÇÃO FEEDBACKS */}
      {homeData.Feedbacks && (
        <Feedbacks data={homeData.Feedbacks} />
      )}

      {/* SEÇÃO CHAMADA DE PROJETOS / PORTFÓLIO */}
      <ProjectsCall data={homeData.Projetos} featuredProjects={featuredProjects} />

      {/* SEÇÃO PRODUTO DESTAQUE */}
      {homeData.Produto_destaque && (
        <FeaturedProduct data={homeData.Produto_destaque} />
      )}

      {/* SEÇÃO CATÁLOGO (abaixo do produto destaque) */}
      {homeData.Catalogo && (
        <Catalog data={homeData.Catalogo} products={catalogProducts} />
      )}

      {/* SEÇÃO MAIS VENDIDAS */}
      <BestSellers data={homeData.Mais_vendidos} products={bestSellers} />

      {/* SEÇÃO BLOG (4 CARDS: FOTO, TÍTULO E RESUMO) - SÓ APARECE SE HOUVER POSTS CADASTRADOS */}
      {latestPosts && latestPosts.length > 0 && (
        <BlogCall posts={latestPosts} />
      )}
    </div>
  );
}

