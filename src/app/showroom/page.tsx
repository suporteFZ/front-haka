import React from "react";
import { Metadata } from "next";
import { getStrapiURL } from "@/utils/api";
import { PaginaShowroomData, FALLBACK_SHOWROOM } from "@/data/showroom";
import ShowroomView from "@/components/showroom/ShowroomView";
import { SITE_URL, generateShowroomSchema, generateBreadcrumbSchema } from "@/utils/seo";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nosso Showroom | Haka Ergonomia Corporativa",
  description:
    "Conheça o showroom físico da Haka. Um espaço imersivo onde design, ergonomia e conforto se encontram para você vivenciar cadeiras e mobiliário corporativo de alta performance.",
  alternates: {
    canonical: "/showroom",
  },
  openGraph: {
    title: "Nosso Showroom | Haka",
    description:
      "Conheça o showroom físico da Haka. Um espaço imersivo para planejar seu próximo ambiente de trabalho corporativo.",
    url: `${SITE_URL}/showroom`,
    siteName: "Haka",
    type: "website",
  },
};

async function getShowroomPageData(): Promise<PaginaShowroomData> {
  try {
    const url = getStrapiURL(
      "/api/pagina-showroom?populate[Hero_imagem_banner]=true&populate[Imersiva_imagem]=true&populate[Imersiva_metricas]=true&populate[Sequencia_thumb]=true&populate[Sequencia_imagens]=true&populate[Sequencia_imagens_mobile]=true"
    );
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return FALLBACK_SHOWROOM;
    }
    const json = await res.json();
    if (!json?.data) {
      return FALLBACK_SHOWROOM;
    }

    return {
      ...FALLBACK_SHOWROOM,
      ...json.data,
      Imersiva_metricas:
        Array.isArray(json.data.Imersiva_metricas) && json.data.Imersiva_metricas.length > 0
          ? json.data.Imersiva_metricas
          : FALLBACK_SHOWROOM.Imersiva_metricas,
      Sequencia_imagens:
        Array.isArray(json.data.Sequencia_imagens) && json.data.Sequencia_imagens.length > 0
          ? json.data.Sequencia_imagens
          : FALLBACK_SHOWROOM.Sequencia_imagens,
      Sequencia_imagens_mobile:
        Array.isArray(json.data.Sequencia_imagens_mobile) && json.data.Sequencia_imagens_mobile.length > 0
          ? json.data.Sequencia_imagens_mobile
          : [],
    };
  } catch (error) {
    console.error("Erro ao buscar dados do Showroom no Strapi:", error);
    return FALLBACK_SHOWROOM;
  }
}

export default async function ShowroomPage() {
  const data = await getShowroomPageData();

  const breadcrumbs = [
    { name: "Início", url: "/" },
    { name: "Showroom", url: "/showroom" },
  ];

  return (
    <>
      <JsonLd data={generateShowroomSchema(data)} />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <ShowroomView data={data} />
    </>
  );
}
