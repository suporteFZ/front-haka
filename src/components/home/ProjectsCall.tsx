import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getStrapiMedia } from "@/utils/api";
import { ProjetoItem, FALLBACK_PROJECTS } from "@/data/projects";

export { FALLBACK_PROJECTS };
export type { ProjetoItem };

interface ProjectsCallProps {
  data?: {
    Titulo?: string;
    Descricao?: string;
    Metrica_1_valor?: string;
    Metrica_1_label?: string;
    Metrica_2_valor?: string;
    Metrica_2_label?: string;
    Texto_botao?: string;
    Link_botao?: string;
    projetos?: ProjetoItem[];
  } | null;
}

export default function ProjectsCall({ data }: ProjectsCallProps) {
  const title =
    data?.Titulo || "Design que respeita a arquitetura do corpo";
  const description =
    data?.Descricao ||
    "Criamos ecossistemas corporativos integrados. Nossos projetos unem ergonomia de ponta, estética atemporal e soluções que otimizam o bem-estar diário de equipes de alta performance.";

  const metric1Val = data?.Metrica_1_valor || "98%";
  const metric1Label = data?.Metrica_1_label || "Satisfação Ergonômica";
  const metric2Val = data?.Metrica_2_valor || "50k+";
  const metric2Label = data?.Metrica_2_label || "M² Projetados";

  const buttonText = data?.Texto_botao || "Ver Nosso Portfólio";
  const buttonLink = data?.Link_botao || "/projetos";

  // Se houver projetos cadastrados no Strapi, usamos eles. Caso contrário, usamos os fallbacks do design
  const projects: ProjetoItem[] =
    data?.projetos && data.projetos.length > 0
      ? data.projetos
      : FALLBACK_PROJECTS.slice(0, 2);

  return (
    <section className="w-full bg-white py-16 md:py-24 px-[17px] md:px-8 flex items-center justify-center border-t border-[#EDEDED]">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Coluna Esquerda: Conteúdo & Chamada */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h2 className="text-[32px] md:text-[42px] font-heading font-semibold text-black leading-[1.12] tracking-tight">
              {title}
            </h2>

            <p className="mt-4 md:mt-5 text-[14px] md:text-[15px] font-sans text-[#777777] leading-relaxed max-w-lg">
              {description}
            </p>

            {/* Métricas */}
            <div className="flex items-center gap-10 md:gap-14 mt-8 md:mt-10 mb-8 md:mb-10">
              <div className="flex flex-col">
                <span className="text-[36px] md:text-[42px] font-sans font-bold text-black leading-none tracking-tight">
                  {metric1Val}
                </span>
                <span className="text-[11px] md:text-[12px] font-sans text-[#777777] mt-1.5 leading-tight">
                  {metric1Label}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[36px] md:text-[42px] font-sans font-bold text-black leading-none tracking-tight">
                  {metric2Val}
                </span>
                <span className="text-[11px] md:text-[12px] font-sans text-[#777777] mt-1.5 leading-tight">
                  {metric2Label}
                </span>
              </div>
            </div>

            {/* Botão de Ação */}
            <div>
              <Link
                href={buttonLink}
                className="inline-flex items-center justify-center gap-2.5 bg-black text-white hover:bg-neutral-800 text-[13px] md:text-[14px] font-medium font-sans px-7 py-3.5 rounded-full transition-all w-fit active:scale-95 group shadow-sm"
              >
                <span>{buttonText}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Coluna Direita: Cards de Projetos */}
          <div className="lg:col-span-7 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              {projects.map((project) => {
                const coverUrl =
                  getStrapiMedia(project.Imagem_capa?.url) ||
                  project.Imagem_capa?.url ||
                  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

                const logoUrl =
                  getStrapiMedia(project.Logo_cliente?.url) ||
                  project.Logo_cliente?.url;

                return (
                  <Link
                    key={project.id || project.slug}
                    href={`/projetos/${project.slug}`}
                    className="border border-[#EDEDED] rounded-[24px] bg-white overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-stone-300"
                  >
                    {/* Imagem do Projeto */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-stone-100">
                      <Image
                        src={coverUrl}
                        alt={project.Titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 35vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="p-5 md:p-6 flex flex-col flex-1 justify-between bg-white">
                      <div>
                        {/* Barra Superior: Tag Cliente + Logo */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] md:text-[12px] font-sans font-bold uppercase tracking-wider text-black">
                            {project.Cliente}
                          </span>

                          {logoUrl ? (
                            <div className="relative h-5 w-24 flex items-center justify-end">
                              <Image
                                src={logoUrl}
                                alt={project.Cliente}
                                width={90}
                                height={20}
                                className="h-5 w-auto object-contain max-h-5"
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] font-sans font-semibold text-stone-400 uppercase tracking-widest">
                              HAKA
                            </span>
                          )}
                        </div>

                        {/* Título do Projeto */}
                        <h3 className="text-[16px] md:text-[18px] font-heading font-bold text-black mt-2 mb-2 group-hover:text-neutral-700 transition-colors leading-snug">
                          {project.Titulo}
                        </h3>

                        {/* Descrição Curta */}
                        <p className="text-[13px] font-sans text-[#777777] leading-relaxed line-clamp-2">
                          {project.Descricao_curta}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
