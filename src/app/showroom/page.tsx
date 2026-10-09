import React from "react";
import { Metadata } from "next";
import { getStrapiURL } from "@/utils/api";
import { PaginaShowroomData, FALLBACK_SHOWROOM } from "@/data/showroom";
import ShowroomView from "@/components/showroom/ShowroomView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nosso Showroom | Haka",
  description:
    "Conheça o showroom da Haka. Um espaço onde design, ergonomia e conforto se encontram para planejar seu próximo ambiente de trabalho.",
};

async function getShowroomPageData(): Promise<PaginaShowroomData> {
  try {
    const url = getStrapiURL(
      "/api/pagina-showroom?populate[Hero_imagem_banner]=true&populate[Imersiva_imagem]=true&populate[Imersiva_metricas]=true&populate[Sequencia_thumb]=true&populate[Sequencia_imagens]=true&populate[Sequencia_video_desktop]=true&populate[Sequencia_video_mobile]=true"
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
    };
  } catch (error) {
    console.error("Erro ao buscar dados do Showroom no Strapi:", error);
    return FALLBACK_SHOWROOM;
  }
}

export default async function ShowroomPage() {
  const data = await getShowroomPageData();

  return <ShowroomView data={data} />;
}
