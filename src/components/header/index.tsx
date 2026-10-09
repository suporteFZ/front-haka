"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import MegaMenu from "./MegaMenu";
import SearchPanel from "./SearchPanel";
import CartPanel from "./CartPanel";
import TopNav from "./TopNav";
import MobileMenu from "./MobileMenu";
import MobileCart from "./MobileCart";
import { getStrapiMedia } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useLenis } from "lenis/react";

interface HeaderProps {
  globalData: any;
}

export default function Header({ globalData }: HeaderProps) {
  const pathname = usePathname();
  const isWhiteBgPage =
    pathname?.startsWith("/produto") ||
    pathname?.startsWith("/categoria") ||
    pathname?.startsWith("/busca") ||
    pathname?.startsWith("/projetos") ||
    pathname?.startsWith("/showroom");
  const lenis = useLenis();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCartOpen, setIsCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Inicializa o estado com a posição atual caso a página seja recarregada no meio
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fecha o menu e busca ao dar scroll na página (o carrinho permanece aberto para permitir scroll na lista de produtos)
  useEffect(() => {
    if (isScrolled) {
      setActiveMenuId(null);
      setIsSearchOpen(false);
    }
  }, [isScrolled]);

  // Desabilita o scroll do body e pausa o Lenis quando o menu mobile ou o carrinho estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen) {
      document.body.style.overflow = "hidden";
      lenis?.stop();
    } else {
      document.body.style.overflow = "";
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [isMobileMenuOpen, isCartOpen, lenis]);

  if (!globalData) return null;

  const isMegaMenuOpen = activeMenuId !== null;
  const activeItem = globalData.Menu_header?.find((i: any) => i.id === activeMenuId);

  const logoBrancaUrl = getStrapiMedia(globalData.Logo_branca?.url) || "";
  const logoPretaUrl = getStrapiMedia(globalData.Logo?.url) || "";

  // Layout compacto ativa no scroll, no mega menu, na busca, no carrinho ou sempre na PDP/Categoria/Busca
  const isCompactLayout = isScrolled || isMegaMenuOpen || isSearchOpen || isCartOpen || Boolean(isWhiteBgPage);
  const currentLogo = isCompactLayout ? logoPretaUrl : logoBrancaUrl;
  const contentWidth = isCompactLayout ? "w-[calc(100%-34px)] md:w-[90%] max-w-5xl" : "w-full max-w-[1600px]";
  const logoSize = isCompactLayout ? 34 : 40;

  const showPill = (isScrolled || Boolean(isWhiteBgPage)) && !isMegaMenuOpen && !isSearchOpen && !isCartOpen;

  return (
    <>
      {/* Backdrop (Desktop) */}
      <div 
        className={`hidden md:block fixed inset-0 bg-black/60 z-40 transition-opacity duration-700 ${isMegaMenuOpen || isSearchOpen || isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => { setActiveMenuId(null); setIsSearchOpen(false); setIsCartOpen(false); }}
      />

      <header className="fixed top-0 left-0 w-full z-50 flex justify-center">
        
        {/* BACKGROUND LAYER 1: PÍLULA */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 bg-white h-12 md:h-16 top-4 md:top-6 rounded-full md:rounded-[32px] shadow-lg transition-all duration-700 ease-in-out ${contentWidth} ${
            showPill ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* BACKGROUND LAYER 2: CORTINA BRANCA E PAINÉIS EXPANSÍVEIS */}
        <div 
          className={`absolute left-0 w-full bg-white top-0 shadow-xl transition-all duration-700 ease-in-out overflow-hidden ${
            isMegaMenuOpen
              ? "h-[420px] opacity-100 z-10"
              : isSearchOpen
              ? "h-[370px] md:h-[380px] opacity-100 z-10"
              : isCartOpen
              ? "h-0 md:h-[500px] opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto z-10"
              : "h-24 opacity-0 pointer-events-none -z-10"
          }`}
        >
          {/* CONTENT LAYER 2: MEGA MENU */}
          <MegaMenu 
            isMegaMenuOpen={isMegaMenuOpen}
            activeItem={activeItem}
            onClose={() => setActiveMenuId(null)}
          />

          {/* CONTENT LAYER 3: BUSCA INTERNA */}
          <SearchPanel 
            isSearchOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            maisBuscados={globalData.Mais_buscados}
          />

          {/* CONTENT LAYER 4: CARRINHO (DESKTOP) */}
          <CartPanel 
            isCartOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            whatsappNumber={globalData.Whatsapp_numero}
          />
        </div>

        {/* CONTENT LAYER 1: TOP ROW (Logo, Menu, Ícones) */}
        <div className={`relative z-20 flex items-center justify-between h-12 md:h-16 px-[17px] md:px-8 transition-all duration-700 ease-in-out mt-4 md:mt-6 ${contentWidth}`}>
          <TopNav 
            globalData={globalData}
            currentLogo={currentLogo}
            logoSize={logoSize}
            isCompactLayout={isCompactLayout}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        </div>
      </header>

      {/* MOBILE MENU (GAVETA DA DIREITA) */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        globalData={globalData}
        currentLogo={logoPretaUrl} // O painel branco sempre usa a logo preta
        logoSize={logoSize}
        contentWidth={contentWidth}
      />

      {/* MOBILE CART (GAVETA DA DIREITA 100%) */}
      <MobileCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        whatsappNumber={globalData.Whatsapp_numero}
        currentLogo={logoPretaUrl}
        logoSize={logoSize}
        contentWidth={contentWidth}
      />
    </>
  );
}
