"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

interface CartPanelProps {
  isCartOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

// Formatar moeda brasileira BRL
function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CartPanel({ isCartOpen, onClose, whatsappNumber }: CartPanelProps) {
  const { items, updateQuantity, removeItem, totalPrice, hasQuoteOnlyItems } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;

    const origin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

    // Formatação detalhada e profissional de cada produto sem emojis
    const itemsFormatted = items
      .map((item) => {
        const lines = [`*${item.quantity}x ${item.name}*`];
        if (item.variationName && item.variationName !== "default" && item.variationName !== "Padrão") {
          lines.push(`• Cor: ${item.variationName}`);
        }
        if (item.warrantyName && item.warrantyName !== "Garantia padrão") {
          lines.push(`• Garantia: ${item.warrantyName}`);
        }
        lines.push(`• Valor: ${item.isQuoteOnly ? "Sob consulta" : formatBRL(item.price * item.quantity)}`);
        if (item.slug) {
          lines.push(`• Link: ${origin}/produto/${item.slug}`);
        }
        return lines.join("\n");
      })
      .join("\n\n");

    let totalSection = "";
    if (hasQuoteOnlyItems) {
      if (totalPrice > 0) {
        totalSection = `• *Valor total parcial:* ${formatBRL(totalPrice)} (+ itens sob consulta)`;
      } else {
        totalSection = `• *Valor total:* Sob consulta`;
      }
    } else {
      totalSection = `• *Valor total:* ${formatBRL(totalPrice)}`;
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const fullMsg = [
      `*Novo Pedido - Haka*`,
      ``,
      `Olá! Gostaria de finalizar meu pedido:`,
      ``,
      `*Itens no Carrinho:*`,
      itemsFormatted,
      ``,
      `───────────────────`,
      `*Resumo do Pedido:*`,
      `• Total de itens: ${totalQuantity}`,
      totalSection,
      ``,
      `Finalizei meu carrinho pelo site e aguardo o atendimento para concluir a compra!`,
    ].join("\n");

    const rawNumber = (whatsappNumber || "554530550000").replace(/\D/g, "");
    const finalNumber = rawNumber.length <= 11 ? `55${rawNumber}` : rawNumber;

    window.open(`https://wa.me/${finalNumber}?text=${encodeURIComponent(fullMsg)}`, "_blank");
  };

  return (
    <div
      data-lenis-prevent
      className={`hidden md:block absolute top-[90px] md:top-[100px] left-1/2 -translate-x-1/2 w-[calc(100%-34px)] md:w-[90%] max-w-5xl px-[17px] md:px-8 z-20 text-black transition-all ease-in-out ${
        isCartOpen
          ? "opacity-100 translate-y-4 pointer-events-auto duration-500 delay-[200ms]"
          : "opacity-0 -translate-y-4 pointer-events-none duration-200 delay-0"
      }`}
    >
      <div className="w-full font-sans pb-6">
        {/* Título do Carrinho */}
        <h2 className="text-[18px] md:text-[20px] font-heading font-bold text-black mb-4">
          Carrinho
        </h2>

        {/* Estado Vazio */}
        {items.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
            <svg
              width="36"
              height="36"
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
            <p className="text-[14px] font-sans text-stone-500">
              Seu carrinho está vazio.
            </p>
            <p className="text-[12px] font-sans text-stone-400">
              Adicione produtos para solicitar seu orçamento ou finalizar sua compra.
            </p>
          </div>
        ) : (
          <>
            {/* Lista de Produtos: Altura travada em exatamente 2 produtos (~230px), mantendo o rodapé fixo mesmo com apenas 1 produto */}
            <div
              data-lenis-prevent
              className="h-[230px] md:h-[240px] min-h-[230px] md:min-h-[240px] max-h-[230px] md:max-h-[240px] overflow-y-auto overscroll-contain pr-1 md:pr-2 border-t border-[#EDEDED] cart-scroll"
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 md:py-4 border-b border-[#EDEDED] flex items-center justify-between gap-3 md:gap-4"
                >
                  {/* Lado Esquerdo: Imagem + Detalhes */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    {/* Imagem em Miniatura */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 bg-white rounded-[10px] flex items-center justify-center p-1">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-100 rounded flex items-center justify-center text-[10px] text-stone-400">
                          Sem foto
                        </div>
                      )}
                    </div>

                    {/* Informações: Nome, Variação e Quantidade */}
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/produto/${item.slug}`}
                        onClick={onClose}
                        className="text-[13px] md:text-[15px] font-sans font-medium text-black line-clamp-1 hover:underline leading-snug"
                        title={item.name}
                      >
                        {item.name}
                      </Link>

                      <div className="flex items-center gap-2 mt-0.5">
                        {item.variationName && (
                          <span className="text-[12px] md:text-[13px] font-sans text-[#69736B]">
                            {item.variationName}
                          </span>
                        )}
                        {item.isQuoteOnly && (
                          <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                            Sob consulta
                          </span>
                        )}
                      </div>

                      {/* Seletor de Quantidade em Pílula */}
                      <div className="flex items-center justify-between border border-[#D1D5DB] rounded-full px-2 py-0.5 w-[80px] md:w-[84px] bg-white mt-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Diminuir quantidade"
                          className="text-stone-500 hover:text-black text-[13px] px-1 select-none cursor-pointer"
                        >
                          −
                        </button>
                        <span className="text-[11px] md:text-[12px] font-sans font-medium text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Aumentar quantidade"
                          className="text-stone-500 hover:text-black text-[13px] px-1 select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Lixeira + Preço */}
                  <div className="flex flex-col items-end justify-between self-stretch py-0.5 shrink-0">
                    {/* Botão Remover (Lixeira) */}
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

                    {/* Preço */}
                    <span className="text-[15px] md:text-[18px] font-heading font-bold text-black tracking-tight">
                      {item.isQuoteOnly ? "Sob consulta" : formatBRL(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé Fixo: Botão Finalizar Compra + Mensagem + Valor Total */}
            <div className="pt-5 md:pt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Botão Finalizar Compra */}
              <button
                type="button"
                onClick={handleCheckout}
                className="py-3.5 px-8 md:px-10 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-[13px] md:text-[14px] font-sans font-medium transition-all duration-200 shadow-xs cursor-pointer text-center whitespace-nowrap"
              >
                Finalizar compra
              </button>

              {/* Mensagem Institucional + Valor Total */}
              <div className="flex flex-col items-start md:items-end text-left md:text-right max-w-lg">
                {hasQuoteOnlyItems ? (
                  totalPrice > 0 ? (
                    <>
                      <p className="text-[11px] md:text-[12px] font-sans text-stone-600 italic leading-tight">
                        * Atenção: O valor total é <strong>parcial</strong> pois seu carrinho contém item(ns) sob consulta. O valor final desses produtos será informado por nossos atendentes na confirmação do pedido.
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[12px] md:text-[13px] font-sans text-[#69736B]">
                          Valor total parcial:
                        </span>
                        <span className="text-[20px] md:text-[24px] font-heading font-bold text-black leading-none">
                          {formatBRL(totalPrice)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] md:text-[12px] font-sans text-stone-600 italic leading-tight">
                        Seu carrinho contém itens sob consulta. Nossos consultores entrarão em contato para apresentar o orçamento personalizado.
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[12px] md:text-[13px] font-sans text-[#69736B]">
                          Valor total:
                        </span>
                        <span className="text-[20px] md:text-[24px] font-heading font-bold text-black leading-none">
                          Sob consulta
                        </span>
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <p className="text-[11px] md:text-[12px] font-sans text-[#69736B] italic leading-tight">
                      Finalize seu carrinho e nossos atendentes entrarão em contato para realizar sua compra
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[12px] md:text-[13px] font-sans text-[#69736B]">
                        Valor total:
                      </span>
                      <span className="text-[20px] md:text-[24px] font-heading font-bold text-black leading-none">
                        {formatBRL(totalPrice)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
