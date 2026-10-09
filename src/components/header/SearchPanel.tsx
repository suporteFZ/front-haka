"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchPanelProps {
  isSearchOpen: boolean;
  onClose: () => void;
  maisBuscados: any[];
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function SearchPanel({ isSearchOpen, onClose, maisBuscados }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus no input ao abrir o painel
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm("");
      setSuggestedProducts([]);
    }
  }, [isSearchOpen]);

  // Fechar no Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, onClose]);

  // Busca instantânea com debounce ao digitar
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setSuggestedProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(trimmed)}&pageSize=4`);
        if (res.ok) {
          const json = await res.json();
          setSuggestedProducts(json.data || []);
        } else {
          setSuggestedProducts([]);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
        setSuggestedProducts([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      onClose();
      router.push(`/busca?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div
      className={`absolute top-[90px] md:top-[100px] left-1/2 -translate-x-1/2 w-[calc(100%-34px)] md:w-[90%] max-w-5xl px-[17px] md:px-8 z-10 text-black transition-all ease-in-out ${
        isSearchOpen
          ? "opacity-100 translate-y-3 pointer-events-auto duration-500 delay-[200ms]"
          : "opacity-0 -translate-y-4 pointer-events-none duration-200 delay-0"
      }`}
    >
      <div className="w-full max-w-2xl font-sans pb-8">
        {/* Campo de Busca Minimalista Fiel ao Estilo de Referência (sem bordas, sem botões extras) */}
        <form onSubmit={handleSubmit} className="w-full flex items-center mb-7 md:mb-8">
          <button
            type="submit"
            aria-label="Pesquisar"
            className="p-0 mr-3 text-stone-400 hover:text-black transition-colors cursor-pointer shrink-0"
          >
            <Image
              src="/search_black.svg"
              alt="Search"
              width={22}
              height={22}
              className="opacity-40 hover:opacity-80 transition-opacity"
            />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="O que você está procurando?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[20px] md:text-[24px] font-sans font-normal outline-none bg-transparent placeholder-[#888888] text-stone-900 leading-none"
          />
        </form>

        {/* Sugestões de produtos ao digitar ou lista vertical dos Mais Buscados vindos do Strapi Admin */}
        {searchTerm.trim().length >= 2 ? (
          <div>
            <h3 className="text-black font-bold text-[13px] md:text-[14px] mb-3.5 tracking-tight font-sans">
              {isLoading ? "Buscando..." : "Sugestões:"}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {/* Opção no início: Ver todos os resultados */}
              <li>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="text-[13px] md:text-[14px] text-black font-medium hover:underline cursor-pointer text-left block"
                >
                  Ver todos os resultados para &quot;{searchTerm}&quot; →
                </button>
              </li>

              {/* Limite de 4 recomendações */}
              {suggestedProducts.slice(0, 4).map((prod) => (
                <li key={prod.id}>
                  <Link
                    href={`/produto/${prod.slug || prod.Nome.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={onClose}
                    className="flex items-center justify-between text-[13px] md:text-[14px] font-sans text-[#777777] hover:text-black transition-colors leading-relaxed"
                  >
                    <span className="truncate pr-4">{prod.Nome}</span>
                    {prod.Variacoes?.[0]?.Preco && (
                      <span className="text-xs text-stone-400 shrink-0">
                        {formatBRL(prod.Variacoes[0].Preco_promocional || prod.Variacoes[0].Preco)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {!isLoading && suggestedProducts.length === 0 && (
              <p className="text-[13px] text-stone-400 font-sans mt-2">
                Nenhum produto encontrado. Pressione Enter para buscar no catálogo completo.
              </p>
            )}
          </div>
        ) : (
          maisBuscados && maisBuscados.length > 0 && (
            <div>
              <h3 className="text-black font-bold text-[13px] md:text-[14px] mb-3.5 tracking-tight font-sans">
                Mais buscados:
              </h3>
              <ul className="flex flex-col gap-2.5">
                {maisBuscados.map((termo: any) => {
                  const href =
                    termo.Link || `/busca?q=${encodeURIComponent(termo.Termo)}`;

                  return (
                    <li key={termo.id || termo.Termo}>
                      <Link
                        href={href}
                        onClick={onClose}
                        className="text-[13px] md:text-[14px] font-sans text-[#777777] hover:text-black transition-colors leading-relaxed block"
                      >
                        {termo.Termo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        )}
      </div>
    </div>
  );
}
