import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";

interface FooterProps {
  globalData: any;
}

export default function Footer({ globalData }: FooterProps) {
  if (!globalData || !globalData.Footer) return null;

  const { Footer, Logo_branca } = globalData;
  const logoUrl = getStrapiMedia(Logo_branca?.url) || "";
  const bgImage = getStrapiMedia(Footer.cta_imagem_fundo?.url);
  const logoFzUrl = getStrapiMedia(Footer.logo_fz?.url);

  return (
    <footer className="w-full flex flex-col mt-auto bg-black text-white">
      {/* 1. SEÇÃO PRE-FOOTER (CTA) */}
      {/* Se houver bgImage, ele tenta usar. Enquanto o design não manda, forçamos um fundo preto/cinza muito escuro */}
      <div className="relative w-full py-12 md:py-24 px-[17px] md:px-8 flex items-center bg-stone-950 overflow-hidden">
        {/* Placeholder do background enquanto não tem a imagem final */}
        <div className="absolute inset-0 bg-stone-950 z-0"></div>

        {bgImage && (
          <Image
            src={bgImage}
            alt="Fundo CTA"
            fill
            className="object-cover z-0"
          />
        )}

        <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">
          <div className="max-w-2xl w-full">
            <h2 className="text-[26px] md:text-[44px] font-heading font-medium leading-tight mb-4">
              {Footer.cta_titulo}
            </h2>
            <p className="text-[#88948E] md:text-stone-400 text-[14px] md:text-xl font-sans">
              {Footer.cta_descricao}
            </p>
          </div>

          {Footer.cta_texto_botao && (
            <Link
              href={Footer.cta_link_botao || "/"}
              className="w-full md:w-auto justify-center bg-white text-black px-8 py-3.5 rounded-full font-medium text-[14px] md:text-base hover:bg-stone-200 transition-colors flex items-center gap-2"
            >
              {Footer.cta_texto_botao}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </Link>
          )}
        </div>
      </div>

      {/* 2. SEÇÃO FOOTER PRINCIPAL */}
      <div className="w-full bg-black py-16 px-[17px] md:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Topo do Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12 md:mb-16 border-b border-white/10 pb-12 md:pb-16">

            {/* Coluna 1: Logo e Descrição */}
            <div className="flex flex-col gap-6 items-start">
              {logoUrl && (
                <Image src={logoUrl} alt="Haka Logo" width={50} height={50} />
              )}
              <p className="text-stone-400 text-sm max-w-xs font-sans leading-relaxed text-left">
                {Footer.descricao_curta}
              </p>
            </div>

            {/* Coluna 2: Menu */}
            <div className="flex flex-col md:items-center justify-center">
              <nav className="flex flex-col md:flex-row gap-4 md:gap-8 font-sans text-sm font-medium text-left">
                {Footer.menu_links?.map((link: any) => (
                  <Link key={link.id} href="/" className="hover:text-stone-300 transition-colors">
                    {link.Nome}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Coluna 3: Redes Sociais */}
            <div className="flex items-center justify-start md:justify-end gap-4">
              {Footer.redes_sociais?.map((rede: any, idx: number) => (
                <Link key={rede.id} href={rede.Link_rede || "/"} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  {/* Ícone genérico de rede social */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m4.93 4.93 4.24 4.24"></path>
                    <path d="m14.83 9.17 4.24-4.24"></path>
                    <path d="m14.83 14.83 4.24 4.24"></path>
                    <path d="m9.17 14.83-4.24 4.24"></path>
                    <circle cx="12" cy="12" r="4"></circle>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Base do Footer (Copyright e Contato) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-6 text-xs text-stone-500 font-sans">
            
            {/* Contato (No mobile fica em cima do feito com) */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-left order-1 md:order-2">
              <span>{Footer.cidade}</span>
              <span>{Footer.email}</span>
              <span>{Footer.telefone}</span>
            </div>

            {/* Feito com (No mobile fica no meio) */}
            <div className="flex items-center gap-2 order-2 md:order-3">
              <span>Feito com 💛 por</span>
              {logoFzUrl ? (
                <Image src={logoFzUrl} alt="FZ Commerce" width={100} height={20} className="object-contain" />
              ) : (
                <span className="text-white font-bold tracking-wider">FZ COMMERCE</span>
              )}
            </div>

            {/* Copyright (No mobile fica por último) */}
            <p className="order-3 md:order-1 max-w-[280px] md:max-w-none text-left leading-relaxed">
              {Footer.texto_copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
