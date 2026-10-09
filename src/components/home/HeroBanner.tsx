import Image from "next/image";
import Link from "next/link";
import ScrollDownArrow from "@/components/ScrollDownArrow";
import { getStrapiMedia } from "@/utils/api";

interface HeroBannerProps {
  bannerData: any;
}

export default function HeroBanner({ bannerData }: HeroBannerProps) {
  if (!bannerData) return null;

  const bannerDesktopUrl = getStrapiMedia(bannerData.Desktop?.url) || "";
  const bannerMobileUrl = getStrapiMedia(bannerData.Mobile?.url) || "";

  return (
    <section className="relative w-full h-screen flex flex-col justify-end items-center pb-12">
      {/* Imagem de fundo (Desktop) */}
      {bannerDesktopUrl && (
        <Image
          src={bannerDesktopUrl}
          alt="Banner Home"
          fill
          className="object-cover hidden md:block brightness-[0.7]" 
          priority
        />
      )}

      {/* Imagem de fundo (Mobile) */}
      {bannerMobileUrl && (
        <Image
          src={bannerMobileUrl}
          alt="Banner Home Mobile"
          fill
          className="object-cover block md:hidden brightness-[0.7]"
          priority
        />
      )}

      {/* Gradiente sutil na parte de baixo para garantir a leitura do texto */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent z-0"></div>

      {/* Conteúdo do Banner (Textos e Botão) */}
      <div className="relative z-10 flex flex-col items-center text-center text-white px-[17px] max-w-3xl mb-4 md:mb-8">
        <h1 className="text-[30px] md:text-[56px] font-heading font-medium mb-4 md:mb-8 tracking-tight">
          {bannerData.Texto}
        </h1>
        
        {bannerData.texto_botao && (
          <Link 
            href="/showroom" 
            className="bg-white text-black px-6 py-2.5 md:px-10 md:py-3.5 rounded-full font-medium text-[14px] md:text-[15px] hover:bg-stone-200 transition-colors mb-6 md:mb-12"
          >
            {bannerData.texto_botao}
          </Link>
        )}

        {/* Seta de Scroll usando Lenis programático */}
        <ScrollDownArrow />
      </div>
    </section>
  );
}
