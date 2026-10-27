"use client";

import { useEffect, Suspense } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname, useSearchParams } from "next/navigation";

function LenisRouteWatcher() {
  const lenis = useLenis();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Desativa a restauração padrão do browser para evitar conflitos com o Lenis
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Ao trocar de rota ou parâmetros de busca (ex: entrar na PDP, trocar de categoria ou realizar nova busca),
  // reseta a rolagem imediatamente para o topo (y = 0)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }

    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }

    // Garante que o scroll permaneça no topo mesmo se houver renderização assíncrona ou carregamento de imagens
    const rafId = requestAnimationFrame(() => {
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
        lenis.resize();
      }
    });

    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
        lenis.resize();
      }
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, searchParams, lenis]);

  useEffect(() => {
    if (!lenis) return;

    // Recalcula o limit de rolagem sempre que elementos assíncronos ou imagens alterarem a altura do body
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    const handleLoad = () => {
      lenis.resize();
    };

    window.addEventListener("load", handleLoad);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("load", handleLoad);
    };
  }, [lenis]);

  return null;
}

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, autoResize: true }}>
      <Suspense fallback={null}>
        <LenisRouteWatcher />
      </Suspense>
      {children}
    </ReactLenis>
  );
}
