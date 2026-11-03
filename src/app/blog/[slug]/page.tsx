import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStrapiURL, getStrapiMedia } from "@/utils/api";
import { PostItem, FALLBACK_POSTS } from "@/data/blog";
import RichTextRenderer from "@/components/blog/RichTextRenderer";

export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPostBySlug(slug: string): Promise<{
  post: PostItem | null;
  relatedPosts: PostItem[];
}> {
  try {
    // 1. Tenta buscar o post no Strapi pelo slug
    const url = getStrapiURL(
      `/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[0]=Banner`
    );
    const res = await fetch(url, { next: { revalidate: 60 } });

    let post: PostItem | null = null;
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        post = json.data[0];
      }
    }

    // 2. Busca outros posts para a seção "Veja também"
    let relatedPosts: PostItem[] = [];
    if (post) {
      try {
        const relatedUrl = getStrapiURL(
          `/api/posts?filters[slug][$ne]=${encodeURIComponent(slug)}&populate[0]=Banner&sort[0]=createdAt:desc&pagination[pageSize]=3`
        );
        const relRes = await fetch(relatedUrl, { next: { revalidate: 60 } });
        if (relRes.ok) {
          const relJson = await relRes.json();
          if (relJson?.data && Array.isArray(relJson.data) && relJson.data.length > 0) {
            relatedPosts = relJson.data;
          }
        }
      } catch (_) {}
    }

    return { post, relatedPosts };
  } catch (error) {
    console.error("Erro ao buscar post do blog:", error);
    return { post: null, relatedPosts: [] };
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post não encontrado | Haka Blog",
    };
  }

  const rawCover = post.Banner?.url;
  const coverUrl = rawCover
    ? rawCover.startsWith("http")
      ? rawCover
      : getStrapiMedia(rawCover)
    : undefined;

  return {
    title: `${post.Titulo} | Blog Haka`,
    description: post.Resumo || "Artigo exclusivo do blog corporativo Haka.",
    openGraph: {
      title: post.Titulo,
      description: post.Resumo || undefined,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const { post, relatedPosts } = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const rawCover = post.Banner?.url;
  const coverUrl = rawCover
    ? rawCover.startsWith("http")
      ? rawCover
      : getStrapiMedia(rawCover)
    : "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";

  return (
    <article className="w-full bg-white min-h-screen pt-24 md:pt-32 pb-20">
      {/* Container Principal do Artigo: Unificado na mesma largura do texto */}
      <div className="w-full max-w-[800px] mx-auto px-[17px] md:px-6">
        {/* Cabeçalho do Post: Título & Resumo */}
        <header className="w-full mb-6 md:mb-8">
          <h1 className="text-[24px] sm:text-[28px] md:text-[34px] font-heading font-bold text-black leading-tight tracking-tight">
            {post.Titulo}
          </h1>

          {post.Resumo && (
            <p className="mt-3 md:mt-3.5 text-[14px] md:text-[15px] font-sans text-[#666666] leading-relaxed">
              {post.Resumo}
            </p>
          )}
        </header>

        {/* 1. Banner Principal (Reduzido para a mesma largura do texto) */}
        <div className="relative w-full aspect-[16/10] md:aspect-[16/9] rounded-[20px] md:rounded-[28px] overflow-hidden bg-stone-100 mb-10 md:mb-14">
          <Image
            src={coverUrl}
            alt={post.Banner?.alternativeText || post.Titulo}
            fill
            priority
            sizes="(max-width: 800px) 100vw, 800px"
            className="object-cover"
          />
        </div>

        {/* 2. Texto do Artigo */}
        <div className="w-full">
          {post.Texto ? (
            <RichTextRenderer content={post.Texto} />
          ) : (
            <p className="text-[#777777] font-sans text-[15px] italic">
              Este artigo ainda não possui conteúdo detalhado cadastrado.
            </p>
          )}

          {/* Botão de Retorno */}
          <div className="mt-12 pt-4 flex justify-between items-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[14px] font-sans font-medium text-black hover:text-stone-600 transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-200">
                ←
              </span>
              <span>Voltar para todos os artigos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Seção "Veja Também" (Outros Posts) */}
      {relatedPosts.length > 0 && (
        <div className="w-full max-w-[1200px] mx-auto px-[17px] md:px-8">
          <section className="mt-16 md:mt-24 pt-4">
            <h2 className="text-[24px] md:text-[28px] font-heading font-semibold text-black mb-8 tracking-tight">
              Veja também
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => {
                const rawRelCover = related.Banner?.url;
                const relCoverUrl = rawRelCover
                  ? rawRelCover.startsWith("http")
                    ? rawRelCover
                    : getStrapiMedia(rawRelCover)
                  : "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

                return (
                  <Link
                    key={related.id || related.slug}
                    href={`/blog/${related.slug}`}
                    className="border border-[#EDEDED] rounded-[24px] bg-white overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-stone-300"
                  >
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-stone-100">
                      <Image
                        src={relCoverUrl}
                        alt={related.Titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between bg-white">
                      <div>
                        <h3 className="text-[16px] md:text-[17px] font-heading font-bold text-black mb-2 group-hover:text-neutral-700 transition-colors leading-snug line-clamp-2">
                          {related.Titulo}
                        </h3>
                        {related.Resumo && (
                          <p className="text-[13px] font-sans text-[#777777] leading-relaxed line-clamp-2">
                            {related.Resumo}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
