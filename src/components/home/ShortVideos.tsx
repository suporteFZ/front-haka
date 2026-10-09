"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getStrapiMedia } from "@/utils/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

// ==========================================
// COMPONENTE: MODAL ESTILO STORIES
// ==========================================
function StoryModal({
  videos,
  initialIndex,
  onClose,
}: {
  videos: any[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = videos[currentIndex];
  const videoUrl = getStrapiMedia(currentVideo?.Video?.url);
  const thumbUrl = getStrapiMedia(currentVideo?.Thumbnail?.url);

  // Navegar para o próximo vídeo
  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setProgress(0);
      if (currentIndex < videos.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Chegou ao fim: volta pro começo
        setCurrentIndex(0);
      }
    },
    [currentIndex, videos.length]
  );

  // Navegar para o vídeo anterior
  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setProgress(0);
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else {
        // Se estiver no primeiro, reinicia o vídeo
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }
    },
    [currentIndex]
  );

  // Travar o scroll do body enquanto o modal estiver aberto + atalhos de teclado
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, handleNext, handlePrev]);

  // Reiniciar e reproduzir quando o index mudar com fallback de som
  useEffect(() => {
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Se o navegador bloquear autoplay com áudio, ativa mudo e roda
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [currentIndex]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const currentProgress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-6 select-none animate-fadeIn"
      onClick={onClose}
    >
      {/* Botão de Fechar Desktop (Fixo no canto superior direito da tela, acima de tudo) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="hidden md:flex fixed top-6 right-8 z-[100] w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all cursor-pointer hover:scale-110 shadow-2xl"
        aria-label="Fechar story"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Setas de navegação Desktop fora do player */}
      <button
        type="button"
        onClick={handlePrev}
        className="hidden md:flex fixed left-6 lg:left-14 top-1/2 -translate-y-1/2 z-[100] w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all cursor-pointer hover:scale-110 shadow-2xl"
        aria-label="Vídeo anterior"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="hidden md:flex fixed right-6 lg:right-14 top-1/2 -translate-y-1/2 z-[100] w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all cursor-pointer hover:scale-110 shadow-2xl"
        aria-label="Próximo vídeo"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {/* Container Principal do Story: No mobile tela cheia, no Desktop EXATAMENTE 9:16 */}
      <div
        className="relative w-full h-full md:w-auto md:h-[90vh] md:max-h-[850px] md:aspect-[9/16] md:rounded-[24px] overflow-hidden bg-black flex items-center justify-center shadow-2xl isolate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. O VÍDEO DO STORY NO FUNDO (pointer-events-none para não engolir os cliques) */}
        <div className="absolute inset-0 z-0 w-full h-full flex items-center justify-center bg-black">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbUrl ?? undefined}
              autoPlay
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => handleNext()}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          ) : thumbUrl ? (
            <img
              src={thumbUrl}
              alt="Thumbnail"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          ) : (
            <div className="text-white text-sm">Vídeo não disponível</div>
          )}
        </div>

        {/* 2. BOTÕES TRANSPARENTES DE CLIQUE: Esquerda (Voltar) e Direita (Avançar) */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-0 top-0 bottom-0 w-1/2 h-full z-20 bg-transparent border-0 cursor-pointer focus:outline-none active:bg-white/5 transition-colors"
          title="Clique para voltar"
          aria-label="Voltar vídeo"
        />

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 w-1/2 h-full z-20 bg-transparent border-0 cursor-pointer focus:outline-none active:bg-white/5 transition-colors"
          title="Clique para avançar"
          aria-label="Avançar vídeo"
        />

        {/* 3. HEADER DO STORY: Barras de Progresso + Botões (z-40 para ficar SEMPRE POR CIMA) */}
        <div className="absolute top-0 left-0 right-0 z-40 p-4 pt-3 pb-8 pointer-events-none flex flex-col gap-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Barras de Progresso estilo Instagram */}
          <div className="flex items-center gap-1.5 w-full">
            {videos.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Linha com Info + Botão de Som + Botão CLOSE */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2 drop-shadow-md">
              <span className="text-[13px] md:text-[14px] font-sans font-semibold tracking-wide">
                {currentVideo?.Legenda || `Vídeo ${currentIndex + 1}/${videos.length}`}
              </span>
            </div>

            {/* Ações com pointer-events-auto para garantir o clique */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Botão Som */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                aria-label={isMuted ? "Ativar som" : "Desativar som"}
              >
                {isMuted ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>

              {/* Botão CLOSE no topo do card (Visível e clicável no celular e desktop) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                aria-label="Fechar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Rodapé do Story (Legenda / Descrição se houver) */}
        {currentVideo?.Legenda && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
            <p className="text-white font-sans text-[14px] md:text-[15px] leading-[1.5] drop-shadow-md">
              {currentVideo.Legenda}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ==========================================
// COMPONENTE: ITEM DE VÍDEO NO CARROSSEL
// ==========================================
function VideoItem({
  item,
  isActive,
  isNext,
  originalIndex,
  onOpenStory,
  isStoryOpen,
  isSectionVisible,
}: {
  item: any;
  isActive: boolean;
  isNext: boolean;
  originalIndex: number;
  onOpenStory: (index: number) => void;
  isStoryOpen: boolean;
  isSectionVisible: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = getStrapiMedia(item.Video?.url);
  const thumbUrl = getStrapiMedia(item.Thumbnail?.url);
  const [isActuallyActive, setIsActuallyActive] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const checkActive = () => {
      const desktop = window.innerWidth >= 768;
      setIsActuallyActive(desktop ? isNext : isActive);
    };

    checkActive();
    window.addEventListener("resize", checkActive);
    return () => window.removeEventListener("resize", checkActive);
  }, [isActive, isNext]);

  // Carrega o vídeo sob demanda apenas quando o card se torna ativo e a seção estiver no viewport
  useEffect(() => {
    if (isActuallyActive && isSectionVisible) {
      setHasLoaded(true);
    }
  }, [isActuallyActive, isSectionVisible]);

  // Controlar reprodução de preview no carrossel: pausa graciosamente em vez de desmontar
  useEffect(() => {
    if (!videoRef.current) return;
    if (isStoryOpen || !isSectionVisible || !isActuallyActive) {
      videoRef.current.pause();
      return;
    }
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }, [isActuallyActive, isStoryOpen, isSectionVisible]);

  const handleClick = (e: React.MouseEvent) => {
    // Se o item clicado for o ativo, abre o Story fullscreen!
    if (isActuallyActive) {
      e.stopPropagation();
      onOpenStory(originalIndex);
    }
  };

  const overlayClasses = `
    transition-opacity duration-700 z-10 pointer-events-none rounded-[16px] md:rounded-[24px]
  `;

  const badgeClasses = `
    absolute top-5 right-5 z-20 drop-shadow-md transition-opacity duration-500
  `;

  // Somente monta a tag <video> sob demanda quando ativado e mantém montado para pausar,
  // evitando abortar conexões TCP abruptamente e disparar ECONNABORTED / travar o navegador
  const shouldRenderVideo = hasLoaded && Boolean(videoUrl);

  return (
    <div
      onClick={handleClick}
      className="video-inner group relative w-full aspect-[9/16] rounded-[16px] md:rounded-[24px] overflow-hidden cursor-pointer shadow-xl origin-center isolate transform-gpu"
    >
      {/* Overlay Escuro para os inativos */}
      <div className={`video-overlay absolute inset-0 bg-black ${overlayClasses}`} />

      {shouldRenderVideo ? (
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          poster={thumbUrl ?? undefined}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover rounded-[16px] md:rounded-[24px] pointer-events-none"
        />
      ) : thumbUrl ? (
        <img
          src={thumbUrl}
          alt="Thumbnail"
          loading="lazy"
          className="w-full h-full object-cover rounded-[16px] md:rounded-[24px] pointer-events-none"
        />
      ) : (
        <div className="w-full h-full bg-stone-900 rounded-[16px] md:rounded-[24px]" />
      )}

      {/* Badge do Vídeo Ativo: Convite para assistir em tela cheia */}
      {isActuallyActive && videoUrl && (
        <div className="absolute bottom-5 right-5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full flex items-center gap-1.5 z-20 shadow-sm text-white text-[12px] font-sans font-medium transition-all duration-300 group-hover:bg-black/80 group-hover:scale-105">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Assistir</span>
        </div>
      )}

      {/* Play Icon Badge nos inativos (ao clicar no ícone, abre direto o story) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onOpenStory(originalIndex);
        }}
        className={`video-badge ${badgeClasses} cursor-pointer hover:scale-110 transition-transform`}
        title="Assistir em tela cheia"
      >
        <img src="/play.svg" alt="Play" className="w-5 h-auto opacity-90" />
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: SHORT VIDEOS
// ==========================================
export default function ShortVideos({ data }: { data: any }) {
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isSectionVisible, setIsSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { rootMargin: "250px 0px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!data || !data.Videos || data.Videos.length === 0) return null;

  const originalVideos = data.Videos;

  return (
    <section
      ref={sectionRef}
      className="w-full bg-white py-12 md:py-20 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="w-full max-w-[1664px] px-[17px] md:px-8 flex flex-col gap-8 md:gap-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-0 items-stretch">
          <h2 className="text-[30px] md:text-[40px] font-heading font-medium md:font-semibold text-[#000000] leading-[1.2] lg:w-[30%]">
            {data.Titulo}
          </h2>

          <div className="flex flex-col lg:flex-row items-start justify-between lg:w-[65%] gap-6 lg:gap-0">
            <p className="text-[#69736B] text-[12px] md:text-[14px] leading-[1.5] font-sans lg:max-w-[420px] pt-1">
              {data.Subtitulo}
            </p>

            {/* Arrows */}
            <div className="hidden md:flex items-center gap-3 self-end mb-1">
              <button
                id="video-prev"
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 hover:text-black z-20 cursor-pointer"
                aria-label="Rolar para a esquerda"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                id="video-next"
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 hover:text-black z-20 cursor-pointer"
                aria-label="Rolar para a direita"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="w-full mt-6 md:mt-6">
        <div className="ml-[17px] md:ml-[max(2rem,calc((100vw-1600px)/2))] w-[calc(100vw-17px)] md:w-[calc(100vw-max(2rem,calc((100vw-1600px)/2)))]">
          <div className="w-full custom-swiper-layout">
            <style>{`
              .custom-swiper-layout .video-inner {
                transition: transform 0.7s cubic-bezier(0.25,1,0.5,1), opacity 0.7s;
              }

              /* DESKTOP: O ativo é o .swiper-slide-next */
              @media (min-width: 768px) {
                .custom-swiper-layout .swiper-slide-next .video-inner {
                  transform: scale(1) translateX(0);
                  opacity: 1;
                  z-index: 10;
                }
                .custom-swiper-layout .swiper-slide-next .video-overlay { opacity: 0; }
                .custom-swiper-layout .swiper-slide-next .video-badge { opacity: 0; pointer-events: none; }
                
                .custom-swiper-layout .swiper-slide-next ~ .swiper-slide .video-inner {
                  transform: scale(0.85) translateX(24px);
                  opacity: 0.9;
                  z-index: 0;
                }
                .custom-swiper-layout .swiper-slide-next ~ .swiper-slide .video-overlay { opacity: 0.6; }
                .custom-swiper-layout .swiper-slide-next ~ .swiper-slide .video-badge { opacity: 1; }
                
                .custom-swiper-layout .swiper-slide:not(.swiper-slide-next, .swiper-slide-next ~ .swiper-slide) .video-inner {
                  transform: scale(0.85) translateX(-24px);
                  opacity: 0.9;
                  z-index: 0;
                }
                .custom-swiper-layout .swiper-slide:not(.swiper-slide-next, .swiper-slide-next ~ .swiper-slide) .video-overlay { opacity: 0.6; }
                .custom-swiper-layout .swiper-slide:not(.swiper-slide-next, .swiper-slide-next ~ .swiper-slide) .video-badge { opacity: 1; }
              }

              /* MOBILE: O ativo é o .swiper-slide-active */
              @media (max-width: 767px) {
                .custom-swiper-layout .swiper-slide-active .video-inner {
                  transform: scale(1) translateX(0);
                  opacity: 1;
                  z-index: 10;
                }
                .custom-swiper-layout .swiper-slide-active .video-overlay { opacity: 0; }
                .custom-swiper-layout .swiper-slide-active .video-badge { opacity: 0; pointer-events: none; }
                
                .custom-swiper-layout .swiper-slide-active ~ .swiper-slide .video-inner {
                  transform: scale(0.85) translateX(16px);
                  opacity: 0.9;
                  z-index: 0;
                }
                .custom-swiper-layout .swiper-slide-active ~ .swiper-slide .video-overlay { opacity: 0.6; }
                .custom-swiper-layout .swiper-slide-active ~ .swiper-slide .video-badge { opacity: 1; }
                
                .custom-swiper-layout .swiper-slide:not(.swiper-slide-active, .swiper-slide-active ~ .swiper-slide) .video-inner {
                  transform: scale(0.85) translateX(-16px);
                  opacity: 0.9;
                  z-index: 0;
                }
                .custom-swiper-layout .swiper-slide:not(.swiper-slide-active, .swiper-slide-active ~ .swiper-slide) .video-overlay { opacity: 0.6; }
                .custom-swiper-layout .swiper-slide:not(.swiper-slide-active, .swiper-slide-active ~ .swiper-slide) .video-badge { opacity: 1; }
              }
            `}</style>
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: "#video-prev",
                nextEl: "#video-next",
              }}
              slidesPerView="auto"
              centeredSlides={false}
              loop={true}
              breakpoints={{
                0: { spaceBetween: -20 },
                640: { spaceBetween: -24 },
                768: { spaceBetween: -28 },
              }}
              onClick={(swiper) => {
                if (swiper.clickedIndex !== undefined) {
                  const isDesktop = window.innerWidth >= 768;
                  if (isDesktop) {
                    swiper.slideTo(swiper.clickedIndex - 1);
                  } else {
                    swiper.slideTo(swiper.clickedIndex);
                  }
                }
              }}
              className="w-full py-2"
            >
              {[...data.Videos, ...data.Videos, ...data.Videos].map(
                (item: any, index: number) => {
                  const originalIndex = index % originalVideos.length;
                  return (
                    <SwiperSlide
                      key={index}
                      className="!w-[55vw] sm:!w-[280px] md:!w-[320px]"
                    >
                      {({ isActive, isNext }) => (
                        <VideoItem
                          item={item}
                          isActive={isActive}
                          isNext={isNext}
                          originalIndex={originalIndex}
                          onOpenStory={(idx) => setStoryIndex(idx)}
                          isStoryOpen={storyIndex !== null}
                          isSectionVisible={isSectionVisible}
                        />
                      )}
                    </SwiperSlide>
                  );
                }
              )}
            </Swiper>
          </div>
        </div>
      </div>

      {/* MODAL FULLSCREEN ESTILO STORIES */}
      {storyIndex !== null && (
        <StoryModal
          videos={originalVideos}
          initialIndex={storyIndex}
          onClose={() => setStoryIndex(null)}
        />
      )}
    </section>
  );
}
