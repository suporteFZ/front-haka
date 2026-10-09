"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { getStrapiMedia } from "@/utils/api";
import { ProjetoItem, CategoriaProjetoItem } from "@/data/projects";
import { useLenis } from "lenis/react";

interface ProjectsViewProps {
  initialProjects: ProjetoItem[];
  initialSlug?: string;
  headerData?: {
    Tag?: string;
    Titulo?: string;
    Descricao?: string;
    Imagem_banner?: any;
    Titulo_secao?: string;
    Subtitulo_secao?: string;
  } | null;
  categories?: CategoriaProjetoItem[];
}

function getClientTag(clientName?: string): string {
  if (!clientName) return "CORPORATIVO";
  const upper = clientName.toUpperCase().trim();
  if (upper.includes("SICREDI")) return "SICREDI";
  if (upper.includes("PRIMATO")) return "PRIMATO";
  if (upper.includes("NEXUS")) return "CORPORATIVO";
  return upper;
}

function projectMatchesTag(project: ProjetoItem, tag: string): boolean {
  if (!tag) return true;
  const upperTag = tag.toUpperCase().trim();

  // Se o projeto possui categorias vinculadas, a filtragem é ESTRITA pelas categorias
  if (Array.isArray(project.categorias) && project.categorias.length > 0) {
    return project.categorias.some(
      (c) =>
        c.Nome?.toUpperCase().trim() === upperTag ||
        c.slug?.toUpperCase().trim() === upperTag
    );
  }

  // Fallback apenas para projetos sem nenhuma categoria cadastrada
  const clientTag = getClientTag(project.Cliente);
  if (clientTag === upperTag) return true;
  if (project.Cliente && project.Cliente.toUpperCase().includes(upperTag)) return true;
  return false;
}

function getProjectPrimaryTag(project?: ProjetoItem | null): string {
  if (!project) return "SICREDI";
  if (Array.isArray(project.categorias) && project.categorias.length > 0 && project.categorias[0]?.Nome) {
    return project.categorias[0].Nome.toUpperCase().trim();
  }
  return getClientTag(project.Cliente);
}

function ChairIcon({ className = "w-5 h-5 text-stone-700" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 19v2" />
      <path d="M18 19v2" />
      <path d="M12 19v3" />
      <path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-4z" />
      <path d="M8 9V6a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function DeskIcon({ className = "w-5 h-5 text-stone-700" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="11" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="4" x2="12" y2="15" />
      <path d="M6 15v5" />
      <path d="M18 15v5" />
    </svg>
  );
}

function AreaIcon({ className = "w-5 h-5 text-stone-700" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
      <path d="M4 15v4a1 1 0 0 0 1 1h4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
    </svg>
  );
}

function renderDefaultIcon(index: number, title?: string) {
  const lower = (title || "").toLowerCase();
  if (
    lower.includes("mesa") ||
    lower.includes("estação") ||
    lower.includes("estacao") ||
    lower.includes("squad") ||
    index === 1
  ) {
    return <DeskIcon className="w-5 h-5 text-stone-700" />;
  }
  if (
    lower.includes("m²") ||
    lower.includes("área") ||
    lower.includes("area") ||
    lower.includes("planej") ||
    index === 2
  ) {
    return <AreaIcon className="w-5 h-5 text-stone-700" />;
  }
  return <ChairIcon className="w-5 h-5 text-stone-700" />;
}

