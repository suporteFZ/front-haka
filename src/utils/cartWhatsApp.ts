import { CartItem } from "@/context/CartContext";

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Retorna as linhas de especificações/opções de um item do carrinho em formato de lista.
 * Trata tanto itens novos (com array options) quanto legados já no localStorage (variationName).
 */
export function getItemOptionLines(item: CartItem): string[] {
  // 1. Se já tiver o array estruturado de opções
  if (item.options && Array.isArray(item.options) && item.options.length > 0) {
    return item.options.map((opt) => `• ${opt}`);
  }

  // 2. Se não tiver variação ou for padrão
  if (
    !item.variationName ||
    item.variationName === "default" ||
    item.variationName === "Padrão"
  ) {
    return [];
  }

  // 3. Divide strings combinadas por " • " ou " | "
  const rawParts = item.variationName
    .split(/\s*(?:•|\|)\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  return rawParts.map((part) => {
    // Se a parte já tiver um rótulo explícito (ex: "Revestimento: Couro", "Cor: Preto", "Medida: 120cm", "Base: Preto")
    if (part.includes(":")) {
      return `• ${part}`;
    }
    // Caso seja apenas o nome de uma cor simples (ex: "Preto", "Azul")
    return `• Cor: ${part}`;
  });
}

/**
 * Monta a mensagem completa e formatada para envio no WhatsApp
 */
export function buildCartWhatsAppMessage({
  items,
  totalPrice,
  hasQuoteOnlyItems,
  whatsappNumber,
  origin,
}: {
  items: CartItem[];
  totalPrice: number;
  hasQuoteOnlyItems: boolean;
  whatsappNumber?: string;
  origin: string;
}): { fullMsg: string; finalNumber: string } {
  const itemsFormatted = items
    .map((item) => {
      const lines = [`*${item.quantity}x ${item.name}*`];

      // Opções detalhadas em formato de lista (Revestimento, Cor, Medida, etc.)
      const optionLines = getItemOptionLines(item);
      if (optionLines.length > 0) {
        lines.push(...optionLines);
      }

      // Garantia
      if (item.warrantyName && item.warrantyName !== "Garantia padrão") {
        lines.push(`• Garantia: ${item.warrantyName}`);
      }

      // Valor
      lines.push(
        `• Valor: ${
          item.isQuoteOnly ? "Sob consulta" : formatBRL(item.price * item.quantity)
        }`
      );

      // Link do produto
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

  return { fullMsg, finalNumber };
}
