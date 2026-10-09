"use client";

import { useLenis } from "lenis/react";
import Image from "next/image";

export default function ScrollDownArrow() {
  const lenis = useLenis();

  return (
    <button
      onClick={() => lenis?.scrollTo("#proxima-secao", { offset: 0 })}
      className="animate-bounce hover:opacity-70 transition-opacity p-4 cursor-pointer"
      aria-label="Rolar para baixo"
    >
      <Image
        src="/arrow_banner.svg"
        alt="Scroll Down"
        width={18}
        height={18}
        className="w-5 h-5 md:w-[18px] md:h-[18px]"
      />
    </button>
  );
}
