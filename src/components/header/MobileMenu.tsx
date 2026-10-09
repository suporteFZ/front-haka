import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  globalData: any;
  currentLogo: string;
  logoSize: number;
  contentWidth: string;
}

export default function MobileMenu({ isOpen, onClose, globalData, currentLogo, logoSize, contentWidth }: MobileMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const router = useRouter();

  if (!globalData) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onClose();
      router.push(`/busca?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const menuItems = globalData.Menu_mobile || [];
  const footer1 = globalData.Menu_mobile_footer_1 || [];
  const footer2 = globalData.Menu_mobile_footer_2 || [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`md:hidden fixed top-0 right-0 h-full w-full bg-white z-[80] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Top Header to exactly match the main header */}
        <div className="w-full flex justify-center flex-shrink-0 border-b border-stone-100 pb-2">
          <div className={`flex items-center justify-between h-12 md:h-16 px-[17px] mt-4 md:mt-6 w-full ${contentWidth}`}>
            <Link href="/" onClick={onClose}>
              <Image src={currentLogo} alt="Logo" width={logoSize} height={logoSize} className="object-contain w-5 h-auto" />
            </Link>
            
            <div className="flex items-center gap-6">
              <button onClick={onClose} aria-label="Fechar menu" className="cursor-pointer hover:opacity-70 transition-opacity relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Campo de Busca no Mobile Menu */}
        <div className="px-[17px] pt-4 pb-2 flex-shrink-0">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-stone-100 border border-stone-200/80 focus-within:border-black focus-within:bg-white transition-all"
          >
            <button type="submit" aria-label="Buscar" className="text-stone-500 hover:text-black shrink-0">
              <Image src="/search_black.svg" alt="Search" width={16} height={16} className="opacity-60" />
            </button>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm font-sans bg-transparent outline-none placeholder-stone-400 text-stone-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Limpar"
                className="text-stone-400 hover:text-black text-xs px-1"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation Accordion */}
          <nav className="px-[17px] flex flex-col pb-8">
            {menuItems.map((item: any) => {
              const hasSublinks = item.Sublinks && item.Sublinks.length > 0;
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="py-1">
                  {hasSublinks ? (
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className={`w-full flex items-center justify-between py-4 text-left text-black transition-all duration-300 font-heading ${isExpanded ? "font-bold text-xl" : "font-medium text-xl"}`}
                    >
                      <span>{item.Nome}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  ) : (
                    <Link 
                      href={item.Link || "/"} 
                      onClick={onClose}
                      className="block py-4 text-xl font-heading font-medium text-black hover:text-stone-500 transition-colors"
                    >
                      {item.Nome}
                    </Link>
                  )}

                  {/* Sublinks panel */}
                  {hasSublinks && (
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}
                    >
                      <ul className="flex flex-col gap-4 pl-4 pt-2">
                        {item.Sublinks.map((sub: any) => (
                          <li key={sub.id}>
                            <Link href={sub.Url || "/"} onClick={onClose} className="text-stone-600 font-sans font-medium text-base hover:text-black">
                              {sub.Texto}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Gray Footer Links */}
        <div className="bg-[#F5F5F3] px-[17px] py-8 flex-shrink-0">
          <div className="grid grid-cols-2 gap-4">
            <ul className="flex flex-col gap-3">
              {footer1.map((link: any) => (
                <li key={link.id}>
                  <Link href={link.Url || "/"} onClick={onClose} className="text-sm text-stone-500 font-sans font-medium hover:text-black transition-colors">
                    {link.Texto}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-3">
              {footer2.map((link: any) => (
                <li key={link.id}>
                  <Link href={link.Url || "/"} onClick={onClose} className="text-sm text-stone-500 font-sans font-medium hover:text-black transition-colors">
                    {link.Texto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </>
  );
}
