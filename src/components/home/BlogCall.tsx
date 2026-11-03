"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { getStrapiMedia } from "@/utils/api";
import { PostItem } from "@/data/blog";

import "swiper/css";

interface BlogCallProps {
  posts?: PostItem[];
}

export default function BlogCall({ posts }: BlogCallProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  // Limita estritamente a 4 posts na home
  const displayPosts = posts.slice(0, 4);

  const renderPostCard = (post: PostItem) => {
    const rawCover = post.Banner?.url;
    const coverUrl = rawCover
      ? rawCover.startsWith("http")
        ? rawCover
        : getStrapiMedia(rawCover)
      : "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

    return (
      <Link
        href={`/blog/${post.slug}`}
        className="border border-[#EDEDED] rounded-[24px] bg-white overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-stone-300 w-full h-full"
      >
        {/* 1. Foto / Banner */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-stone-100">
          <Image
            src={coverUrl}
            alt={post.Titulo}
            fill
            sizes="(max-width: 640px) 75vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* 2. Conteúdo: Apenas Título e Resumo */}
        <div className="p-5 md:p-6 flex flex-col flex-1 justify-between bg-white">
          <div>
            {/* Título do Post */}
            <h3 className="text-[17px] md:text-[18px] font-heading font-bold text-black mb-2.5 group-hover:text-neutral-700 transition-colors leading-snug line-clamp-2">
              {post.Titulo}
            </h3>

            {/* Resumo */}
            {post.Resumo && (
              <p className="text-[13px] md:text-[14px] font-sans text-[#777777] leading-relaxed line-clamp-3">
                {post.Resumo}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="w-full bg-white py-16 md:py-24 px-[17px] md:px-8 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h2 className="text-[32px] md:text-[42px] font-heading font-semibold text-black leading-[1.12] tracking-tight">
              Blog
            </h2>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[13px] md:text-[14px] font-sans font-medium text-black hover:text-neutral-600 transition-colors group w-fit"
          >
            <span>Ver todos os posts</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </Link>
        </div>

        {/* Slider no Mobile (1 e meio na tela) */}
        <div className="block sm:hidden w-[calc(100%+17px)] -mr-[17px]">
          <Swiper
            slidesPerView={1.42}
            spaceBetween={16}
            slidesOffsetAfter={17}
            breakpoints={{
              320: {
                slidesPerView: 1.32,
                spaceBetween: 14,
              },
              375: {
                slidesPerView: 1.42,
                spaceBetween: 16,
              },
              480: {
                slidesPerView: 1.65,
                spaceBetween: 16,
              },
            }}
            className="w-full !overflow-visible"
          >
            {displayPosts.map((post) => (
              <SwiperSlide key={post.id || post.slug} className="!h-auto flex">
                {renderPostCard(post)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Grid no Desktop / Tablet (a partir de sm) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {displayPosts.map((post) => (
            <div key={post.id || post.slug} className="h-full">
              {renderPostCard(post)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