export default function ProjectsView({
  initialProjects,
  initialSlug,
  headerData,
  categories,
}: ProjectsViewProps) {
  const lenis = useLenis();
  const projects = initialProjects.length > 0 ? initialProjects : [];
  
  // Projeto selecionado (inicializa com initialSlug ou o primeiro projeto)
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    if (initialSlug && projects.some((p) => p.slug === initialSlug)) {
      return initialSlug;
    }
    return projects[0]?.slug || "";
  });

  const selectedProject =
    projects.find((p) => p.slug === selectedSlug) || projects[0] || null;

  // Lista dinâmica de tags de clientes/categorias (com as categorias do Strapi ou padrões)
  const clientTags = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => c.Nome.toUpperCase().trim());
    }
    const defaultTags = ["SICREDI", "PRIMATO", "CORPORATIVO"];
    const dynamicTags: string[] = [];
    projects.forEach((p) => {
      if (Array.isArray(p.categorias) && p.categorias.length > 0) {
        p.categorias.forEach((c) => {
          const upper = c.Nome?.toUpperCase().trim();
          if (upper && !defaultTags.includes(upper) && !dynamicTags.includes(upper)) {
            dynamicTags.push(upper);
          }
        });
      } else {
        const tag = getClientTag(p.Cliente);
        if (!defaultTags.includes(tag) && !dynamicTags.includes(tag)) {
          dynamicTags.push(tag);
        }
      }
    });
    return [...defaultTags, ...dynamicTags];
  }, [categories, projects]);

  // Tag atualmente selecionada (sincronizada com o projeto ativo)
  const [selectedTag, setSelectedTag] = useState<string>(() => {
    const initialProject =
      projects.find((p) => p.slug === initialSlug) || projects[0];
    return getProjectPrimaryTag(initialProject);
  });

  // Atualiza a tag selecionada sempre que o projeto selecionado mudar externamente
  useEffect(() => {
    if (selectedProject) {
      if (!projectMatchesTag(selectedProject, selectedTag)) {
        setSelectedTag(getProjectPrimaryTag(selectedProject));
      }
    }
  }, [selectedProject, selectedTag]);

  // Projetos filtrados pela tag ativa
  const filteredProjects = useMemo(() => {
    if (!selectedTag) return projects;
    return projects.filter((p) => projectMatchesTag(p, selectedTag));
  }, [projects, selectedTag]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Quando o slug inicial mudar externamente
  useEffect(() => {
    if (initialSlug && projects.some((p) => p.slug === initialSlug)) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug, projects]);

  // Sempre que mudar o projeto selecionado, reseta o slider de fotos
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [selectedSlug]);

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    // Encontra o primeiro projeto que pertence a esta tag e o seleciona
    const match = projects.find((p) => projectMatchesTag(p, tag));
    if (match) {
      setSelectedSlug(match.slug);
      window.history.replaceState(null, "", `/projetos/${match.slug}`);
    }
    cardsContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  // Imagens da galeria do projeto selecionado
  const galleryImages: string[] = [];
  if (selectedProject) {
    if (Array.isArray(selectedProject.Galeria) && selectedProject.Galeria.length > 0) {
      selectedProject.Galeria.forEach((img: any) => {
        const url = getStrapiMedia(img?.url) || img?.url;
        if (url) galleryImages.push(url);
      });
    }
    if (galleryImages.length === 0) {
      const cover =
        getStrapiMedia(selectedProject.Imagem_capa?.url) ||
        selectedProject.Imagem_capa?.url ||
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80";
      galleryImages.push(cover);
    }
  }

  const handlePrevSlide = () => {
    if (galleryImages.length <= 1) return;
    setCurrentSlideIndex((prev) =>
      prev > 0 ? prev - 1 : galleryImages.length - 1
    );
  };

  const handleNextSlide = () => {
    if (galleryImages.length <= 1) return;
    setCurrentSlideIndex((prev) =>
      prev < galleryImages.length - 1 ? prev + 1 : 0
    );
  };

  const handleSelectCard = (project: ProjetoItem) => {
    setSelectedSlug(project.slug);
    if (!projectMatchesTag(project, selectedTag)) {
      setSelectedTag(getProjectPrimaryTag(project));
    }
    // Atualiza a URL sem recarregar a página
    window.history.replaceState(null, "", `/projetos/${project.slug}`);

    // Rola suavemente até o título dos detalhes do projeto selecionado (Desktop e Mobile)
    const target = detailsRef.current;
    if (target) {
      setTimeout(() => {
        if (lenis) {
          lenis.scrollTo(target, { offset: -100, duration: 1.2 });
        } else {
          const top = target.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 50);
    }
  };

  const selectedLogoUrl =
    selectedProject &&
    (getStrapiMedia(selectedProject.Logo_cliente?.url) ||
      selectedProject.Logo_cliente?.url);

  const desafioTexto =
    selectedProject?.Desafio ||
    (typeof selectedProject?.Texto === "string" ? selectedProject.Texto : null) ||
    selectedProject?.Descricao_curta ||
    "";

  const deliverables =
    Array.isArray(selectedProject?.Itens) && selectedProject.Itens.length > 0
      ? selectedProject.Itens
      : [
          {
            Titulo: selectedProject?.Item_1_titulo || "50+ Cadeiras",
            Subtitulo: selectedProject?.Item_1_subtitulo || "Modelo Ergonômico Premium",
          },
          {
            Titulo: selectedProject?.Item_2_titulo || "20 Mesas Reguláveis",
            Subtitulo: selectedProject?.Item_2_subtitulo || "Estações de Trabalho Ativas",
          },
          {
            Titulo: selectedProject?.Item_3_titulo || "800 m² Planejados",
            Subtitulo: selectedProject?.Item_3_subtitulo || "Área Total de Conforto Otimizado",
          },
        ];

  const depoimentoTexto =
    selectedProject?.Depoimento?.Texto ||
    selectedProject?.Depoimento_texto ||
    (selectedProject?.slug === "nova-agencia-sicredi"
      ? "A HAKA transformou nosso escritório de forma completa. O conforto das novas estações de trabalho e o design das cadeiras ergonômicas elevaram a produtividade e o bem-estar da nossa equipe em 30%."
      : null);

  const depoimentoAutor =
    selectedProject?.Depoimento?.Autor ||
    selectedProject?.Depoimento_autor ||
    (selectedProject?.slug === "nova-agencia-sicredi" ? "Carlos Mendes" : null);

  const depoimentoCargo =
    selectedProject?.Depoimento?.Cargo ||
    selectedProject?.Depoimento_cargo ||
    (selectedProject?.slug === "nova-agencia-sicredi" ? "CEO, Sicredi" : null);

  const bannerImageUrl =
    headerData?.Imagem_banner?.url
      ? getStrapiMedia(headerData.Imagem_banner.url) || headerData.Imagem_banner.url
      : "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2000&q=85";

  const bannerWidth = headerData?.Imagem_banner?.width;
  const bannerHeight = headerData?.Imagem_banner?.height;
  const bannerAspectRatio =
    bannerWidth && bannerHeight ? `${bannerWidth} / ${bannerHeight}` : undefined;

  const heroTag = headerData?.Tag || "PORTFÓLIO HAKA";
  const heroTitulo = headerData?.Titulo || "Projetos Entregues";
  const heroDescricao =
    headerData?.Descricao ||
    "Ambientes completos que transformam a rotina de trabalho em experiência de conforto, sofisticação e produtividade.";

  const secaoTitulo =
    headerData?.Titulo_secao || "Ambientes com Identidade e Ergonomia";
  const secaoSubtitulo =
    headerData?.Subtitulo_secao ||
    "Navegue e conheça os detalhes dos principais projetos entregues pela Haka Cadeiras";

  return (
    <div className="w-full min-h-screen bg-white text-black">
      {/* 1. HERO BANNER PRINCIPAL (Proporcional à imagem real para não cortar na vertical) */}
      <section
        style={bannerAspectRatio ? { aspectRatio: bannerAspectRatio } : undefined}
        className="relative w-full min-h-[440px] flex items-center justify-center overflow-hidden bg-stone-900 text-white pt-24 md:pt-32 pb-16 md:pb-24"
      >
        {/* Imagem de Fundo com Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={bannerImageUrl}
            alt={heroTitulo}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
        </div>

        {/* Conteúdo Centralizado do Hero */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-[11px] md:text-[12px] font-sans font-medium uppercase tracking-[0.2em] text-white mb-4 shadow-sm">
            {heroTag}
          </div>

          <h1 className="text-[36px] sm:text-[48px] md:text-[60px] font-heading font-medium text-white tracking-tight leading-[1.1] max-w-3xl">
            {heroTitulo}
          </h1>

          <p className="mt-4 text-[14px] sm:text-[15px] md:text-[16px] font-sans text-stone-200/90 max-w-2xl leading-relaxed">
            {heroDescricao}
          </p>
        </div>
      </section>

      {/* 2. SEÇÃO DE CARROSSEL / LISTAGEM DOS PROJETOS */}
      <section className="w-full bg-white pt-10 md:pt-16 pb-6 md:pb-10 overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 md:px-8">
          {/* Header no Desktop */}
          <div className="hidden lg:block mb-6 md:mb-8">
            <h2 className="text-[22px] sm:text-[26px] md:text-[30px] font-heading font-semibold text-black tracking-tight">
              {secaoTitulo}
            </h2>
            <p className="text-[13px] sm:text-[14px] font-sans text-[#777777] mt-1">
              {secaoSubtitulo.includes("Haka Cadeiras") ? (
                <>
                  {secaoSubtitulo.split("Haka Cadeiras")[0]}
                  <span className="font-semibold text-black">Haka Cadeiras</span>
                  {secaoSubtitulo.split("Haka Cadeiras")[1]}
                </>
              ) : (
                secaoSubtitulo
              )}
            </p>
          </div>

          {/* Header no Mobile: "Nossos Clientes" (conforme media_1791219421318.png) */}
          <div className="block lg:hidden mb-4">
            <h2 className="text-[22px] font-heading font-bold text-black tracking-tight">
              Nossos Clientes
            </h2>
          </div>

          {/* Tags de Filtro de Clientes (SOMENTE NO MOBILE) */}
          <div className="flex lg:hidden items-center gap-2.5 overflow-x-auto pb-2 mb-6 scrollbar-none -mr-5 pr-5 sm:-mr-6 sm:pr-6">
            {clientTags.map((tag) => {
              const isTagSelected = tag === selectedTag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  className={`px-5 py-2.5 rounded-full text-[11px] sm:text-[12px] font-sans font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex-shrink-0 ${
                    isTagSelected
                      ? "bg-[#1E2420] text-white shadow-sm"
                      : "bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-stone-50 hover:text-black"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Carrossel de Cards com Scroll Horizontal (1 e 1/3 de outro no mobile, sangrando até a borda direita) */}
          <div
            ref={cardsContainerRef}
            className="flex items-stretch gap-4 sm:gap-5 md:gap-6 overflow-x-auto pt-2 pb-8 md:pb-12 scrollbar-none snap-x snap-mandatory scroll-smooth -mr-5 pr-5 sm:-mr-6 sm:pr-6 md:mr-0 md:pr-0"
          >
            {projects.length > 0 ? (
              <>
                {projects.map((project) => {
                  const isSelected = project.slug === selectedSlug;
                  const isMatch = projectMatchesTag(project, selectedTag);
                  const coverUrl =
                    getStrapiMedia(project.Imagem_capa?.url) ||
                    project.Imagem_capa?.url ||
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

                  const logoUrl =
                    getStrapiMedia(project.Logo_cliente?.url) ||
                    project.Logo_cliente?.url;

                  const isSicredi = project.Cliente?.toUpperCase().includes("SICREDI");

                  return (
                    <div
                      key={project.id || project.slug}
                      onClick={() => handleSelectCard(project)}
                      className={`w-[78vw] max-w-[340px] sm:w-[320px] md:w-[360px] lg:w-[380px] flex-shrink-0 snap-start rounded-[20px] bg-white cursor-pointer transition-all duration-300 flex-col justify-between overflow-hidden select-none border ${
                        isMatch ? "flex" : "hidden lg:flex"
                      } ${
                        isSelected
                          ? "border-[2px] border-black shadow-lg ring-1 ring-black/5"
                          : "border border-[#EDEDED] hover:border-stone-400 hover:shadow-md"
                      }`}
                    >
                      {/* Imagem do Projeto (proporção panorâmica compacta conforme layout) */}
                      <div className="relative w-full aspect-[2.35/1] sm:aspect-[2.2/1] md:aspect-[16/9] overflow-hidden bg-stone-100">
                        <Image
                          src={coverUrl}
                          alt={project.Titulo}
                          fill
                          sizes="(max-width: 768px) 320px, 400px"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                        />

                        {/* Badge SELECIONADO sobre a foto no Desktop (media_1791227902830.png) */}
                        {isSelected && (
                          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-sans font-bold tracking-wider uppercase absolute top-3 left-3 z-10 shadow-md">
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="16 10 11 15 8 12" />
                            </svg>
                            <span>SELECIONADO</span>
                          </div>
                        )}
                      </div>

                      {/* Conteúdo do Card */}
                      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-white">
                        <div>
                          {/* Badge SELECIONADO dentro do corpo apenas no Mobile (media_1791225004295.png) */}
                          {isSelected && (
                            <div className="inline-flex lg:hidden items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[10px] font-sans font-bold tracking-wider uppercase mb-3 w-fit shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              <span>SELECIONADO</span>
                            </div>
                          )}

                          {/* Linha Cliente + Logo */}
                          <div className="flex items-center justify-between gap-3 mb-2.5">
                            <span
                              className={`text-[11px] md:text-[12px] font-sans font-bold uppercase tracking-wider ${
                                isSicredi ? "text-[#15803D]" : "text-black"
                              }`}
                            >
                              {project.Cliente}
                            </span>

                            {logoUrl && (
                              <div className="relative h-5 w-24 flex items-center justify-end">
                                <Image
                                  src={logoUrl}
                                  alt={project.Cliente}
                                  width={90}
                                  height={20}
                                  className="h-5 w-auto object-contain max-h-5"
                                />
                              </div>
                            )}
                          </div>

                          {/* Título do Projeto */}
                          <h3 className="text-[17px] sm:text-[18px] font-heading font-bold text-black mb-2.5 leading-snug line-clamp-1">
                            {project.Titulo}
                          </h3>

                          {/* Descrição Curta */}
                          <p className="text-[13px] font-sans text-[#777777] leading-relaxed line-clamp-3">
                            {project.Descricao_curta}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <div className="py-12 px-4 text-[#777777] font-sans text-[14px] lg:hidden">
                    Nenhum projeto encontrado para esta categoria.
                  </div>
                )}
                <div className="w-2 flex-shrink-0 sm:hidden" aria-hidden="true" />
              </>
            ) : (
              <div className="py-12 px-4 text-[#777777] font-sans text-[14px]">
                Nenhum projeto encontrado.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO DE DETALHES DO PROJETO SELECIONADO */}
      {selectedProject && (
        <>
          <section
            ref={detailsRef}
            className="w-full bg-white pt-6 md:pt-12 pb-12 md:pb-16 lg:border-t lg:border-[#F0F0F0]"
          >
            <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 md:px-8">
              {/* ======================================================== */}
              {/* LAYOUT MOBILE (block lg:hidden)                          */}
              {/* Exato conforme media_1791219781824.png                   */}
              {/* ======================================================== */}
              <div className="block lg:hidden">
                {/* Header dos Detalhes no Mobile */}
                <div className="flex flex-col mb-4">
                  <span className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#888888] mb-1">
                    DETALHES DO PROJETO
                  </span>

                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[22px] sm:text-[26px] font-heading font-bold text-black tracking-tight leading-tight">
                      {selectedProject.Titulo}
                    </h2>

                    {selectedLogoUrl && (
                      <div className="relative h-7 sm:h-8 w-24 sm:w-28 flex items-center justify-end flex-shrink-0">
                        <Image
                          src={selectedLogoUrl}
                          alt={selectedProject.Cliente}
                          width={120}
                          height={32}
                          className="h-6 sm:h-7 w-auto object-contain max-h-7"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* "O Desafio" */}
                <div className="mb-4">
                  <h3 className="text-[19px] sm:text-[20px] font-heading font-bold text-black mb-2">
                    O Desafio
                  </h3>
                  <p className="text-[13px] sm:text-[14px] font-sans text-[#666666] leading-relaxed">
                    {desafioTexto}
                  </p>
                </div>

                {/* Carrossel de Imagens da Galeria (Inserido entre o desafio e os itens informativos, conforme solicitado) */}
                <div className="relative w-full aspect-[16/10] rounded-[16px] overflow-hidden bg-stone-100 shadow-sm my-6">
                  {galleryImages.length > 0 && (
                    <Image
                      key={`mob-slide-${currentSlideIndex}`}
                      src={galleryImages[currentSlideIndex]}
                      alt={`${selectedProject.Titulo} - Imagem ${currentSlideIndex + 1}`}
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover transition-opacity duration-300"
                    />
                  )}

                  {/* Botões Circulares de Navegação */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        aria-label="Imagem anterior"
                        className="w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-black absolute left-3 top-1/2 -translate-y-1/2 transition-transform duration-200 active:scale-95 z-20 cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextSlide}
                        aria-label="Próxima imagem"
                        className="w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-black absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 active:scale-95 z-20 cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Cards Individuais dos Itens Entregáveis no Mobile (media_1791219781824.png) */}
                <div className="space-y-3 mb-6">
                  {deliverables.map((item, idx) => {
                    const iconUrl = item.Icone?.url
                      ? getStrapiMedia(item.Icone.url) || item.Icone.url
                      : null;

                    return (
                      <div
                        key={item.id || idx}
                        className="rounded-[16px] border border-[#EBEBEB] bg-white p-4 sm:p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {iconUrl ? (
                            <Image
                              src={iconUrl}
                              alt={item.Titulo}
                              width={24}
                              height={24}
                              unoptimized
                              className="w-5 h-5 object-contain"
                            />
                          ) : (
                            renderDefaultIcon(idx, item.Titulo)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-sans font-bold text-black leading-tight">
                            {item.Titulo}
                          </span>
                          {item.Subtitulo && (
                            <span className="text-[12px] font-sans text-[#777777] mt-0.5">
                              {item.Subtitulo}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Depoimento no Mobile (conforme media_1791219781824.png) */}
                {(depoimentoTexto || depoimentoAutor) && (
                  <div className="pt-8 pb-4 mt-6 border-t border-[#F0F0F0] text-center">
                    {depoimentoTexto && (
                      <p className="text-[14px] sm:text-[15px] font-heading font-normal text-[#222222] leading-relaxed max-w-lg mx-auto">
                        &ldquo;{depoimentoTexto}&rdquo;
                      </p>
                    )}
                    {depoimentoAutor && (
                      <div className="mt-4 flex flex-col items-center">
                        <span className="text-[13px] sm:text-[14px] font-heading font-bold text-black tracking-tight">
                          {depoimentoAutor}
                        </span>
                        {depoimentoCargo && (
                          <span className="text-[11px] sm:text-[12px] font-sans text-[#777777] mt-0.5">
                            {depoimentoCargo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* LAYOUT DESKTOP (hidden lg:block)                         */}
              {/* Slider 1120px à esquerda, Card #F7F7F7 à direita         */}
              {/* ======================================================== */}
              <div className="hidden lg:block">
                {/* Header dos Detalhes no Desktop */}
                <div className="flex flex-col mb-6 md:mb-8">
                  <span className="text-[11px] md:text-[12px] font-sans font-bold uppercase tracking-[0.18em] text-[#888888] mb-1.5">
                    DETALHES DO PROJETO
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-[26px] sm:text-[34px] md:text-[40px] font-heading font-medium md:font-semibold text-black tracking-tight leading-tight">
                      {selectedProject.Titulo}
                    </h2>

                    {selectedLogoUrl && (
                      <div className="relative h-8 sm:h-9 md:h-10 w-32 sm:w-40 flex items-center sm:justify-end flex-shrink-0">
                        <Image
                          src={selectedLogoUrl}
                          alt={selectedProject.Cliente}
                          width={160}
                          height={40}
                          className="h-7 sm:h-8 md:h-9 w-auto object-contain max-h-9"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Layout de 2 Colunas: Slider de Fotos à Esquerda (1120px no desktop), "O Desafio" à Direita */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_384px] 2xl:grid-cols-[1120px_1fr] gap-6 md:gap-8 items-stretch">
                  {/* Coluna Esquerda: Slider de Imagens da Galeria (1120px x 620px no desktop) */}
                  <div className="w-full flex flex-col">
                    <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] lg:aspect-[1120/620] rounded-[16px] overflow-hidden bg-stone-100 shadow-sm flex-1">
                      {galleryImages.length > 0 && (
                        <Image
                          key={`desk-slide-${currentSlideIndex}`}
                          src={galleryImages[currentSlideIndex]}
                          alt={`${selectedProject.Titulo} - Imagem ${currentSlideIndex + 1}`}
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 1120px"
                          className="object-cover transition-opacity duration-300"
                        />
                      )}

                      {/* Botões Circulares de Navegação do Slider */}
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevSlide}
                            aria-label="Imagem anterior"
                            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center text-black absolute left-4 md:left-5 top-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-105 active:scale-95 z-20 cursor-pointer"
                          >
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={handleNextSlide}
                            aria-label="Próxima imagem"
                            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center text-black absolute right-4 md:right-5 top-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-105 active:scale-95 z-20 cursor-pointer"
                          >
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Coluna Direita: Box "O Desafio" com Fundo Cinza #F7F7F7 + Itens de Entregáveis */}
                  <div className="w-full flex flex-col">
                    <div className="rounded-[16px] border border-[#EDEDED] bg-[#F7F7F7] p-6 sm:p-7 md:p-8 flex flex-col justify-between h-full shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      <div>
                        <h3 className="text-[20px] md:text-[22px] font-heading font-semibold text-black mb-3">
                          O Desafio
                        </h3>
                        <p className="text-[13px] sm:text-[14px] font-sans text-[#666666] leading-relaxed">
                          {desafioTexto}
                        </p>
                      </div>

                      {/* Linha Divisória */}
                      <div className="w-full border-t border-[#E5E5E5] my-6 md:my-7" />

                      {/* Lista de Entregáveis (Repetidor Strapi ou Fallbacks) */}
                      <div className="space-y-5">
                        {deliverables.map((item, idx) => {
                          const iconUrl = item.Icone?.url
                            ? getStrapiMedia(item.Icone.url) || item.Icone.url
                            : null;

                          return (
                            <div key={item.id || idx} className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-full bg-[#EAEAEA] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {iconUrl ? (
                                  <Image
                                    src={iconUrl}
                                    alt={item.Titulo}
                                    width={24}
                                    height={24}
                                    unoptimized
                                    className="w-5 h-5 object-contain"
                                  />
                                ) : (
                                  renderDefaultIcon(idx, item.Titulo)
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[15px] font-sans font-bold text-black leading-tight">
                                  {item.Titulo}
                                </span>
                                {item.Subtitulo && (
                                  <span className="text-[12px] font-sans text-[#777777] mt-0.5">
                                    {item.Subtitulo}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. SEÇÃO DE DEPOIMENTO NO DESKTOP COM FUNDO #F7F7F7 E ESPAÇAMENTO GENEROSO */}
          {(depoimentoTexto || depoimentoAutor) && (
            <section className="hidden lg:block w-full bg-[#F7F7F7] py-20 md:py-28 my-10 md:my-16">
              <div className="w-full max-w-4xl mx-auto text-center px-6 md:px-8">
                {depoimentoTexto && (
                  <p className="text-[16px] sm:text-[18px] md:text-[20px] font-sans text-[#333333] leading-relaxed md:leading-[1.7] max-w-3xl mx-auto">
                    &ldquo;{depoimentoTexto}&rdquo;
                  </p>
                )}

                {depoimentoAutor && (
                  <div className="mt-6 md:mt-8 flex flex-col items-center">
                    <span className="text-[14px] md:text-[16px] font-heading font-bold text-black tracking-tight">
                      {depoimentoAutor}
                    </span>
                    {depoimentoCargo && (
                      <span className="text-[12px] md:text-[13px] font-sans text-[#777777] mt-1">
                        {depoimentoCargo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 5. BANNER CTA FINAL PARA EMPRESAS */}
          <section className="w-full bg-white pb-20 md:pb-28">
            <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 md:px-8">
              <div className="rounded-[20px] bg-black text-white pt-12 md:pt-16 pb-14 md:pb-20 px-6 sm:px-8 md:px-10 flex flex-col items-center text-center shadow-lg">
                <h3 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[33px] xl:text-[36px] font-heading font-normal text-white tracking-tight leading-tight max-w-[1200px] w-full text-balance">
                  Quer um projeto personalizado para o seu espaço?
                </h3>

                <p className="text-[13px] sm:text-[14px] font-sans text-[#A0A0A0] max-w-2xl mt-3 md:mt-4 mb-8 leading-relaxed">
                  Descubra como otimizar o conforto e a produtividade da sua equipe. Entre em contato com nossos especialistas e receba uma proposta corporativa sob medida.
                </p>

                <a
                  href={`https://wa.me/5545999999999?text=Ol%C3%A1%2C%20vi%20o%20projeto%20${encodeURIComponent(
                    selectedProject.Titulo
                  )}%20e%20gostaria%20de%20um%20or%C3%A7amento%20personalizado.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-sans font-medium text-[13px] sm:text-[14px] tracking-wide hover:bg-stone-100 transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <span>Solicitar Orçamento</span>
                  <span className="text-base leading-none">→</span>
                </a>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
