"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";

interface CategoryData {
  id: number;
  slug: string;
  Nome: string;
  Texto: string;
  Banner_desktop?: { url: string };
  Banner_mobile?: { url: string };
}

interface FeaturedCategoriesProps {
  data: {
    Titulo: string;
    Subtitulo: string;
    Categoria: CategoryData[];
  };
}

export default function FeaturedCategories({ data }: FeaturedCategoriesProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!data || !data.Categoria) return null;

  return (
    <section id="proxima-secao" className="w-full bg-[#F5F5F3] py-16 md:py-24 px-[17px] md:px-8 flex items-center justify-center">
      <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-[40px] lg:gap-[15px] items-start">

        {/* Left Side: Text */}
        <div className="w-full flex flex-col justify-start pt-0 relative z-20">
          <h2 className="text-[30px] md:text-[40px] font-heading font-medium text-[#000000] leading-[1.2] mb-[14px] md:mb-10 lg:w-[320px]">
            {data.Titulo}
          </h2>
          <p className="text-[#69736B] text-[12px] md:text-[14px] leading-[1.5] font-sans pr-4 lg:pr-8">
            {data.Subtitulo}
          </p>
        </div>

        {/* Right Side: Accordion Cards */}
        <div className="flex flex-row h-auto md:h-[390px] gap-4 md:gap-4 lg:mt-[100px] lg:-ml-[20px] w-[100vw] relative left-1/2 -translate-x-1/2 px-[17px] md:w-full md:left-auto md:translate-x-0 md:px-0 z-10 overflow-x-auto snap-x snap-mandatory md:overflow-visible pb-6 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {data.Categoria.map((cat, index) => {
            const isActive = activeIndex === index;
            // O fallback para mobile é o Banner_mobile se existir
            const imgDesktop = getStrapiMedia(cat.Banner_desktop?.url);
            const imgMobile = getStrapiMedia(cat.Banner_mobile?.url) || imgDesktop;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveIndex(index)}
                className="group relative overflow-hidden rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] flex-none w-[60vw] sm:w-[320px] md:w-auto md:[flex:var(--desktop-flex)] snap-center"
                style={{ "--desktop-flex": isActive ? 2.0625 : 1 } as React.CSSProperties}
              >
                <Link href={`/categoria/${cat.slug}`} className="block w-full h-full">
                  {/* Imagem Desktop */}
                  {imgDesktop && (
                    <Image
                      src={imgDesktop}
                      alt={cat.Nome}
                      fill
                      className="object-cover hidden md:block transition-transform duration-700 md:group-hover:scale-105"
                    />
                  )}

                  {/* Imagem Mobile (renderiza com altura livre baseada na proporção) */}
                  {imgMobile && (
                    <img
                      src={imgMobile}
                      alt={cat.Nome}
                      className="w-full h-auto block md:hidden transition-transform duration-700 md:group-hover:scale-105"
                    />
                  )}

                  {/* Gradiente sutil para garantir a leitura do texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 pointer-events-none" />

                  {/* Texto da Categoria */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-[20px] md:text-[28px] font-heading font-medium leading-[1.2]">
                      {cat.Nome}
                    </h3>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
