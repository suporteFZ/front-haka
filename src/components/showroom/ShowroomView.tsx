"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";
import { PaginaShowroomData } from "@/data/showroom";
import ScrollSequence from "@/components/showroom/ScrollSequence";

interface ShowroomViewProps {
  data: PaginaShowroomData;
}

export default function ShowroomView({ data }: ShowroomViewProps) {
  // Modal de caminhada virtual
  const [isWalkModalOpen, setIsWalkModalOpen] = useState(false);
  const [walkFrameIndex, setWalkFrameIndex] = useState(0);
  const [isWalkAtEnd, setIsWalkAtEnd] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // 1. Hero Data & Proporção Fiel do Admin
  const heroTag = data.Hero_tag ?? "PORTFÓLIO HAKA";
  const heroTitulo = data.Hero_titulo ?? "Nosso Showroom";
  const heroDescricao =
    data.Hero_descricao ??
    "Conheça o espaço onde design, ergonomia e conforto se encontram. Uma experiência sensorial para planejar seu próximo ambiente de trabalho.";
  
  const heroImageUrl =
    data.Hero_imagem_banner?.url
      ? getStrapiMedia(data.Hero_imagem_banner.url) || data.Hero_imagem_banner.url
      : "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=85";

  // Dimensões originais enviadas no Strapi Admin para manter proporção fiel
  const heroWidth = data.Hero_imagem_banner?.width;
  const heroHeight = data.Hero_imagem_banner?.height;
  const heroAspectRatio =
    heroWidth && heroHeight ? `${heroWidth} / ${heroHeight}` : "2.25 / 1";

  // 2. Experiência Imersiva Data
  const imersivaTag = data.Imersiva_tag ?? "EXPERIÊNCIA IMERSIVA";
  const imersivaTitulo =
    data.Imersiva_titulo ??
    "Um espaço pensado para você vivenciar nossos produtos de perto.";
  const imersivaDescricao =
    data.Imersiva_descricao ??
    "Cada ambiente foi cuidadosamente projetado para inspirar e mostrar as possibilidades.";
  const imersivaImageUrl =
    data.Imersiva_imagem?.url
      ? getStrapiMedia(data.Imersiva_imagem.url) || data.Imersiva_imagem.url
      : "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80";

  const metricas =
    Array.isArray(data.Imersiva_metricas) && data.Imersiva_metricas.length > 0
      ? data.Imersiva_metricas
      : [
          { id: 1, Titulo: "500m²", Subtitulo: "ÁREA DE EXPOSIÇÃO" },
          { id: 2, Titulo: "30+", Subtitulo: "MODELOS EXPOSTOS" },
          { id: 3, Titulo: "100%", Subtitulo: "CONSULTORIA DEDICADA" },
        ];

  // 3. Sequência de Imagens da Caminhada (Estável para evitar re-render loops)
  const sequenciaUrls: string[] = useMemo(() => {
    if (!Array.isArray(data.Sequencia_imagens) || data.Sequencia_imagens.length === 0) return [];
    return data.Sequencia_imagens
      .map((img: any) => getStrapiMedia(img?.url) || img?.url)
      .filter((url): url is string => Boolean(url));
  }, [data.Sequencia_imagens]);

  // 3.1. Vídeos para Caminhada Virtual Híbrida (Desktop e Mobile)
  const videoDesktopUrl = data.Sequencia_video_desktop?.url
    ? getStrapiMedia(data.Sequencia_video_desktop.url) || data.Sequencia_video_desktop.url
    : null;

  const videoMobileUrl = data.Sequencia_video_mobile?.url
    ? getStrapiMedia(data.Sequencia_video_mobile.url) || data.Sequencia_video_mobile.url
    : null;

  const handleWalkProgress = useCallback(
    (_: number, step: number, __: number, state?: { isAtStart: boolean; isAtEnd: boolean }) => {
      setWalkFrameIndex(step);
      if (state) {
        setIsWalkAtEnd(state.isAtEnd);
      }
    },
    []
  );

  const openWalkModal = useCallback(() => {
    setWalkFrameIndex(0);
    setIsWalkAtEnd(false);
    setIsWalkModalOpen(true);
  }, []);

  const handleRestartWalk = useCallback(() => {
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Thumb do banner da sequência
  const thumbUrl =
    data.Sequencia_thumb?.url
      ? getStrapiMedia(data.Sequencia_thumb.url) || data.Sequencia_thumb.url
      : sequenciaUrls[0] ||
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=80";

  const sequenciaTitulo = data.Sequencia_titulo || "Caminhada Virtual pelo Showroom";
  const bannerThumbTitulo =
    data.Sequencia_titulo && data.Sequencia_titulo !== "Caminhada Virtual pelo Showroom"
      ? data.Sequencia_titulo
      : "Clique para caminhar virtualmente";
  const sequenciaSubtitulo =
    data.Sequencia_subtitulo ||
    "Role para explorar cada detalhe dos nossos ambientes integrados e soluções ergonômicas.";

  // 4. CTA Card Data
  const ctaTitulo = data.Cta_titulo || "Quer um projeto personalizado para o seu espaço?";
  const ctaDescricao =
    data.Cta_descricao ||
    "Descubra como otimizar o conforto e a produtividade da sua equipe. Entre em contato com nossos especialistas e receba uma proposta corporativa sob medida.";
  const ctaBotaoTexto = data.Cta_botao_texto || "Solicitar Orçamento";
  const ctaBotaoLink =
    data.Cta_botao_link ||
    "https://wa.me/5545999999999?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20or%C3%A7amento%20personalizado.";

  // Link direto para WhatsApp para marcar visita pessoalmente ao final da caminhada
  // (Puxa exatamente o mesmo link/número cadastrado na seção de CTA/Contato no final da página)
  const agendarVisitaLink = useMemo(() => {
    const defaultPhone = "5545999999999";
    const rawLink = data.Cta_botao_link?.trim();
    const mensagem = encodeURIComponent(
      "Olá! Concluí a caminhada virtual pelo showroom e gostaria de marcar uma visita pessoalmente."
    );

    if (!rawLink) {
      return `https://wa.me/${defaultPhone}?text=${mensagem}`;
    }

    // Se já for uma URL do WhatsApp (wa.me ou api.whatsapp.com)
    if (rawLink.includes("wa.me") || rawLink.includes("whatsapp.com")) {
      try {
        const url = new URL(rawLink.startsWith("http") ? rawLink : `https://${rawLink}`);
        url.searchParams.set(
          "text",
          "Olá! Concluí a caminhada virtual pelo showroom e gostaria de marcar uma visita pessoalmente."
        );
        return url.toString();
      } catch {}
    }

    // Se for apenas o número digitado no admin (com ou sem DDD, traços, etc.)
    const onlyDigits = rawLink.replace(/\D/g, "");
    if (onlyDigits.length >= 10) {
      const fullNumber = onlyDigits.startsWith("55") ? onlyDigits : `55${onlyDigits}`;
      return `https://wa.me/${fullNumber}?text=${mensagem}`;
    }

    // Se for outro link ou página
    return rawLink;
  }, [data.Cta_botao_link]);

  // Bloqueio de scroll do body e listener para fechar o modal com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsWalkModalOpen(false);
      }
    };

    if (isWalkModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isWalkModalOpen]);

  return (
    <div className="w-full min-h-screen bg-white text-black">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER PRINCIPAL (Proporção 100% Fiel à imagem do Admin)          */}
      {/* ========================================================================= */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden bg-stone-900 text-white min-h-[380px] sm:min-h-0"
        style={{ aspectRatio: heroAspectRatio }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImageUrl}
            alt={heroTitulo}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Overlay sutil para legibilidade dos textos sem escurecer demais a foto */}
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-5 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 flex flex-col items-center text-center">
          {heroTag && (
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-[11px] md:text-[12px] font-sans font-medium uppercase tracking-[0.2em] text-white mb-4 shadow-sm">
              {heroTag}
            </div>
          )}

          {heroTitulo && (
            <h1 className="text-[34px] sm:text-[46px] md:text-[58px] lg:text-[64px] font-heading font-medium text-white tracking-tight leading-[1.1] max-w-3xl">
              {heroTitulo}
            </h1>
          )}

          {heroDescricao && (
            <p className="mt-4 text-[13px] sm:text-[15px] md:text-[16px] font-sans text-stone-200/95 max-w-2xl leading-relaxed">
              {heroDescricao}
            </p>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SEÇÃO EXPERIÊNCIA IMERSIVA (Texto + Métricas + Foto Lateral)            */}
      {/* ========================================================================= */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Coluna Esquerda: Texto + Cards de Métricas */}
            <div className="lg:col-span-7 flex flex-col items-start w-full">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-[#9E2A2B]/40 text-[10px] md:text-[11px] font-sans font-medium uppercase tracking-[0.18em] text-[#9E2A2B] mb-5">
                {imersivaTag}
              </span>

              <h2 className="text-[30px] sm:text-[36px] md:text-[42px] lg:text-[46px] font-heading font-normal text-black tracking-tight leading-[1.18] w-full">
                {imersivaTitulo.includes("você vivenciar") ? (
                  <>
                    {imersivaTitulo.split("você vivenciar")[0]}você
                    <br className="hidden sm:inline" />
                    {" vivenciar" + imersivaTitulo.split("você vivenciar").slice(1).join("você vivenciar")}
                  </>
                ) : imersivaTitulo.includes("\n") ? (
                  imersivaTitulo.split("\n").map((part, i) => (
                    <React.Fragment key={i}>
                      {part}
                      {i === 0 && <br className="hidden sm:inline" />}
                    </React.Fragment>
                  ))
                ) : (
                  imersivaTitulo
                )}
              </h2>

              <p className="text-[13px] sm:text-[14px] font-sans text-[#777777] mt-3.5 mb-8 md:mb-10 w-full max-w-none leading-relaxed">
                {imersivaDescricao}
              </p>

              {/* Grid das Métricas (3 cards com fundo cinza #F2F2F2, borda limpa e largura total) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5 w-full">
                {metricas.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="rounded-[16px] bg-[#F2F2F2] p-6 sm:p-7 md:p-8 flex flex-col justify-center border border-[#E5E5E5]"
                  >
                    <span className="text-[30px] sm:text-[34px] md:text-[38px] lg:text-[40px] font-heading font-medium text-black tracking-tight leading-none">
                      {item.Titulo}
                    </span>
                    <span className="text-[10px] sm:text-[11px] md:text-[11.5px] font-sans font-medium uppercase tracking-[0.14em] text-[#666666] mt-2.5 sm:mt-3 leading-tight">
                      {item.Subtitulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Direita: Imagem com cantos arredondados */}
            <div className="lg:col-span-5 w-full">
              <div className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-stone-100 shadow-sm border border-[#EDEDED]">
                <Image
                  src={imersivaImageUrl}
                  alt={imersivaTitulo}
                  fill
                  sizes="(max-width: 1024px) 100vw, 550px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEÇÃO BANNER DO SHOWROOM (Clique abre a Caminhada Virtual)             */}
      {/* ========================================================================= */}
      <section className="w-full bg-white py-6 md:py-10">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 md:px-8">
          <div
            onClick={openWalkModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                openWalkModal();
              }
            }}
            aria-label="Abrir caminhada virtual pelo showroom"
            className="group relative w-full aspect-[16/9] md:aspect-[2.35/1] rounded-[20px] overflow-hidden bg-stone-100 shadow-md border border-[#EDEDED] cursor-pointer"
          >
            <Image
              src={thumbUrl}
              alt={bannerThumbTitulo}
              fill
              priority
              sizes="(max-width: 1600px) 100vw, 1600px"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Overlay sutil com título do banner thumb */}
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-[11px] sm:text-xs font-sans font-semibold uppercase tracking-[0.2em] text-stone-200 mb-2 drop-shadow-sm">
                CAMINHADA VIRTUAL
              </span>
              <h3 className="text-[24px] sm:text-[32px] md:text-[40px] font-heading font-medium text-white tracking-tight leading-tight max-w-2xl drop-shadow-md">
                {bannerThumbTitulo}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO CTA CARD: "Quer um projeto personalizado para o seu espaço?"     */}
      {/* ========================================================================= */}
      <section className="w-full bg-white pt-8 md:pt-12 pb-20 md:pb-28 lg:pb-36">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 md:px-8">
          <div className="rounded-[20px] bg-black text-white pt-12 md:pt-16 pb-14 md:pb-20 px-6 sm:px-8 md:px-10 flex flex-col items-center text-center shadow-lg">
            <h3 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[33px] xl:text-[36px] font-heading font-normal text-white tracking-tight leading-tight max-w-[1200px] w-full text-balance">
              {ctaTitulo}
            </h3>

            <p className="text-[13px] sm:text-[14px] font-sans text-[#A0A0A0] max-w-2xl mt-3 md:mt-4 mb-8 leading-relaxed">
              {ctaDescricao}
            </p>

            <Link
              href={ctaBotaoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-sans font-medium text-[13px] sm:text-[14px] tracking-wide hover:bg-stone-100 transition-all duration-200 active:scale-95 shadow-sm"
            >
              <span>{ctaBotaoTexto}</span>
              <span className="text-base leading-none">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MODAL INTERATIVO EM TELA CHEIA: CAMINHADA VIRTUAL (SCROLL SEQUENCE)    */}
      {/* ========================================================================= */}
      {isWalkModalOpen && (
        <div
          ref={modalContainerRef}
          data-lenis-prevent="true"
          className="fixed inset-0 z-[100] bg-black overflow-y-auto"
        >
          {/* Barra Superior Fixa do Modal (Tag removida e Botão Fechar com alto contraste) */}
          <div className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-end pointer-events-none">
            <button
              type="button"
              onClick={() => setIsWalkModalOpen(false)}
              aria-label="Fechar caminhada virtual"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/90 hover:bg-black text-white border border-white/25 shadow-2xl backdrop-blur-md text-xs font-sans font-semibold tracking-wide transition-all duration-200 active:scale-95 pointer-events-auto cursor-pointer"
            >
              <span className="text-sm font-bold leading-none">✕</span>
              <span className="tracking-wide">Fechar</span>
            </button>
          </div>

          {/* Componente ScrollSequence executando no scroll do modal (Híbrido: Vídeo ou Imagens) */}
          <ScrollSequence
            images={sequenciaUrls.length > 0 ? sequenciaUrls : [thumbUrl]}
            videoDesktopUrl={videoDesktopUrl}
            videoMobileUrl={videoMobileUrl}
            scrollContainerRef={modalContainerRef}
            pixelsPerFrame={105}
            onProgress={handleWalkProgress}
          >
            {/* 1. Efeito de vidro em tela cheia na primeira tela (Intro) */}
            <div
              className={`absolute inset-0 w-full h-full bg-black/50 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-10 text-center pointer-events-none transition-all duration-700 ease-out ${
                walkFrameIndex > 0 ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-stone-200 text-[11px] font-sans font-medium uppercase tracking-[0.2em] mb-4 shadow-sm">
                <span>Role o scroll para caminhar</span>
              </div>

              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-medium text-white tracking-tight leading-tight max-w-3xl drop-shadow-md">
                {sequenciaTitulo}
              </h3>

              <p className="text-xs sm:text-sm md:text-base font-sans text-stone-200/90 mt-4 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
                {sequenciaSubtitulo}
              </p>
            </div>

            {/* 2. Efeito de vidro em tela cheia no final da caminhada (Outro / Conclusão) */}
            <div
              className={`absolute inset-0 w-full h-full bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-10 text-center transition-all duration-700 ease-out ${
                isWalkAtEnd ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
              }`}
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-stone-200 text-[11px] font-sans font-medium uppercase tracking-[0.2em] mb-4 sm:mb-5 shadow-sm">
                <span>Fim do Caminho Virtual</span>
              </div>

              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-medium text-white tracking-tight leading-tight max-w-3xl drop-shadow-md">
                Chegou ao final do caminho virtual
              </h3>

              <p className="text-xs sm:text-sm md:text-base font-sans text-stone-200/90 mt-4 mb-8 sm:mb-9 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
                Se quiser marcar uma visita pessoalmente, estamos à disposição. Venha vivenciar nossos ambientes integrados e testar de perto nossas soluções ergonômicas.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3.5 pointer-events-auto">
                <Link
                  href={agendarVisitaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black font-sans font-semibold text-[13px] sm:text-[14px] tracking-wide hover:bg-stone-100 transition-all duration-200 active:scale-95 shadow-2xl cursor-pointer"
                >
                  <span>Marcar Visita Pessoalmente</span>
                  <span className="text-base leading-none">→</span>
                </Link>

                <button
                  type="button"
                  onClick={handleRestartWalk}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 font-sans font-medium text-[12px] sm:text-[13px] tracking-wide transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-sm"
                >
                  <span>↺ Rever Caminhada</span>
                </button>
              </div>
            </div>
          </ScrollSequence>
        </div>
      )}
    </div>
  );
}
