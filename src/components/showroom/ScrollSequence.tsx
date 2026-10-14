"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

export interface ScrollSequenceProps {
  /**
   * Array ordenado de URLs das imagens que compõem a sequência da caminhada (Desktop)
   */
  images?: string[];
  /**
   * Array ordenado de URLs das imagens para Mobile (telas menores que 768px)
   */
  imagesMobile?: string[];
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
   * Se verdadeiro, adiciona um passo final ao chegar na última imagem:
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
  imagesMobile = [],
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
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(typeof window !== "undefined" && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const activeImages = useMemo(() => {
    if (isMobileScreen && imagesMobile.length > 0) {
      return imagesMobile;
    }
    return images.length > 0 ? images : imagesMobile;
  }, [isMobileScreen, images, imagesMobile]);

  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentStepRef = useRef<number>(-1);
  const currentImageRef = useRef<number>(-1);

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
    let steps = activeImages.length > 0 ? activeImages.length : 1;
    if (!duplicateFirstFrame && activeImages.length > 1) {
      steps = activeImages.length - 1;
    }
    if (hasEndOverlay && activeImages.length > 0) {
      steps += 1;
    }
    return steps;
  }, [activeImages.length, duplicateFirstFrame, hasEndOverlay]);

  const effectivePixels = pixelsPerFrame || 105;
  const totalScrollDistance = totalImageSteps * effectivePixels;

  const trackHeight =
    customTrackHeight || `calc(100vh + ${totalScrollDistance}px)`;

  // Pré-decodificação de imagens para garantir 60fps instantâneo sem flicker
  useEffect(() => {
    if (activeImages.length === 0) return;
    imagesRef.current = [];
    activeImages.forEach((url, i) => {
      const img = new window.Image();
      img.src = url;
      imagesRef.current[i] = img;
      if (typeof img.decode === "function") {
        img.decode().catch(() => {});
      }
    });
  }, [activeImages]);

  // =========================================================================
  // 1. DESENHO NO CANVAS (QUANDO MODO CANVAS ESTIVER ATIVO)
  // =========================================================================
  const drawFrame = useCallback(
    (imageIndex: number) => {
      if (renderMode !== "canvas") return;

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
        offsetY = 0;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    },
    [renderMode]
  );

  // =========================================================================
  // 2. MONITORAMENTO DE SCROLL
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

      if (activeImages.length === 0) return;

      const targetStep = Math.min(
        Math.max(Math.round(scrollY / effectivePixels), 0),
        totalImageSteps
      );

      const targetImageIndex = duplicateFirstFrame
        ? targetStep === 0
          ? 0
          : Math.min(targetStep - 1, activeImages.length - 1)
        : Math.min(targetStep, activeImages.length - 1);

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

    // Navegação opcional por teclado (setas cima/baixo)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!container) return;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;

      const step = totalImageSteps >= 1 ? maxScroll / totalImageSteps : 105;

      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        container.scrollBy({ top: step, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
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
    };
  }, [
    scrollContainerRef,
    activeImages.length,
    totalImageSteps,
    effectivePixels,
    duplicateFirstFrame,
    hasEndOverlay,
    renderMode,
    drawFrame,
  ]);

  // Progresso em porcentagem (0 a 100) para a barra progressiva
  const progressPercent = useMemo(() => {
    if (activeImages.length <= 1) return 100;
    return Math.min(Math.max((activeImageIndex / (activeImages.length - 1)) * 100, 0), 100);
  }, [activeImages.length, activeImageIndex]);

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
        {/* SEQUÊNCIA DE IMAGENS (CANVAS OU DOM COM TRANSIÇÃO ULTRA SUAVE)            */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 w-full h-full z-0">
          {activeImages.map((url, idx) => {
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

        {/* Indicador de progresso com barra progressiva no canto inferior direito */}
        <div
          className={`absolute bottom-6 right-6 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white font-sans shadow-xl select-none transition-opacity duration-500 ${
            isAtEnd ? "opacity-40" : "opacity-100"
          }`}
        >
          {activeImages.length === 0 ? (
            <span className="text-[11px] text-stone-300">Carregando...</span>
          ) : (
            <>
              {/* Barra de progresso */}
              <div className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
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
