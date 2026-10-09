import Link from "next/link";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";

interface MegaMenuProps {
  isMegaMenuOpen: boolean;
  activeItem: any;
  onClose: () => void;
}

export default function MegaMenu({ isMegaMenuOpen, activeItem, onClose }: MegaMenuProps) {
  return (
    <div 
      className={`absolute top-[100px] left-1/2 -translate-x-1/2 w-[calc(100%-34px)] md:w-[90%] max-w-5xl px-[17px] md:px-8 z-10 text-black transition-all ease-in-out ${
        isMegaMenuOpen 
          ? "opacity-100 translate-y-4 pointer-events-auto duration-500 delay-[200ms]" 
          : "opacity-0 -translate-y-4 pointer-events-none duration-200 delay-0"
      }`}
    >
      <div className="overflow-hidden">
        {activeItem && (
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-8 pb-8 font-sans pt-2">
            
            {/* Coluna 1: Categorias */}
            <div>
              <h3 className="text-stone-400 text-sm font-medium mb-3">Comprar</h3>
              <ul className="flex flex-col gap-4">
                {activeItem.categorias?.length > 0 ? (
                  activeItem.categorias.map((cat: any) => (
                    <li key={cat.id}>
                      <Link href={`/categoria/${cat.slug || cat.Nome.toLowerCase()}`} onClick={onClose} className="text-xl font-heading font-semibold hover:text-stone-500 transition-colors">
                        {cat.Nome}
                      </Link>
                    </li>
                  ))
                ) : (
                  <span className="text-sm text-stone-300">Nenhuma categoria vinculada</span>
                )}
              </ul>
            </div>

            {/* Coluna 2: Marcas */}
            <div>
              <h3 className="text-stone-400 text-sm font-medium mb-3">Marcas</h3>
              <ul className="flex flex-col gap-3 text-sm">
                {activeItem.marcas?.length > 0 ? (
                  activeItem.marcas.map((marca: any) => (
                    <li key={marca.id}>
                      <Link href={`/marca/${marca.slug || marca.Nome.toLowerCase()}`} onClick={onClose} className="hover:text-stone-500 transition-colors">
                        {marca.Nome}
                      </Link>
                    </li>
                  ))
                ) : (
                  <span className="text-sm text-stone-300">Nenhuma marca vinculada</span>
                )}
              </ul>
            </div>

            {/* Coluna 3: Links Rápidos */}
            <div>
              <h3 className="text-stone-400 text-sm font-medium mb-3">Links rápidos</h3>
              <ul className="flex flex-col gap-3 text-sm">
                {activeItem.links_rapidos?.length > 0 ? (
                  activeItem.links_rapidos.map((link: any) => (
                    <li key={link.id}>
                      <Link href={link.Url || "/"} onClick={onClose} className="hover:text-stone-500 transition-colors">
                        {link.Texto}
                      </Link>
                    </li>
                  ))
                ) : (
                  <span className="text-sm text-stone-300">Nenhum link vinculado</span>
                )}
              </ul>
            </div>

            {/* Coluna 4: Mais vendidas */}
            <div>
              <h3 className="text-stone-400 text-sm font-medium mb-3">Mais vendidas</h3>
              <div className="flex gap-4">
                {activeItem.produtos_destaque?.filter((p: any) => p.Ativo !== false)?.length > 0 ? (
                  activeItem.produtos_destaque
                    .filter((p: any) => p.Ativo !== false)
                    .map((prod: any) => (
                    <Link key={prod.id} href={`/produto/${prod.slug || prod.Nome.toLowerCase()}`} onClick={onClose} className="group relative w-36 h-56 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                      {prod.Imagem_destaque ? (
                        <Image src={getStrapiMedia(prod.Imagem_destaque.url) || ""} alt={prod.Nome} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-stone-200 flex items-center justify-center p-2 text-center text-xs text-stone-500 group-hover:bg-stone-300 transition-colors">
                          {prod.Nome}
                        </div>
                      )}
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-stone-300 w-full h-56 border border-dashed border-stone-200 rounded-xl flex items-center justify-center text-center px-4">
                    Produtos aparecerão aqui
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
