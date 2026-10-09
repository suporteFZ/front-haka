"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

interface MobileCartProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
  currentLogo: string;
  logoSize: number;
  contentWidth: string;
}

// Formatar moeda brasileira BRL
function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function MobileCart({
  isOpen,
  onClose,
  whatsappNumber,
  currentLogo,
  logoSize,
  contentWidth,
}: MobileCartProps) {
  const {
    items,
    totalPrice,
    removeItem,
    updateQuantity,
    hasQuoteOnlyItems,
    totalItems,
  } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    // Formatação detalhada e profissional de cada produto sem emojis
    const itemsFormatted = items
      .map((item) => {
        const lines = [`*${item.quantity}x ${item.name}*`];
        if (
          item.variationName &&
          item.variationName !== "default" &&
          item.variationName !== "Padrão"
        ) {
          lines.push(`• Cor: ${item.variationName}`);
        }
        if (item.warrantyName && item.warrantyName !== "Garantia padrão") {
          lines.push(`• Garantia: ${item.warrantyName}`);
        }
        lines.push(
          `• Valor: ${
            item.isQuoteOnly ? "Sob consulta" : formatBRL(item.price * item.quantity)
          }`
        );
        if (item.slug) {
          lines.push(`• Link: ${origin}/produto/${item.slug}`);
        }
        return lines.join("\n");
      })
      .join("\n\n");

    let totalSection = "";
    if (hasQuoteOnlyItems) {
      if (totalPrice > 0) {
        totalSection = `*Valor total parcial:* ${formatBRL(totalPrice)} (contém itens sob consulta)`;
      } else {
        totalSection = `*Valor total:* Sob consulta`;
      }
    } else {
      totalSection = `*Valor total:* ${formatBRL(totalPrice)}`;
    }

    const fullMsg = [
      `Olá! Gostaria de fazer o pedido dos seguintes itens da Haka:`,
      ``,
      itemsFormatted,
      ``,
      `*Resumo do Pedido:*`,
      `• Total de itens: ${totalItems}`,
      totalSection,
      ``,
      `Finalizei meu carrinho pelo site e aguardo o atendimento para concluir a compra!`,
    ].join("\n");

    const rawNumber = (whatsappNumber || "554530550000").replace(/\D/g, "");
    const finalNumber = rawNumber.length <= 11 ? `55${rawNumber}` : rawNumber;

    window.open(`https://wa.me/${finalNumber}?text=${encodeURIComponent(fullMsg)}`, "_blank");
  };

  return (
    <>
      {/* Backdrop (Mobile) */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer 100% como o Menu Mobile */}
      <div
        data-lenis-prevent
        className={`md:hidden fixed top-0 right-0 h-full w-full bg-white z-[80] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Top Header idêntico ao do Menu Mobile */}
        <div className="w-full flex justify-center flex-shrink-0 border-b border-stone-100 pb-2">
          <div
            className={`flex items-center justify-between h-12 md:h-16 px-[17px] mt-4 md:mt-6 w-full ${contentWidth}`}
          >
            <Link href="/" onClick={onClose}>
              <Image
                src={currentLogo}
                alt="Logo"
                width={logoSize}
                height={logoSize}
                className="object-contain w-5 h-auto"
              />
            </Link>

            <div className="flex items-center gap-6">
              <button
                onClick={onClose}
                aria-label="Fechar carrinho"
                className="cursor-pointer hover:opacity-70 transition-opacity relative p-1"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Título do Carrinho e Contador */}
        <div className="px-[17px] pt-4 pb-3 flex items-center justify-between flex-shrink-0 border-b border-stone-100">
          <h2 className="text-[20px] font-heading font-bold text-black tracking-tight">
            Carrinho
          </h2>
          {totalItems > 0 && (
            <span className="text-[12px] font-sans font-medium text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </span>
          )}
        </div>

        {/* Conteúdo: Lista de Produtos ou Estado Vazio */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-[17px] py-12 text-center gap-3">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-stone-300"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <p className="text-[16px] font-sans font-medium text-stone-700">
              Seu carrinho está vazio
            </p>
            <p className="text-[13px] font-sans text-stone-400 max-w-xs">
              Adicione produtos para solicitar seu orçamento ou finalizar sua compra.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-full bg-black text-white text-[13px] font-sans font-medium hover:bg-neutral-800 transition-colors"
            >
              Continuar navegando
            </button>
          </div>
        ) : (
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto overscroll-contain px-[17px] divide-y divide-[#EDEDED] cart-scroll"
          >
            {items.map((item) => (
              <div key={item.id} className="py-4 flex items-start justify-between gap-3">
                {/* Lado Esquerdo: Imagem */}
                <div className="relative w-18 h-18 shrink-0 bg-stone-50 rounded-[10px] flex items-center justify-center p-1 border border-stone-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                      sizes="72px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                      Sem foto
                    </div>
                  )}
                </div>

                {/* Informações: Título, Variação, Garantia e Seletor */}
                <div className="flex-1 min-w-0 pr-1">
                  <Link
                    href={`/produto/${item.slug}`}
                    onClick={onClose}
                    className="text-[14px] font-sans font-medium text-black line-clamp-2 hover:underline leading-snug"
                    title={item.name}
                  >
                    {item.name}
                  </Link>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {item.variationName && (
                      <span className="text-[12px] font-sans text-[#69736B]">
                        {item.variationName}
                      </span>
                    )}
                    {item.warrantyName && (
                      <span className="text-[11px] font-sans text-stone-400">
                        • {item.warrantyName}
                      </span>
                    )}
                    {item.isQuoteOnly && (
                      <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                        Sob consulta
                      </span>
                    )}
                  </div>

                  {/* Seletor de Quantidade em Pílula */}
                  <div className="flex items-center justify-between border border-[#D1D5DB] rounded-full px-2 py-0.5 w-[80px] bg-white mt-2.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Diminuir quantidade"
                      className="text-stone-500 hover:text-black text-[14px] px-1 select-none cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-[12px] font-sans font-medium text-black">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Aumentar quantidade"
                      className="text-stone-500 hover:text-black text-[14px] px-1 select-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Lado Direito: Lixeira e Preço */}
                <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5 min-h-[72px]">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remover produto do carrinho"
                    className="text-stone-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                    title="Remover do carrinho"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>

                  <span className="text-[15px] font-heading font-bold text-black tracking-tight mt-auto">
                    {item.isQuoteOnly ? "Sob consulta" : formatBRL(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé Fixo do Carrinho Mobile */}
        {items.length > 0 && (
          <div className="bg-white border-t border-[#EDEDED] px-[17px] pt-4 pb-8 flex-shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            {hasQuoteOnlyItems ? (
              totalPrice > 0 ? (
                <div className="mb-3">
                  <p className="text-[11px] font-sans text-stone-600 italic leading-snug">
                    * Atenção: O valor total é <strong>parcial</strong> pois seu carrinho contém item(ns) sob consulta. O valor final desses produtos será informado por nossos atendentes na confirmação do pedido.
                  </p>
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-stone-100">
                    <span className="text-[12px] font-sans text-[#69736B]">
                      Valor total parcial:
                    </span>
                    <span className="text-[20px] font-heading font-bold text-black leading-none">
                      {formatBRL(totalPrice)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <p className="text-[11px] font-sans text-stone-600 italic leading-snug">
                    Seu carrinho contém itens sob consulta. Nossos consultores entrarão em contato para apresentar o orçamento personalizado.
                  </p>
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-stone-100">
                    <span className="text-[12px] font-sans text-[#69736B]">
                      Valor total:
                    </span>
                    <span className="text-[20px] font-heading font-bold text-black leading-none">
                      Sob consulta
                    </span>
                  </div>
                </div>
              )
            ) : (
              <div className="mb-3">
                <p className="text-[11px] font-sans text-[#69736B] italic leading-snug">
                  Finalize seu carrinho e nossos atendentes entrarão em contato para realizar sua compra
                </p>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-stone-100">
                  <span className="text-[13px] font-sans text-[#69736B]">
                    Valor total:
                  </span>
                  <span className="text-[22px] font-heading font-bold text-black leading-none">
                    {formatBRL(totalPrice)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-4 px-6 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-[14px] font-sans font-medium transition-all duration-200 shadow-xs cursor-pointer text-center"
            >
              Finalizar compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
