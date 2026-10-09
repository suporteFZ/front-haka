import React from "react";
import { Metadata } from "next";
import { getStrapiURL } from "@/utils/api";
import { ProjetoItem, CategoriaProjetoItem, FALLBACK_PROJECTS } from "@/data/projects";
import ProjectsView from "@/components/projetos/ProjectsView";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProjetosData(): Promise<{
  projetos: ProjetoItem[];
  categories: CategoriaProjetoItem[];
  headerData: any;
}> {
  try {
    const [projetosRes, paginaRes, categoriasRes] = await Promise.all([
      fetch(
        getStrapiURL(
          "/api/projetos?populate[0]=Logo_cliente&populate[1]=Imagem_capa&populate[2]=Galeria&populate[3]=Itens.Icone&populate[4]=Depoimento&populate[5]=categorias&sort[0]=Ordem:asc&sort[1]=createdAt:desc"
        ),
        { cache: "no-store" }
      ),
      fetch(
        getStrapiURL("/api/pagina-projeto?populate=*"),
        { cache: "no-store" }
      ),
      fetch(
        getStrapiURL("/api/categoria-projetos?sort[0]=Ordem:asc&sort[1]=Nome:asc"),
        { cache: "no-store" }
      ),
    ]);

    let categories: CategoriaProjetoItem[] = [
      { id: 1, Nome: "SICREDI", slug: "sicredi" },
      { id: 2, Nome: "PRIMATO", slug: "primato" },
      { id: 3, Nome: "CORPORATIVO", slug: "corporativo" },
    ];

    if (categoriasRes.ok) {
      const catJson = await categoriasRes.json();
      if (catJson?.data && Array.isArray(catJson.data) && catJson.data.length > 0) {
        categories = catJson.data;
      }
    }

    let projetos = FALLBACK_PROJECTS;
    if (projetosRes.ok) {
      const json = await projetosRes.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        projetos = json.data.map((item: any) => {
          const fallback = FALLBACK_PROJECTS.find((p) => p.slug === item.slug);
          const depoimentoObj = item.Depoimento || {};
          return {
            ...fallback,
            ...item,
            Desafio:
              item.Desafio ||
              (typeof item.Texto === "string" ? item.Texto : null) ||
              fallback?.Desafio ||
              item.Descricao_curta,
            Itens:
              Array.isArray(item.Itens) && item.Itens.length > 0
                ? item.Itens
                : fallback?.Itens,
            categorias:
              Array.isArray(item.categorias) && item.categorias.length > 0
                ? item.categorias
                : fallback?.categorias,
            Depoimento_texto:
              depoimentoObj.Texto ||
              item.Depoimento_texto ||
              fallback?.Depoimento_texto,
            Depoimento_autor:
              depoimentoObj.Autor ||
              item.Depoimento_autor ||
              fallback?.Depoimento_autor,
            Depoimento_cargo:
              depoimentoObj.Cargo ||
              item.Depoimento_cargo ||
              fallback?.Depoimento_cargo,
          };
        });
      }
    }

    let headerData = null;
    if (paginaRes.ok) {
      const paginaJson = await paginaRes.json();
      headerData = paginaJson?.data || null;
    }

    return { projetos, categories, headerData };
  } catch (error) {
    console.error("Erro ao buscar dados de projetos:", error);
    return {
      projetos: FALLBACK_PROJECTS,
      categories: [
        { id: 1, Nome: "SICREDI", slug: "sicredi" },
        { id: 2, Nome: "PRIMATO", slug: "primato" },
        { id: 3, Nome: "CORPORATIVO", slug: "corporativo" },
      ],
      headerData: null,
    };
  }
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { projetos } = await getProjetosData();
  const project = projetos.find((p) => p.slug === slug);

  if (!project) {
    return {
      title: "Projetos Entregues | Haka",
      description: "Conheça os projetos corporativos desenvolvidos pela Haka.",
    };
  }

  return {
    title: `${project.Titulo} | Projetos Haka`,
    description: project.Descricao_curta,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const { projetos, categories, headerData } = await getProjetosData();

  return (
    <ProjectsView
      initialProjects={projetos}
      initialSlug={slug}
      headerData={headerData}
      categories={categories}
    />
  );
}
