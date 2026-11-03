"use client";

import React from "react";

interface RichTextRendererProps {
  content: string | any;
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null;

  // 1. Caso seja array de Blocos do Strapi 5 (Blocks)
  if (Array.isArray(content)) {
    return (
      <div className="flex flex-col gap-5 text-[15px] md:text-[17px] font-sans text-[#666666] leading-[1.8]">
        {content.map((block: any, idx: number) => {
          if (block.type === "paragraph") {
            const text = block.children?.map((c: any) => c.text).join("") || "";
            return (
              <p key={idx} className="leading-relaxed">
                {text}
              </p>
            );
          }
          if (block.type === "heading") {
            const text = block.children?.map((c: any) => c.text).join("") || "";
            const level = block.level || 2;
            if (level === 1 || level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-[24px] md:text-[28px] font-heading font-bold text-black mt-6 mb-2 leading-tight"
                >
                  {text}
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                className="text-[20px] md:text-[22px] font-heading font-semibold text-black mt-4 mb-2 leading-tight"
              >
                {text}
              </h3>
            );
          }
          if (block.type === "list") {
            const isOrdered = block.format === "ordered";
            const Tag = isOrdered ? "ol" : "ul";
            return (
              <Tag
                key={idx}
                className={`my-3 pl-6 flex flex-col gap-2 ${
                  isOrdered ? "list-decimal" : "list-disc"
                }`}
              >
                {block.children?.map((li: any, lIdx: number) => (
                  <li key={lIdx} className="leading-relaxed">
                    {li.children?.map((c: any) => c.text).join("")}
                  </li>
                ))}
              </Tag>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // 2. Caso seja string (Markdown ou Texto Simples)
  if (typeof content === "string") {
    // Quebra em parágrafos separados por linhas duplas
    const blocks = content.trim().split(/\n\s*\n/);

    return (
      <div className="flex flex-col gap-6 text-[16px] md:text-[17px] font-sans text-[#666666] leading-[1.8]">
        {blocks.map((block, idx) => {
          const trimmed = block.trim();

          // Cabeçalho H2 (## )
          if (trimmed.startsWith("## ")) {
            return (
              <h2
                key={idx}
                className="text-[24px] md:text-[30px] font-heading font-bold text-black mt-6 mb-1 tracking-tight"
              >
                {trimmed.replace(/^##\s+/, "")}
              </h2>
            );
          }

          // Cabeçalho H3 (### )
          if (trimmed.startsWith("### ")) {
            return (
              <h3
                key={idx}
                className="text-[20px] md:text-[23px] font-heading font-semibold text-black mt-4 mb-1"
              >
                {trimmed.replace(/^###\s+/, "")}
              </h3>
            );
          }

          // Lista de itens (- ou *)
          if (trimmed.split("\n").some((l) => l.trim().match(/^[-*•]\s+/))) {
            const lines = trimmed.split("\n");
            return (
              <ul key={idx} className="my-2 pl-6 flex flex-col gap-2.5 list-disc text-[#666666]">
                {lines.map((line, lIdx) => {
                  const cleaned = line.trim().replace(/^[-*•]\s+/, "");
                  // Processa negrito simples **texto**
                  const parts = cleaned.split(/(\*\*.*?\*\*)/g);
                  return (
                    <li key={lIdx} className="leading-relaxed">
                      {parts.map((part, pIdx) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={pIdx} className="font-semibold text-black">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return part;
                      })}
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Lista numerada (1. 2. 3.)
          if (trimmed.split("\n").some((l) => l.trim().match(/^\d+\.\s+/))) {
            const lines = trimmed.split("\n");
            return (
              <ol key={idx} className="my-2 pl-6 flex flex-col gap-2.5 list-decimal text-[#666666]">
                {lines.map((line, lIdx) => {
                  const cleaned = line.trim().replace(/^\d+\.\s+/, "");
                  const parts = cleaned.split(/(\*\*.*?\*\*)/g);
                  return (
                    <li key={lIdx} className="leading-relaxed">
                      {parts.map((part, pIdx) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={pIdx} className="font-semibold text-black">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return part;
                      })}
                    </li>
                  );
                })}
              </ol>
            );
          }

          // Parágrafo com suporte a negrito **texto**
          const parts = trimmed.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx} className="leading-relaxed">
              {parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={pIdx} className="font-semibold text-black">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  }

  return null;
}
