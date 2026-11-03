import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getStrapiURL, getStrapiMedia } from "@/utils/api";
import { PostItem, FALLBACK_POSTS } from "@/data/blog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog | Haka Ergonomia & Design Corporativo",
  description:
    "Artigos, dicas sobre ergonomia, tendências em ambientes corporativos e bem-estar no trabalho.",
};

async function getPosts(): Promise<PostItem[]> {
  try {
    const url = getStrapiURL(
      "/api/posts?populate[0]=Banner&sort[0]=createdAt:desc&pagination[pageSize]=20"
    );
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }

    return [];
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="w-full bg-white min-h-screen pt-24 md:pt-32 pb-24">
      <div className="w-full max-w-[1600px] mx-auto px-[17px] md:px-8">
        {/* Cabeçalho da Página */}
        <div className="max-w-2xl mb-10 md:mb-12">
          <h1 className="text-[28px] sm:text-[34px] md:text-[40px] font-heading font-bold text-black tracking-tight leading-[1.15]">
            Blog
          </h1>
          <p className="mt-3 md:mt-4 text-[14px] md:text-[15px] font-sans text-[#666666] leading-relaxed">
            Explore insights sobre ergonomia de ponta, tendências de arquitetura e soluções que transformam espaços corporativos em ambientes de alta performance e bem-estar.
          </p>
        </div>

        {/* Lista / Grid de Posts ou Estado Vazio */}
        {posts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center border border-[#EDEDED] rounded-[24px] bg-white p-8">
            <p className="text-[17px] md:text-[19px] font-heading font-semibold text-black">
              Nenhum artigo publicado no momento.
            </p>
            <p className="text-[13px] md:text-[14px] font-sans text-[#777777] mt-2 max-w-md">
              Assim que novos posts forem cadastrados no Strapi, eles aparecerão aqui automaticamente.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 bg-black text-white text-[13px] md:text-[14px] font-medium font-sans px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
            >
              Voltar para o Início
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post) => {
              const rawCover = post.Banner?.url;
              const coverUrl = rawCover
                ? rawCover.startsWith("http")
                  ? rawCover
                  : getStrapiMedia(rawCover)
                : "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

              return (
                <Link
                  key={post.id || post.slug}
                  href={`/blog/${post.slug}`}
                  className="border border-[#EDEDED] rounded-[24px] bg-white overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-stone-300"
                >
                  {/* Banner / Foto */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-stone-100">
                    <Image
                      src={coverUrl}
                      alt={post.Titulo}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Conteúdo: Título e Resumo */}
                  <div className="p-6 flex flex-col flex-1 justify-between bg-white">
                    <div>
                      <h2 className="text-[18px] md:text-[20px] font-heading font-bold text-black mb-3 group-hover:text-neutral-700 transition-colors leading-snug line-clamp-2">
                        {post.Titulo}
                      </h2>

                      {post.Resumo && (
                        <p className="text-[13px] md:text-[14px] font-sans text-[#777777] leading-relaxed line-clamp-3">
                          {post.Resumo}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#F0F0F0] flex items-center justify-between">
                      <span className="text-[12px] font-sans font-medium text-black group-hover:underline">
                        Ler artigo completo
                      </span>
                      <span className="text-black group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
