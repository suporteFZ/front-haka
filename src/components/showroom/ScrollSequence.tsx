"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";

export interface ScrollSequenceRef {
  scrollToTop: () => void;
  advance: (count?: number) => void;
  rewind: (count?: number) => void;
}

export interface ScrollSequenceProps {
  /**
   * Array ordenado de URLs das imagens da caminhada (Desktop)
   */
  images?: string[];
  /**
   * Array ordenado de URLs das imagens para Mobile (< 768px)
   */
  imagesMobile?: string[];
  /**
   * Referência ao container do modal
   */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Estado de reprodução automática
   */
  isPlaying?: boolean;
  /**
   * Callback ao mudar estado de reprodução
   */
  onPlayChange?: (playing: boolean) => void;
  /**
   * Callback opcional de progresso contínuo
   */
  onProgress?: (
    progress: number,
    frameIndex: number,
    state: { isAtStart: boolean; isAtEnd: boolean }
  ) => void;
  /**
   * Conteúdo sobreposto na introdução
   */
  introContent?: React.ReactNode;
  /**
   * Conteúdo sobreposto na conclusão (outro)
   */
  outroContent?: React.ReactNode;
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

const ScrollSequence = forwardRef<ScrollSequenceRef, ScrollSequenceProps>(
  function ScrollSequence(
    {
      images = [],
      imagesMobile = [],
      scrollContainerRef,
      isPlaying = false,
      onPlayChange,
      onProgress,
      introContent,
      outroContent,
      className = "",
    },
    ref
  ) {
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

    const [currentIndex, setCurrentIndex] = useState(0);
    const currentIndexRef = useRef(0);
    currentIndexRef.current = currentIndex;

    const targetIndexRef = useRef(0);
    const isSteppingRef = useRef(false);
    const stepRafRef = useRef<number | null>(null);

    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;

    const onPlayChangeRef = useRef(onPlayChange);
    onPlayChangeRef.current = onPlayChange;

    const onProgressRef = useRef(onProgress);
    onProgressRef.current = onProgress;

    // Pré-decodificação imediata de todas as fotos na memória da GPU
    useEffect(() => {
      if (activeImages.length === 0) return;
      activeImages.forEach((url) => {
        const img = new window.Image();
        img.src = url;
        if (typeof img.decode === "function") {
          img.decode().catch(() => {});
        }
      });
    }, [activeImages]);

    // Reporta progresso sempre que o currentIndex mudar
    useEffect(() => {
      const total = activeImages.length;
      if (total === 0) return;
      const progress = total > 1 ? currentIndex / (total - 1) : 0;
      onProgressRef.current?.(progress, currentIndex, {
        isAtStart: currentIndex === 0,
        isAtEnd: currentIndex === total - 1,
      });
    }, [currentIndex, activeImages.length]);

    // =========================================================================
    // LOOP DE ANIMAÇÃO PASSO A PASSO (Passa foto por foto sem pular)
    // =========================================================================
    const startStepping = useCallback((stepDelayMs = 55) => {
      if (isSteppingRef.current) return;
      isSteppingRef.current = true;

      let lastStepTime = performance.now();

      const stepLoop = (now: number) => {
        if (!isSteppingRef.current) return;

        if (now - lastStepTime >= stepDelayMs) {
          lastStepTime = now;

          const current = currentIndexRef.current;
          const target = targetIndexRef.current;

          if (current < target) {
            const next = current + 1;
            currentIndexRef.current = next;
            setCurrentIndex(next);
          } else if (current > target) {
            const prev = current - 1;
            currentIndexRef.current = prev;
            setCurrentIndex(prev);
          } else {
            isSteppingRef.current = false;
            return;
          }
        }

        stepRafRef.current = requestAnimationFrame(stepLoop);
      };

      stepRafRef.current = requestAnimationFrame(stepLoop);
    }, []);

    // Avança 5 fotos passando uma por uma em sequência rápida (~55ms cada)
    const advanceFrames = useCallback(
      (count = 5) => {
        const max = activeImages.length - 1;
        if (max <= 0) return;

        targetIndexRef.current = Math.min(targetIndexRef.current + count, max);
        startStepping(55);
      },
      [activeImages.length, startStepping]
    );

    // Retrocede 5 fotos passando uma por uma em sequência rápida (~55ms cada)
    const rewindFrames = useCallback(
      (count = 5) => {
        const max = activeImages.length - 1;
        if (max <= 0) return;

        targetIndexRef.current = Math.max(targetIndexRef.current - count, 0);
        startStepping(55);
      },
      [activeImages.length, startStepping]
    );

    // Métodos imperativos para o componente pai
    useImperativeHandle(
      ref,
      () => ({
        scrollToTop: () => {
          if (stepRafRef.current) {
            cancelAnimationFrame(stepRafRef.current);
          }
          isSteppingRef.current = false;
          targetIndexRef.current = 0;
          currentIndexRef.current = 0;
          setCurrentIndex(0);
        },
        advance: (count = 5) => advanceFrames(count),
        rewind: (count = 5) => rewindFrames(count),
      }),
      [advanceFrames, rewindFrames]
    );

    // =========================================================================
    // LOOP DE REPRODUÇÃO AUTOMÁTICA (PLAY)
    // =========================================================================
    useEffect(() => {
      if (!isPlaying) return;

      let playRafId: number;
      let lastTime = performance.now();
      const playDelayMs = isMobileScreen ? 85 : 120; // ritmo confortável de caminhada

      const playLoop = (now: number) => {
        if (!isPlayingRef.current) return;

        if (now - lastTime >= playDelayMs) {
          lastTime = now;
          const current = currentIndexRef.current;
          const max = activeImages.length - 1;

          if (current >= max) {
            onPlayChangeRef.current?.(false);
            return;
          }

          const next = current + 1;
          currentIndexRef.current = next;
          targetIndexRef.current = next;
          setCurrentIndex(next);
        }

        playRafId = requestAnimationFrame(playLoop);
      };

      playRafId = requestAnimationFrame(playLoop);

      return () => {
        cancelAnimationFrame(playRafId);
      };
    }, [isPlaying, isMobileScreen, activeImages.length]);

    // =========================================================================
    // CAPTURA DE EVENTOS DE SCROLL (RODINHA DO MOUSE, SWIPE E TECLADO)
    // =========================================================================
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const framesToPass = 5;

      // 1. Rodinha do Mouse (Wheel) com debounce para cada clique do scroll avançar 5 fotos
      let lastWheelTime = 0;
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const now = Date.now();
        if (now - lastWheelTime < 140) return;
        lastWheelTime = now;

        if (isPlayingRef.current) {
          onPlayChangeRef.current?.(false);
        }

        if (e.deltaY > 0) {
          advanceFrames(framesToPass);
        } else if (e.deltaY < 0) {
          rewindFrames(framesToPass);
        }
      };

      // 2. Toque no Mobile (Touch Swipe)
      let touchStartY = 0;
      let touchStartX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaX = e.changedTouches[0].clientX - touchStartX;

        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 25) {
          if (isPlayingRef.current) {
            onPlayChangeRef.current?.(false);
          }
          if (deltaY < 0) {
            advanceFrames(framesToPass);
          } else {
            rewindFrames(framesToPass);
          }
        }
      };

      // 3. Setas do Teclado
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
          e.preventDefault();
          if (isPlayingRef.current) onPlayChangeRef.current?.(false);
          advanceFrames(framesToPass);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          if (isPlayingRef.current) onPlayChangeRef.current?.(false);
          rewindFrames(framesToPass);
        }
      };

      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("keydown", handleKeyDown);
        if (stepRafRef.current) {
          cancelAnimationFrame(stepRafRef.current);
        }
      };
    }, [scrollContainerRef, isMobileScreen, advanceFrames, rewindFrames]);

    const total = activeImages.length;
    const isAtStart = currentIndex === 0;
    const isAtEnd = total > 0 && currentIndex === total - 1;
    const progressPercent = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;

    return (
      <div className={`relative w-full h-full overflow-hidden bg-black select-none ${className}`}>
        {/* ========================================================================= */}
        {/* IMAGENS 100% NÍTIDAS E SÓLIDAS (SEM VISÃO DUPLA / ZERO GHOSTING)           */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          {activeImages.map((url, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`Showroom frame ${idx + 1}`}
              loading="eager"
              className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-none ${
                idx === currentIndex
                  ? "opacity-100 z-10 visible"
                  : "opacity-0 z-0 invisible pointer-events-none"
              }`}
            />
          ))}
        </div>

        {/* ========================================================================= */}
        {/* OVERLAY DE INTRODUÇÃO (Apenas no primeiro frame)                           */}
        {/* ========================================================================= */}
        {introContent && (
          <div
            className={`absolute inset-0 w-full h-full bg-black/50 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-10 text-center transition-all duration-500 z-20 ${
              isAtStart ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
            }`}
          >
            {introContent}
          </div>
        )}

        {/* ========================================================================= */}
        {/* OVERLAY DE CONCLUSÃO (Apenas no último frame)                              */}
        {/* ========================================================================= */}
        {outroContent && (
          <div
            className={`absolute inset-0 w-full h-full bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-10 text-center transition-all duration-500 z-20 ${
              isAtEnd ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
            }`}
          >
            {outroContent}
          </div>
        )}

        {/* ========================================================================= */}
        {/* INDICADOR DE PROGRESSO COM BARRA E PERCENTUAL NO CANTO INFERIOR DIREITO    */}
        {/* ========================================================================= */}
        <div
          className={`absolute bottom-6 right-6 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white font-sans shadow-xl select-none transition-opacity duration-300 ${
            isAtEnd ? "opacity-40" : "opacity-100"
          }`}
        >
          {total === 0 ? (
            <span className="text-[11px] text-stone-300">Carregando...</span>
          ) : (
            <>
              <div className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-medium tracking-wide text-stone-200 tabular-nums min-w-[28px] text-right">
                {Math.round(progressPercent)}%
              </span>
            </>
          )}
        </div>
      </div>
    );
  }
);

export default ScrollSequence;
