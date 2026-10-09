"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

export default function FeaturedProduct({ data }: { data: any }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data) return null;

  const {
    Subtitulo,
    NomeProduto,
    TituloLateral,
    DescricaoLateral,
    ImagemPrincipal,
    Caracteristicas,
  } = data;

  // Determina qual imagem mostrar
  const currentImageObj =
    activeIndex !== null && Caracteristicas?.[activeIndex]?.Imagem
      ? Caracteristicas[activeIndex].Imagem
      : ImagemPrincipal;

  const imageUrl = getStrapiMedia(currentImageObj?.url);

  return (
    <section className="w-full bg-white py-16 md:py-24 px-[17px] md:px-8 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[1600px] flex flex-col gap-10 md:gap-10">

        {/* Top Header (Subtitulo e Nome do Produto) */}
        <div className="flex items-baseline gap-3 text-[#000000]">
          {Subtitulo && (
            <span className="text-[12px] md:text-[14px] font-sans tracking-wide text-[#69736B]">
              {Subtitulo}
            </span>
          )}
          {Subtitulo && NomeProduto && (
            <span className="text-[12px] md:text-[14px] font-sans text-[#69736B]">&bull;</span>
          )}
          {NomeProduto && (
            <h2 className="text-[24px] md:text-[40px] font-heading font-medium">
              {NomeProduto}
            </h2>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">

          {/* Mobile Texts (only visible on mobile, order 1) */}
          <div className="flex lg:hidden flex-col gap-4 w-full text-left order-1">
            {TituloLateral && (
              <h3 className="text-[28px] font-heading font-medium text-[#000000] leading-[1.2]">
                {TituloLateral}
              </h3>
            )}
            {DescricaoLateral && (
              <p className="text-[14px] font-sans text-[#69736B] leading-[1.6]">
                {DescricaoLateral}
              </p>
            )}
          </div>

          {/* Left Column - Image (order 2 on mobile, left column on desktop) */}
          <div className="w-full lg:w-1/2 flex items-center justify-center rounded-[24px] aspect-square lg:aspect-auto lg:h-[700px] transition-all duration-500 order-2 lg:order-none">
            {imageUrl ? (
              <div key={imageUrl} className="relative w-full h-full min-h-[300px] animate-image-swap">
                <Image
                  src={imageUrl}
                  alt={currentImageObj?.alternativeText || NomeProduto || "Produto Destaque"}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="text-gray-400 font-sans">Sem imagem</div>
            )}
          </div>

          {/* Right Column - Desktop Texts & Accordion & Mobile Slider (order 3 on mobile) */}
          <div className="w-full lg:w-1/2 flex flex-col lg:flex-row items-start gap-10 lg:gap-20 order-3 lg:order-none">

            {/* Desktop Texts (hidden on mobile) */}
            <div className="hidden lg:flex flex-col gap-4 lg:w-[40%] text-right">
              {TituloLateral && (
                <h3 className="text-[40px] font-heading font-medium text-[#000000] leading-[1.2]">
                  {TituloLateral}
                </h3>
              )}
              {DescricaoLateral && (
                <p className="text-[16px] font-sans text-[#69736B] leading-[1.6]">
                  {DescricaoLateral}
                </p>
              )}
            </div>

            {/* Desktop Accordion (hidden on mobile) */}
            {Caracteristicas && Caracteristicas.length > 0 && (
              <div className="hidden lg:flex flex-col w-full lg:w-[60%] border-t border-gray-200">
                {Caracteristicas.map((item: any, index: number) => {
                  const isOpen = activeIndex === index;

                  return (
                    <div key={index} className="flex flex-col border-b border-gray-200">
                      <button
                        onClick={() => setActiveIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between py-3 md:py-3 text-left focus:outline-none group"
                      >
                        <span className={`text-[14px] md:text-[15px] font-sans transition-colors duration-300 ${isOpen ? 'text-[#000000] font-semibold' : 'text-[#000000] font-semibold group-hover:text-[#000000]'}`}>
                          {item.Nome}
                        </span>
                        <div className={`transform transition-transform duration-300 flex items-center justify-center w-5 h-5 text-[#000000] ${isOpen ? 'rotate-180 text-[#000000]' : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </button>

                      {/* Accordion Content */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mb-5' : 'max-h-0 opacity-0 mb-0'}`}
                      >
                        <p className="text-[13px] md:text-[14px] text-[#69736B] font-sans leading-[1.6] pr-6">
                          {item.Texto}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile Slider (hidden on desktop) */}
            {Caracteristicas && Caracteristicas.length > 0 && (
              <div className="flex lg:hidden flex-col w-full relative -mt-4">
                {/* Navigation Arrows */}
                <div className="flex justify-end gap-3 mb-6 pr-1">
                  <button id="feat-prev" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black transition-colors z-20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button id="feat-next" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black transition-colors z-20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>

                {/* Swiper Slider */}
                <div className="w-[calc(100%+17px)] -mr-[17px] feat-swiper-container">
                  <Swiper
                    modules={[Navigation]}
                    navigation={{ prevEl: '#feat-prev', nextEl: '#feat-next' }}
                    slidesPerView={1.2}
                    spaceBetween={16}
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                    className="feat-swiper"
                  >
                    {Caracteristicas.map((item: any, index: number) => (
                      <SwiperSlide key={index} className="h-auto">
                        <div className="flex flex-col border border-gray-200 rounded-[12px] p-6 h-full bg-white">
                          <strong className="text-[16px] font-semibold text-[#000000] mb-3">
                            {item.Nome}
                          </strong>
                          <p className="text-[14px] text-[#69736B] leading-[1.6]">
                            {item.Texto}
                          </p>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-150px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-image-swap {
          animation: slideInLeft 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .feat-swiper .swiper-wrapper {
          padding-right: 17px;
        }
      `}</style>
    </section>
  );
}
