import Link from "next/link";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";

interface MegaMenuProps {
  isMegaMenuOpen: boolean;
  activeItem: any;
  onClose: () => void;
}

export default function MegaMenu({ isMegaMenuOpen, activeItem, onClose }: MegaMenuProps) {
  if (!activeItem) return null;

  const hasCategorias = Boolean(activeItem.categorias && activeItem.categorias.length > 0);
  const hasMarcas = Boolean(activeItem.marcas && activeItem.marcas.length > 0);
  const hasLinks = Boolean(activeItem.links_rapidos && activeItem.links_rapidos.length > 0);
  const activeProdutos = activeItem.produtos_destaque?.filter((p: any) => p.Ativo !== false) || [];
  const hasProdutos = activeProdutos.length > 0;

  const hasAnyContent = hasCategorias || hasMarcas || hasLinks || hasProdutos;
  if (!hasAnyContent) return null;

  return (
    <div 
      className={`absolute top-[100px] left-1/2 -translate-x-1/2 w-[calc(100%-34px)] md:w-[90%] max-w-5xl px-[17px] md:px-8 z-10 text-black transition-all ease-in-out ${
        isMegaMenuOpen 
          ? "opacity-100 translate-y-4 pointer-events-auto duration-500 delay-[200ms]" 
          : "opacity-0 -translate-y-4 pointer-events-none duration-200 delay-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className="flex flex-row justify-between items-start gap-8 pb-8 font-sans pt-2">
          
          {/* Colunas da Esquerda (Categorias, Marcas, Links Rápidos) */}
          <div className="flex flex-row gap-12 md:gap-16 items-start flex-wrap">
            {/* Coluna 1: Categorias (Comprar) */}
            {hasCategorias && (
              <div className="min-w-[160px]">
                <h3 className="text-stone-400 text-sm font-medium mb-3">Comprar</h3>
                <ul className="flex flex-col gap-4">
                  {activeItem.categorias.map((cat: any) => (
                    <li key={cat.id}>
                      <Link 
                        href={`/categoria/${cat.slug || cat.Nome?.toLowerCase()}`} 
                        onClick={onClose} 
                        className="text-xl font-heading font-semibold hover:text-stone-500 transition-colors"
                      >
                        {cat.Nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coluna 2: Marcas */}
            {hasMarcas && (
              <div className="min-w-[140px]">
                <h3 className="text-stone-400 text-sm font-medium mb-3">Marcas</h3>
                <ul className="flex flex-col gap-3 text-sm">
                  {activeItem.marcas.map((marca: any) => (
                    <li key={marca.id}>
                      <Link 
                        href={`/marca/${marca.slug || marca.Nome?.toLowerCase()}`} 
                        onClick={onClose} 
                        className="hover:text-stone-500 transition-colors"
                      >
                        {marca.Nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coluna 3: Links Rápidos */}
            {hasLinks && (
              <div className="min-w-[140px]">
                <h3 className="text-stone-400 text-sm font-medium mb-3">Links rápidos</h3>
                <ul className="flex flex-col gap-3 text-sm">
                  {activeItem.links_rapidos.map((link: any) => (
                    <li key={link.id}>
                      <Link 
                        href={link.Url || "/"} 
                        onClick={onClose} 
                        className="hover:text-stone-500 transition-colors"
                      >
                        {link.Texto}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Coluna 4: Mais vendidas (Produtos Destaque) */}
          {hasProdutos && (
            <div className="flex-shrink-0 ml-auto">
              <h3 className="text-stone-400 text-sm font-medium mb-3">Mais vendidas</h3>
              <div className="flex gap-4">
                {activeProdutos.map((prod: any) => (
                  <Link 
                    key={prod.id} 
                    href={`/produto/${prod.slug || prod.Nome?.toLowerCase()}`} 
                    onClick={onClose} 
                    className="group relative w-36 h-56 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0"
                  >
                    {prod.Imagem_destaque ? (
                      <Image 
                        src={getStrapiMedia(prod.Imagem_destaque.url) || ""} 
                        alt={prod.Nome} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-200 flex items-center justify-center p-2 text-center text-xs text-stone-500 group-hover:bg-stone-300 transition-colors">
                        {prod.Nome}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
