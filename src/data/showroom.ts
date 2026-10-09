export interface MetricaItem {
  id?: number;
  Titulo: string;
  Subtitulo: string;
}

export interface PaginaShowroomData {
  Hero_tag?: string;
  Hero_titulo?: string;
  Hero_descricao?: string;
  Hero_imagem_banner?: any;
  Imersiva_tag?: string;
  Imersiva_titulo?: string;
  Imersiva_descricao?: string;
  Imersiva_imagem?: any;
  Imersiva_metricas?: MetricaItem[];
  Sequencia_titulo?: string;
  Sequencia_subtitulo?: string;
  Sequencia_thumb?: any;
  Sequencia_imagens?: any[];
  Sequencia_video_desktop?: any;
  Sequencia_video_mobile?: any;
  Cta_titulo?: string;
  Cta_descricao?: string;
  Cta_botao_texto?: string;
  Cta_botao_link?: string;
}

export const FALLBACK_SHOWROOM: PaginaShowroomData = {
  Hero_tag: "PORTFÓLIO HAKA",
  Hero_titulo: "Nosso Showroom",
  Hero_descricao:
    "Conheça o espaço onde design, ergonomia e conforto se encontram. Uma experiência sensorial para planejar seu próximo ambiente de trabalho.",
  Hero_imagem_banner: {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=85",
    width: 1608,
    height: 712,
  },
  Imersiva_tag: "EXPERIÊNCIA IMERSIVA",
  Imersiva_titulo:
    "Um espaço pensado para você vivenciar nossos produtos de perto.",
  Imersiva_descricao:
    "Cada ambiente foi cuidadosamente projetado para inspirar e mostrar as possibilidades.",
  Imersiva_metricas: [
    { id: 1, Titulo: "500m²", Subtitulo: "ÁREA DE EXPOSIÇÃO" },
    { id: 2, Titulo: "30+", Subtitulo: "MODELOS EXPOSTOS" },
    { id: 3, Titulo: "100%", Subtitulo: "CONSULTORIA DEDICADA" },
  ],
  Imersiva_imagem: {
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
  },
  Sequencia_titulo: "Caminhada Virtual pelo Showroom",
  Sequencia_subtitulo:
    "Role para explorar cada detalhe dos nossos ambientes integrados e soluções ergonômicas.",
  Sequencia_thumb: {
    url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=80",
  },
  Sequencia_imagens: [
    { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=80" },
    { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=80" },
    { url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1800&q=80" },
  ],
  Cta_titulo: "Quer um projeto personalizado para o seu espaço?",
  Cta_descricao:
    "Descubra como otimizar o conforto e a produtividade da sua equipe. Entre em contato com nossos especialistas e receba uma proposta corporativa sob medida.",
  Cta_botao_texto: "Solicitar Orçamento",
  Cta_botao_link: "https://wa.me/5545999999999?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20or%C3%A7amento%20personalizado.",
};
