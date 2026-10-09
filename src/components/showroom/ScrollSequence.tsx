"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

export interface ScrollSequenceProps {
  /**
   * Array ordenado de URLs das imagens que compõem a sequência da caminhada (usado se não houver vídeo)
   */
  images?: string[];
  /**
   * URL do vídeo para Desktop (se cadastrado no Strapi, ativa o modo Vídeo Scrubbing)
   */
  videoDesktopUrl?: string | null;
  /**
   * URL do vídeo para Mobile (se cadastrado no Strapi, exibido em telas menores que 768px)
   */
  videoMobileUrl?: string | null;
  /**
   * Altura do scroll por frame em pixels (padrão: 105px para 1 clique da rodinha do mouse avançar 1 frame).
   */
  pixelsPerFrame?: number;
  /**
   * Se verdadeiro, adiciona um passo inicial mantendo o primeiro frame:
   * No passo 0, é exibido com o overlay inicial (efeito de vidro e título).
   * No 1º scroll (passo 1), o efeito de vidro se dissolve mantendo a cena inicial limpa.
   * Do 2º scroll em diante, avança a caminhada.
   * Padrão: true.
   */
  duplicateFirstFrame?: boolean;
  /**
   * Se verdadeiro, adiciona um passo final ao chegar na última imagem / fim do vídeo:
   * No último frame, mais um scroll ativa o efeito de vidro final com mensagem e botão de contato.
   * Padrão: true.
   */
  hasEndOverlay?: boolean;
  /**
   * Altura customizada da trilha de rolagem fantasma (ex: '300vh').
   */
  customTrackHeight?: string;
  /**
   * Modo de renderização para imagens:
   * - 'dom': Recomendado (padrão). Renderiza as imagens em camadas no DOM com retenção de frame anterior.
   * - 'canvas': Desenha no Canvas 2D da GPU.
   */
  renderMode?: "dom" | "canvas";
  /**
   * Elementos ou textos opcionais sobrepostos ao showroom durante a caminhada
   */
  children?:
    | React.ReactNode
    | ((state: { isAtStart: boolean; isAtEnd: boolean; activeImageIndex: number }) => React.ReactNode);
  /**
   * Callback opcional que reporta o progresso (0 a 1), o índice do step e o índice da imagem exibida
   */
  onProgress?: (
    progress: number,
    stepIndex: number,
    imageIndex: number,
    state?: { isAtStart: boolean; isAtEnd: boolean }
  ) => void;
  /**
   * Classes CSS adicionais para o contêiner externo
   */
  className?: string;
  /**
   * Referência opcional ao container com scroll (quando dentro de modal com overflow-y-auto)
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function ScrollSequence({
  images = [],
  videoDesktopUrl,
  videoMobileUrl,
  pixelsPerFrame = 105,
  duplicateFirstFrame = true,
  hasEndOverlay = true,
  customTrackHeight,
  renderMode = "dom",
  children,
  onProgress,
  className = "",
  scrollContainerRef,
}: ScrollSequenceProps) {
  const isVideoMode = Boolean(videoDesktopUrl || videoMobileUrl);

  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentStepRef = useRef<number>(-1);
  const currentImageRef = useRef<number>(-1);

  // Refs de Vídeo
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const targetTimeRef = useRef<number>(0);
  const videoRafIdRef = useRef<number | null>(null);

  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previousImageIndex, setPreviousImageIndex] = useState(0);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Quantidade total de passos para o modo imagem:
  // - duplicateFirstFrame: +1 passo inicial (passo 0: overlay inicial, passo 1: frame 0 limpo)
  // - hasEndOverlay: +1 passo final (penúltimo: frame final limpo, último: overlay final de contato)
  const totalImageSteps = useMemo(() => {
    let steps = images.length > 0 ? images.length : 1;
    if (!duplicateFirstFrame && images.length > 1) {
      steps = images.length - 1;
    }
    if (hasEndOverlay && images.length > 0) {
      steps += 1;
    }
    return steps;
  }, [images.length, duplicateFirstFrame, hasEndOverlay]);

  const effectivePixels = pixelsPerFrame || 105;
  const introThreshold = 105;
  const outroThreshold = hasEndOverlay ? 105 : 0;

  // Distância total de scroll:
  // Modo vídeo: ~350px por segundo de vídeo (ou padrão 2200px) + 105px inicial + 105px final
  // Modo imagem: totalImageSteps * 105px
  const totalScrollDistance = isVideoMode
    ? Math.max(
        introThreshold +
          outroThreshold +
          (videoDuration > 0 ? Math.round(videoDuration * 350) : 2200),
        1900
      )
    : totalImageSteps * effectivePixels;

  const trackHeight =
    customTrackHeight || `calc(100vh + ${totalScrollDistance}px)`;

  // Pré-decodificação de imagens para o modo imagem
  useEffect(() => {
    if (isVideoMode || images.length === 0) return;
    images.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      if (typeof img.decode === "function") {
        img.decode().catch(() => {});
      }
    });
  }, [images, isVideoMode]);

  // Carregamento de metadados do vídeo
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      setVideoDuration((prev) => Math.max(prev, dur));
    }
  };

  // Garante que os vídeos comecem pausados e no tempo 0
  useEffect(() => {
    if (!isVideoMode) return;
    if (desktopVideoRef.current) {
      desktopVideoRef.current.pause();
      desktopVideoRef.current.currentTime = 0;
    }
    if (mobileVideoRef.current) {
      mobileVideoRef.current.pause();
      mobileVideoRef.current.currentTime = 0;
    }
  }, [isVideoMode, videoDesktopUrl, videoMobileUrl]);

  // Aplicação suave do tempo do vídeo via requestAnimationFrame
  const applyVideoTime = useCallback(() => {
    videoRafIdRef.current = null;
    const time = targetTimeRef.current;

    const desktopVid = desktopVideoRef.current;
    if (desktopVid && desktopVid.readyState >= 1) {
      if ("fastSeek" in desktopVid && typeof (desktopVid as any).fastSeek === "function") {
        (desktopVid as any).fastSeek(time);
      } else {
        desktopVid.currentTime = time;
      }
    }

    const mobileVid = mobileVideoRef.current;
    if (mobileVid && mobileVid.readyState >= 1) {
      if ("fastSeek" in mobileVid && typeof (mobileVid as any).fastSeek === "function") {
        (mobileVid as any).fastSeek(time);
      } else {
        mobileVid.currentTime = time;
      }
    }

    setVideoCurrentTime(time);
  }, []);

  // =========================================================================
  // 1. DESENHO NO CANVAS (QUANDO MODO CANVAS ESTIVER ATIVO EM IMAGENS)
  // =========================================================================
  const drawFrame = useCallback(
    (imageIndex: number) => {
      if (renderMode !== "canvas" || isVideoMode) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = imagesRef.current[imageIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const displayWidth =
        canvas.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1920);
      const displayHeight =
        canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 1080);

      const targetWidth = Math.floor(displayWidth * dpr);
      const targetHeight = Math.floor(displayHeight * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvas.width / canvas.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    },
    [renderMode, isVideoMode]
  );

  // =========================================================================
  // 2. MONITORAMENTO DE SCROLL (SUPORTA TANTO VÍDEO QUANTO SEQUÊNCIA DE IMAGENS)
  // =========================================================================
  useEffect(() => {
    const container =
      scrollContainerRef?.current ||
      trackRef.current?.closest(".overflow-y-auto") ||
      trackRef.current?.parentElement;

    const handleScroll = () => {
      let scrollY = 0;
      let maxScroll = 0;

      if (container && container.scrollHeight > container.clientHeight) {
        maxScroll = container.scrollHeight - container.clientHeight;
        scrollY = Math.min(Math.max(container.scrollTop, 0), maxScroll);
      } else if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        maxScroll = trackRef.current.offsetHeight - window.innerHeight;
        scrollY = Math.min(Math.max(-rect.top, 0), maxScroll);
      }

      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

      // =====================================================================
      // COMPORTAMENTO PARA MODO VÍDEO
      // =====================================================================
      if (isVideoMode) {
        if (scrollY <= 0) {
          if (currentStepRef.current !== 0) {
            currentStepRef.current = 0;
            targetTimeRef.current = 0;
            if (!videoRafIdRef.current) {
              videoRafIdRef.current = requestAnimationFrame(applyVideoTime);
            }
            setIsAtStart(true);
            setIsAtEnd(false);
            onProgressRef.current?.(0, 0, 0, { isAtStart: true, isAtEnd: false });
          }
        } else if (scrollY <= introThreshold) {
          // Durante o 1º scroll: dissolve o vidro, mantendo vídeo no início (0.0s)
          if (currentStepRef.current !== 1) {
            currentStepRef.current = 1;
            targetTimeRef.current = 0;
            if (!videoRafIdRef.current) {
              videoRafIdRef.current = requestAnimationFrame(applyVideoTime);
            }
            setIsAtStart(false);
            setIsAtEnd(false);
            onProgressRef.current?.(progress, 1, 0, { isAtStart: false, isAtEnd: false });
          }
        } else if (hasEndOverlay && scrollY >= maxScroll - 15) {
          // No final: mantém o último frame do vídeo e ativa o vidro com CTA
          if (currentStepRef.current !== 101) {
            currentStepRef.current = 101;
            const duration = videoDuration || 1;
            targetTimeRef.current = duration;
            if (!videoRafIdRef.current) {
              videoRafIdRef.current = requestAnimationFrame(applyVideoTime);
            }
            setIsAtStart(false);
            setIsAtEnd(true);
            onProgressRef.current?.(progress, 101, Math.floor(duration), {
              isAtStart: false,
              isAtEnd: true,
            });
          }
        } else {
          // Do 2º scroll até o penúltimo: scrub do vídeo de 0 até duration
          const videoScroll = scrollY - introThreshold;
          const videoMaxScroll = Math.max(maxScroll - introThreshold - outroThreshold, 1);
          const videoProgress = Math.min(Math.max(videoScroll / videoMaxScroll, 0), 1);

          const duration = videoDuration || 1;
          const calcTime = Math.min(videoProgress * duration, duration);

          targetTimeRef.current = calcTime;
          if (!videoRafIdRef.current) {
            videoRafIdRef.current = requestAnimationFrame(applyVideoTime);
          }

          const step = Math.min(Math.floor(videoProgress * 100) + 2, 100);
          if (step !== currentStepRef.current) {
            currentStepRef.current = step;
            setIsAtStart(false);
            setIsAtEnd(false);
            onProgressRef.current?.(progress, step, Math.floor(calcTime), {
              isAtStart: false,
              isAtEnd: false,
            });
          }
        }
        return;
      }

      // =====================================================================
      // COMPORTAMENTO PARA MODO IMAGENS (DEFAULT / FALLBACK)
      // =====================================================================
      if (images.length === 0) return;

      const targetStep = Math.min(
        Math.max(Math.round(scrollY / effectivePixels), 0),
        totalImageSteps
      );

      const targetImageIndex = duplicateFirstFrame
        ? targetStep === 0
          ? 0
          : Math.min(targetStep - 1, images.length - 1)
        : Math.min(targetStep, images.length - 1);

      const isStart = targetStep === 0;
      const isEnd = hasEndOverlay ? targetStep >= totalImageSteps : false;

      if (
        targetStep !== currentStepRef.current ||
        targetImageIndex !== currentImageRef.current
      ) {
        const oldImageIndex = currentImageRef.current;
        currentStepRef.current = targetStep;
        currentImageRef.current = targetImageIndex;

        if (targetImageIndex !== oldImageIndex) {
          setPreviousImageIndex(oldImageIndex >= 0 ? oldImageIndex : 0);
          setActiveImageIndex(targetImageIndex);
          if (renderMode === "canvas") {
            drawFrame(targetImageIndex);
          }
        }

        setIsAtStart(isStart);
        setIsAtEnd(isEnd);
        onProgressRef.current?.(progress, targetStep, targetImageIndex, {
          isAtStart: isStart,
          isAtEnd: isEnd,
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!container) return;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;

      const step = isVideoMode
        ? maxScroll / 20
        : totalImageSteps >= 1
        ? maxScroll / totalImageSteps
        : 105;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        container.scrollBy({ top: step, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        container.scrollBy({ top: -step, behavior: "smooth" });
      }
    };

    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("keydown", handleKeyDown);

    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
      if (videoRafIdRef.current) {
        cancelAnimationFrame(videoRafIdRef.current);
      }
    };
  }, [
    scrollContainerRef,
    isVideoMode,
    videoDuration,
    images.length,
    totalImageSteps,
    effectivePixels,
    duplicateFirstFrame,
    hasEndOverlay,
    introThreshold,
    outroThreshold,
    renderMode,
    drawFrame,
    applyVideoTime,
  ]);

  // Formatação de segundos em mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Progresso em porcentagem (0 a 100) para a barra progressiva
  const progressPercent = useMemo(() => {
    if (isVideoMode) {
      if (videoDuration <= 0) return 0;
      return Math.min(Math.max((videoCurrentTime / videoDuration) * 100, 0), 100);
    }
    if (images.length <= 1) return 100;
    return Math.min(Math.max((activeImageIndex / (images.length - 1)) * 100, 0), 100);
  }, [isVideoMode, videoDuration, videoCurrentTime, images.length, activeImageIndex]);

  return (
    <div
      ref={trackRef}
      style={{ height: trackHeight }}
      className={`relative w-full ${className}`}
    >
      {/* 
        Contêiner Sticky:
        Prende a viewport na tela (top: 0, height: 100vh / 100dvh)
        enquanto a Ghost Track rola.
      */}
      <div className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden bg-black flex items-center justify-center select-none">
        {/* ========================================================================= */}
        {/* MODO VÍDEO HÍBRIDO (DESKTOP E MOBILE)                                     */}
        {/* ========================================================================= */}
        {isVideoMode ? (
          <div className="absolute inset-0 w-full h-full z-0">
            {/* Vídeo Desktop (exibido em telas md e acima) */}
            {videoDesktopUrl && (
              <video
                ref={desktopVideoRef}
                src={videoDesktopUrl}
                playsInline
                muted
                preload="auto"
                disablePictureInPicture
                disableRemotePlayback
                onLoadedMetadata={handleLoadedMetadata}
                className={`w-full h-full object-cover object-center pointer-events-none ${
                  videoMobileUrl ? "hidden md:block" : "block"
                }`}
              />
            )}

            {/* Vídeo Mobile (exibido em telas menores que md) */}
            {videoMobileUrl && (
              <video
                ref={mobileVideoRef}
                src={videoMobileUrl}
                playsInline
                muted
                preload="auto"
                disablePictureInPicture
                disableRemotePlayback
                onLoadedMetadata={handleLoadedMetadata}
                className={`w-full h-full object-cover object-center pointer-events-none ${
                  videoDesktopUrl ? "block md:hidden" : "block"
                }`}
              />
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO SEQUÊNCIA DE IMAGENS (FALLBACK QUANDO NÃO HOUVER VÍDEO CADASTRADO)    */
          /* ========================================================================= */
          <>
            <div className="absolute inset-0 w-full h-full z-0">
              {images.map((url, idx) => {
                const isActive = idx === activeImageIndex;
                const isPrevious = idx === previousImageIndex;

                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`Showroom frame ${idx + 1}`}
                    loading="eager"
                    className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none ${
                      isActive
                        ? "opacity-100 z-10"
                        : isPrevious
                        ? "opacity-100 z-5"
                        : "opacity-0 z-0 pointer-events-none"
                    }`}
                  />
                );
              })}
            </div>

            {/* MODO CANVAS OPCIONAL */}
            {renderMode === "canvas" && (
              <canvas
                ref={canvasRef}
                className="relative z-10 w-full h-full object-cover block pointer-events-none"
              />
            )}
          </>
        )}

        {/* Indicador de progresso com barra progressiva no canto inferior direito */}
        <div
          className={`absolute bottom-6 right-6 z-30 flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white font-sans pointer-events-none shadow-xl select-none transition-opacity duration-500 ${
            isAtEnd ? "opacity-40" : "opacity-100"
          }`}
        >
          {images.length === 0 && !isVideoMode ? (
            <span className="text-[11px] text-stone-300">Carregando...</span>
          ) : (
            <>
              {/* Barra de progresso */}
              <div className="w-24 sm:w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Porcentagem */}
              <span className="text-[11px] font-medium tracking-wide text-stone-200 tabular-nums min-w-[28px] text-right">
                {Math.round(progressPercent)}%
              </span>
            </>
          )}
        </div>

        {/* Conteúdo sobreposto (Textos, overlays de chamada, etc.) */}
        {children && (
          <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
            {typeof children === "function"
              ? children({ isAtStart, isAtEnd, activeImageIndex })
              : children}
          </div>
        )}
      </div>
    </div>
  );
}
