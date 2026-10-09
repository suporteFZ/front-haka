"use client";

import React, { useRef, useState, useEffect } from "react";
import { useLenis } from "lenis/react";
import { getStrapiMedia } from "@/utils/api";

interface ProductVideoProps {
  product: any;
}

// Analisa a URL para identificar se é YouTube, Vimeo ou vídeo direto
function parseVideoSource(rawUrl?: string, fileUrl?: string | null) {
  const url = (rawUrl && rawUrl.trim() !== "") ? rawUrl.trim() : (fileUrl || "");
  if (!url) return null;

  // 1. YouTube Embed direto
  const ytEmbedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (ytEmbedMatch) {
    return {
      type: "youtube" as const,
      embedUrl: `https://www.youtube.com/embed/${ytEmbedMatch[1]}`,
    };
  }

  // 2. YouTube Watch
  const ytWatchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch) {
    return {
      type: "youtube" as const,
      embedUrl: `https://www.youtube.com/embed/${ytWatchMatch[1]}`,
    };
  }

  // 3. YouTube YouTu.be
  const ytShortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShortMatch) {
    return {
      type: "youtube" as const,
      embedUrl: `https://www.youtube.com/embed/${ytShortMatch[1]}`,
    };
  }

  // 4. YouTube Shorts
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShortsMatch) {
    return {
      type: "youtube" as const,
      embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}`,
    };
  }

  // 5. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo" as const,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // 6. Vídeo direto (MP4, WebM ou arquivo de upload)
  return {
    type: "direct" as const,
    videoUrl: url,
  };
}

export default function ProductVideo({ product }: ProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Estados para controle de suavidade da rolagem com vídeos incorporados (YouTube / Vimeo)
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Desativa pointer-events no iframe temporariamente enquanto o Lenis rola a página
  useLenis(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 200);
  });

  // Fallback para eventos de rolagem nativa
  useEffect(() => {
    const handleNativeScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 200);
    };

    window.addEventListener("scroll", handleNativeScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleNativeScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  if (!product) return null;

  const videoFileUrl = getStrapiMedia(product.Video_arquivo?.url);
  const videoSource = parseVideoSource(product.Video_url, videoFileUrl);

  // Se nenhum vídeo estiver cadastrado no Strapi, não renderiza a seção
  if (!videoSource) {
    return null;
  }

  const posterUrl = getStrapiMedia(product.Thumbnail_video?.url);

  // =========================================================================
  // CASO 1: YOUTUBE OU VIMEO (RENDERIZA IFRAME RESPONSIVO)
  // =========================================================================
  if (videoSource.type === "youtube" || videoSource.type === "vimeo") {
    const embedUrl = videoSource.embedUrl;
    const separator = embedUrl.includes("?") ? "&" : "?";
    const finalEmbedUrl = hasPlayed ? `${embedUrl}${separator}autoplay=1` : embedUrl;

    return (
      <section className="w-full mt-16 md:mt-24 px-4 sm:px-6 md:px-0">
        <div className="relative w-full aspect-video rounded-[20px] md:rounded-[26px] overflow-hidden bg-black shadow-lg group">
          <iframe
            src={finalEmbedUrl}
            title={product.Nome || "Vídeo Institucional do Produto"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={`w-full h-full border-0 transition-opacity duration-300 ${
              isScrolling ? "pointer-events-none" : "pointer-events-auto"
            }`}
          />

          {/* Overlay inteligente: absorve eventos de mouse wheel enquanto não reproduzido, garantindo 100% de suavidade no Lenis */}
          {!hasPlayed && (
            <div
              onClick={() => setHasPlayed(true)}
              className="absolute inset-0 z-10 cursor-pointer bg-transparent"
              title="Clique para reproduzir o vídeo"
            />
          )}
        </div>
      </section>
    );
  }

  // =========================================================================
  // CASO 2: VÍDEO DIRETO / MP4 (RENDERIZA PLAYER COM CONTROLES FLUTUANTES)
  // =========================================================================
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + deltaSeconds)
    );
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  return (
    <section className="w-full mt-16 md:mt-24 px-4 sm:px-6 md:px-0">
      <div
        className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[16/9] rounded-[20px] md:rounded-[26px] overflow-hidden bg-black shadow-lg group cursor-pointer"
        onClick={togglePlay}
        onMouseEnter={() => setShowControls(true)}
      >
        <video
          ref={videoRef}
          src={videoSource.videoUrl}
          poster={posterUrl || undefined}
          muted={isMuted}
          playsInline
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-cover select-none"
        />

        {/* Gradiente escuro sutil */}
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none ${
            isPlaying && !showControls ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Controles centrais translúcidos */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div
            className={`pointer-events-auto bg-black/55 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-7 text-white border border-white/15 shadow-2xl transition-all duration-300 transform ${
              isPlaying && !showControls ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleSeek(-10)}
              aria-label="Voltar 10 segundos"
              className="text-white/80 hover:text-white transition-colors cursor-pointer hover:scale-110 active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 19 2 12 11 5 11 19" fill="currentColor" />
                <polygon points="22 19 13 12 22 5 22 19" fill="currentColor" />
              </svg>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(10)}
              aria-label="Avançar 10 segundos"
              className="text-white/80 hover:text-white transition-colors cursor-pointer hover:scale-110 active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 19 22 12 13 5 13 19" fill="currentColor" />
                <polygon points="2 19 11 12 2 5 2 19" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* Barra inferior de progresso */}
        <div
          className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 flex flex-col gap-2 ${
            isPlaying && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full h-1.5 hover:h-2.5 bg-white/30 rounded-full cursor-pointer transition-all relative overflow-hidden"
            onClick={handleTimelineClick}
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white text-[11px] md:text-[12px] font-sans pt-1">
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors border border-white/10 cursor-pointer"
            >
              {isMuted ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  </svg>
                  <span>Ativar som</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>Som ativo</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
