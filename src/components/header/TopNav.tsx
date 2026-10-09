import Link from "next/link";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface TopNavProps {
  globalData: any;
  currentLogo: string;
  logoSize: number;
  isCompactLayout: boolean;
  activeMenuId: number | null;
  setActiveMenuId: (id: number | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function TopNav({
  globalData,
  currentLogo,
  logoSize,
  isCompactLayout,
  activeMenuId,
  setActiveMenuId,
  isSearchOpen,
  setIsSearchOpen,
  setIsMobileMenuOpen
}: TopNavProps) {
  const lenis = useLenis();
  const pathname = usePathname();
  const { totalItems, isCartOpen, setIsCartOpen } = useCart();

  const handleLogoClick = (e: React.MouseEvent) => {
    setActiveMenuId(null);
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      lenis?.scrollTo(0, { duration: 1.2 });
    }
  };

  return (
    <div className="flex items-center justify-between w-full h-full">
      {/* LOGO */}
      <div className="flex-shrink-0 z-[60] flex items-center">
        <Link href="/" onClick={handleLogoClick} className="flex items-center">
          <Image
            src={currentLogo}
            alt="Haka Logo"
            width={logoSize}
            height={logoSize}
            className={`object-contain transition-all duration-500 ease-in-out relative w-6 ${
              isCompactLayout ? "md:w-[34px]" : "md:w-[40px]"
            } h-auto`}
          />
        </Link>
      </div>

      {/* MENU CENTRALIZADO (Somente Desktop) */}
      <nav className={`hidden md:flex gap-8 items-center font-medium text-[12px] font-sans ${isCompactLayout ? "text-black" : "text-white"}`}>
        {globalData.Menu_header?.map((item: any) => {
          if (item.isMegaMenu) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenuId(activeMenuId === item.id ? null : item.id);
                  setIsSearchOpen(false);
                  setIsCartOpen(false);
                }}
                className={`cursor-pointer transition-opacity duration-300 hover:opacity-70 flex items-center gap-1 ${activeMenuId === item.id ? "opacity-70 font-semibold" : ""} ${isCompactLayout ? "text-black" : "text-white"}`}
              >
                {item.Nome}
              </button>
            );
          }
          return (
            <Link
              key={item.id}
              href={item.Link || "/"}
              className={`cursor-pointer transition-opacity duration-300 hover:opacity-70 ${isCompactLayout ? "text-black" : "text-white"}`}
            >
              {item.Nome}
            </Link>
          );
        })}
      </nav>

      {/* LINKS DE DESTAQUE (Somente Mobile) */}
      <nav className={`flex md:hidden flex-1 justify-center gap-4 items-center px-[17px] font-small text-[12px] font-sans ${isCompactLayout ? "text-black" : "text-white"}`}>
        {globalData.Menu_mobile?.filter((item: any) => item.Destaque).map((item: any) => (
          <Link
            key={item.id}
            href={item.Link || "/"}
            className="cursor-pointer transition-opacity duration-300 hover:opacity-70"
          >
            {item.Nome}
          </Link>
        ))}
      </nav>

      {/* ÍCONES */}
      <div className="flex items-center gap-4 md:gap-6 z-[60]">
        <button
          aria-label="Buscar"
          onClick={() => {
            setIsSearchOpen(!isSearchOpen);
            setActiveMenuId(null);
            setIsCartOpen(false);
            setIsMobileMenuOpen(false);
          }}
          className={`cursor-pointer transition-all duration-300 relative ${isSearchOpen ? "opacity-50" : "hover:opacity-70"}`}
        >
          <Image
            src={isCompactLayout ? "/search_black.svg" : "/search_w.svg"}
            alt="Buscar"
            width={20}
            height={20}
            className="transition-all duration-300 w-4 h-4 md:w-5 md:h-5"
          />
        </button>

        {/* Carrinho */}
        <button
          aria-label="Carrinho"
          onClick={() => {
            setIsCartOpen(!isCartOpen);
            setActiveMenuId(null);
            setIsSearchOpen(false);
            setIsMobileMenuOpen(false);
          }}
          className={`cursor-pointer hover:opacity-70 transition-all relative ${isCartOpen ? "opacity-50" : ""}`}
        >
          <div className="relative">
            <Image
              src={isCompactLayout ? "/cart_black.svg" : "/cart_w.svg"}
              alt="Carrinho"
              width={20}
              height={20}
              className="transition-all duration-300 w-4 h-4 md:w-5 md:h-5"
            />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] md:text-[10px] font-sans font-bold w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center leading-none shadow-xs border border-white">
                {totalItems}
              </span>
            )}
          </div>
        </button>

        {/* Menu Hamburguer (Somente Mobile) */}
        <button
          aria-label="Menu Mobile"
          className="md:hidden cursor-pointer hover:opacity-70 transition-opacity relative"
          onClick={() => {
            setIsMobileMenuOpen(true);
            setIsCartOpen(false);
          }}
        >
          <Image
            src={isCompactLayout ? "/burguer-black.svg" : "/burguer-w.svg"}
            alt="Menu Mobile"
            width={24}
            height={24}
            className="transition-all duration-300 w-4 h-4 md:w-6 md:h-6"
          />
        </button>
      </div>
    </div>
  );
}
