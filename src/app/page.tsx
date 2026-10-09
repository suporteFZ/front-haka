import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import ShortVideos from "@/components/home/ShortVideos";
import Feedbacks from "@/components/home/Feedbacks";
import FeaturedProduct from "@/components/home/FeaturedProduct";
import BestSellers from "@/components/home/BestSellers";
import Catalog from "@/components/home/Catalog";
import ProjectsCall from "@/components/home/ProjectsCall";
import { getStrapiURL } from "@/utils/api";

async function getHomeData() {
  try {
    const url = getStrapiURL(
      "/api/pagina-home?populate[Banner][populate]=*&populate[Categoria][populate][Categoria][populate]=*&populate[Videos_curtos][populate][Videos][populate]=*&populate[Feedbacks][populate]=*&populate[Projetos][populate][projetos][populate]=*&populate[Produto_destaque][populate][Caracteristicas][populate]=*&populate[Produto_destaque][populate][ImagemPrincipal]=true&populate[Mais_vendidos][populate][produtos][populate][Variacoes][populate]=*&populate[Mais_vendidos][populate][produtos][populate][marca]=true&populate[Mais_vendidos][populate][produtos][populate][garantias]=true&populate[Mais_vendidos][populate][produtos][populate][Foto_mais_vendidos]=true&populate[Catalogo][populate][categorias][populate][Logo_marca]=true"
    );
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Erro ao buscar dados da Home:", error);
    return null;
  }
}

// Buscar produtos marcados com o booleano "Mais_vendido: true" como fallback/garantia
async function getBestSellers() {
  try {
    const url = getStrapiURL(
      "/api/produtos?filters[Mais_vendido][$eq]=true&filters[Ativo][$ne]=false&populate[Variacoes][populate]=*&populate[marca]=true&populate[Imagem_destaque]=true&populate[garantias]=true&populate[Foto_mais_vendidos]=true"
    );
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Erro ao buscar produtos mais vendidos:", error);
    return [];
  }
}

// Buscar produtos ativos para o catálogo (com variações para o hover da segunda foto)
async function getCatalogProducts() {
  try {
    const url = getStrapiURL(
      "/api/produtos?filters[Ativo][$ne]=false&pagination[pageSize]=100&populate[Variacoes][populate]=*&populate[marca]=true&populate[categoria]=true&populate[Imagem_destaque]=true"
    );
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Erro ao buscar produtos do catálogo:", error);
    return [];
  }
}

export default async function Home() {
  const [homeData, bestSellers, catalogProducts] = await Promise.all([
    getHomeData(),
    getBestSellers(),
    getCatalogProducts(),
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
      <ProjectsCall data={homeData.Projetos} />

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
    </div>
  );
}

