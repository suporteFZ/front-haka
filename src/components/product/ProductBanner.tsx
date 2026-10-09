"use client";

import React from "react";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";

interface ProductBannerProps {
  product: any;
}

export default function ProductBanner({ product }: ProductBannerProps) {
  if (!product) return null;

  const desktopImg = product.Imagem_recursos;
  const mobileImg = product.Imagem_recursos_mobile;

  const desktopImgUrl = getStrapiMedia(desktopImg?.url);
  const mobileImgUrl = getStrapiMedia(mobileImg?.url);
  const bannerSrc = desktopImgUrl || mobileImgUrl;

  // Se o banner não estiver cadastrado no Strapi, não renderiza nada
  if (!bannerSrc) {
    return null;
  }

  const dWidth = desktopImg?.width || 1608;
  const dHeight = desktopImg?.height || 576;
  const mWidth = mobileImg?.width || dWidth;
  const mHeight = mobileImg?.height || dHeight;

  return (
    <section className="w-full mt-10 md:mt-16 px-4 sm:px-6 md:px-0">
      <div className="w-full rounded-[10px] md:rounded-[15px] overflow-hidden border border-[#EBEBEB] bg-white">
        {/* Banner Mobile específico se cadastrado */}
        {mobileImgUrl && (
          <Image
            src={mobileImgUrl}
            alt={mobileImg?.alternativeText || product.Nome || "Banner de Recursos do Produto"}
            width={mWidth}
            height={mHeight}
            className="w-full h-auto object-contain block sm:hidden"
            sizes="100vw"
            priority={false}
          />
        )}

        {/* Banner Desktop (ou exibido no mobile se não houver imagem mobile separada) */}
        {desktopImgUrl && (
          <Image
            src={desktopImgUrl}
            alt={desktopImg?.alternativeText || product.Nome || "Banner de Recursos do Produto"}
            width={dWidth}
            height={dHeight}
            className={`w-full h-auto object-contain ${mobileImgUrl ? "hidden sm:block" : "block"}`}
            sizes="(max-width: 1600px) 100vw, 1600px"
            priority={false}
          />
        )}
      </div>
    </section>
  );
}
