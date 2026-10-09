"use client";

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Feedbacks({ data }: { data: any }) {
  if (!data) return null;

  const { Titulo, Carrossel, Destaques } = data;

  return (
    <section className="w-full bg-white py-16 md:py-24 px-[17px] md:px-8 flex items-center justify-center">
      <div className="w-full max-w-[1600px] flex flex-col gap-12 md:gap-16">
        
        {/* Título */}
        {Titulo && (
          <div className="flex flex-col items-center gap-6 md:gap-8">
            <div className="w-[140px] h-px bg-gray-200" />
            <h2 className="text-center text-[28px] md:text-[36px] font-heading font-medium text-[#000000]">
              {Titulo}
            </h2>
          </div>
        )}

        {/* Carrossel Principal */}
        {Carrossel && Carrossel.length > 0 && (
          <div className="relative w-full">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={{
                prevEl: '#feedback-prev',
                nextEl: '#feedback-next',
              }}
              pagination={{
                clickable: true,
                el: '.custom-pagination',
              }}
              slidesPerView={1}
              spaceBetween={30}
              loop={true}
              className="w-full pb-10"
            >
              {Carrossel.map((item: any, index: number) => (
                <SwiperSlide key={index}>
                  <div className="flex flex-col items-center text-center gap-6 md:gap-8 px-14 md:px-24 max-w-[1000px] mx-auto font-sans">
                    <p className="text-[12px] md:text-[24px] text-[#000000] leading-[1.6]">
                      "{item.Texto}"
                    </p>
                    <div className="flex flex-col items-center">
                      <strong className="text-[14px] md:text-[18px] font-bold text-[#000000]">
                        {item.Nome}
                      </strong>
                      <span className="text-[10px] md:text-[14px] text-[#69736B] mt-1 md:mt-0">
                        {item.Cargo}, {item.Empresa}
                      </span>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Setas e Paginação */}
            <button 
              id="feedback-prev"
              className="absolute left-0 top-[40%] -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 hover:text-black z-20"
              aria-label="Anterior"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            
            <button 
              id="feedback-next"
              className="absolute right-0 top-[40%] -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 hover:text-black z-20"
              aria-label="Próximo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            
            <div className="custom-pagination flex justify-center gap-2 mt-6 md:mt-[60px]" />
          </div>
        )}

        {/* Linha Divisória */}
        {Destaques && Destaques.length > 0 && (
          <div className="w-full h-px bg-gray-200" />
        )}

        {/* Destaques (2 Cards) */}
        {Destaques && Destaques.length > 0 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {Destaques.slice(0, 2).map((item: any, index: number) => (
              <div key={index} className="bg-[#FAFAF9] rounded-[16px] p-6 md:p-8 flex flex-col gap-6 font-sans">
                <p className="text-[12px] md:text-[15px] text-[#000000] leading-[1.6] flex-1">
                  "{item.Texto}"
                </p>
                <div className="flex flex-col">
                  <strong className="text-[14px] md:text-[18px] font-bold text-[#000000]">
                    {item.Nome}
                  </strong>
                  <span className="text-[10px] md:text-[14px] text-[#69736B] mt-1 md:mt-0">
                    {item.Cargo}, {item.Empresa}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <style>{`
        .custom-pagination .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          background-color: #D1D5DB;
          opacity: 1;
        }
        .custom-pagination .swiper-pagination-bullet-active {
          background-color: #000000;
        }
      `}</style>
    </section>
  );
}
