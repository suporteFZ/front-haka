"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";

function LenisResizeWatcher() {
  const lenis = useLenis();

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
      <LenisResizeWatcher />
      {children}
    </ReactLenis>
  );
}
