export interface ItemEntregavel {
  id?: number | string;
  Titulo: string;
  Subtitulo?: string;
  Icone?: any;
}

export interface DepoimentoItem {
  id?: number | string;
  Texto?: string;
  Autor?: string;
  Cargo?: string;
}

export interface CategoriaProjetoItem {
  id?: number | string;
  documentId?: string;
  Nome: string;
  slug: string;
  Ordem?: number;
}

export interface ProjetoItem {
  id: number | string;
  documentId?: string;
  Titulo: string;
  slug: string;
  Cliente: string;
  Logo_cliente?: any;
  Imagem_capa?: any;
  Descricao_curta: string;
  Desafio?: string;
  Itens?: ItemEntregavel[];
  Item_1_titulo?: string;
  Item_1_subtitulo?: string;
  Item_2_titulo?: string;
  Item_2_subtitulo?: string;
  Item_3_titulo?: string;
  Item_3_subtitulo?: string;
  Depoimento?: DepoimentoItem;
  Depoimento_texto?: string;
  Depoimento_autor?: string;
  Depoimento_cargo?: string;
  Texto?: any;
  Galeria?: any[];
  categorias?: CategoriaProjetoItem[];
  Destaque_home?: boolean;
  Data_projeto?: string;
  Localizacao?: string;
  Metragem?: string;
  Ordem?: number;
}

export const FALLBACK_PROJECTS: ProjetoItem[] = [
  {
    id: 1,
    Titulo: "Nova agência - Sicredi",
    slug: "nova-agencia-sicredi",
    Cliente: "SICREDI",
    Imagem_capa: {
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    },
    Logo_cliente: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Sicredi_logo.svg/320px-Sicredi_logo.svg.png",
    },
    Descricao_curta:
      "Entregamos mais de 50 cadeiras ergonômicas certificadas, mesas com regulagem de altura e soluções corporativas...",
    Desafio:
      "Entregamos mais de 50 cadeiras ergonômicas certificadas, mesas com regulagem de altura e soluções corporativas completas para equipar um ambiente integrado de 800m², focando na saúde postural de uma equipe de desenvolvimento acelerado.",
    Itens: [
      { Titulo: "50+ Cadeiras", Subtitulo: "Modelo Ergonômico Premium" },
      { Titulo: "20 Mesas Reguláveis", Subtitulo: "Estações de Trabalho Ativas" },
      { Titulo: "800 m² Planejados", Subtitulo: "Área Total de Conforto Otimizado" },
    ],
    Item_1_titulo: "50+ Cadeiras",
    Item_1_subtitulo: "Modelo Ergonômico Premium",
    Item_2_titulo: "20 Mesas Reguláveis",
    Item_2_subtitulo: "Estações de Trabalho Ativas",
    Item_3_titulo: "800 m² Planejados",
    Item_3_subtitulo: "Área Total de Conforto Otimizado",
    Depoimento_texto:
      "A HAKA transformou nosso escritório de forma completa. O conforto das novas estações de trabalho e o design das cadeiras ergonômicas elevaram a produtividade e o bem-estar da nossa equipe em 30%.",
    Depoimento_autor: "Carlos Mendes",
    Depoimento_cargo: "CEO, Sicredi",
    Galeria: [
      {
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
      },
      {
        url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1400&q=80",
      },
      {
        url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
      },
    ],
    Localizacao: "São Paulo, SP",
    Metragem: "800 m²",
    Data_projeto: "2026-02-15",
    Destaque_home: true,
    categorias: [{ id: 1, Nome: "SICREDI", slug: "sicredi" }],
  },
  {
    id: 2,
    Titulo: "Novo Escritório - Cooperativa Primato",
    slug: "novo-escritorio-cooperativa-primato",
    Cliente: "COOPERATIVA PRIMATO",
    Imagem_capa: {
      url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    },
    Logo_cliente: {
      url: "https://primato.com.br/wp-content/themes/primato/assets/img/logo.svg",
    },
    Descricao_curta:
      "Entregamos mais de 50 cadeiras ergonômicas certificadas, mesas com regulagem de altura e soluções corporativas...",
    Desafio:
      "Desenvolvimento de um complexo corporativo unindo sustentabilidade, luminosidade e postos ergonômicos integrados para mais de 120 colaboradores e cooperados em uma área ampla de 1.250m².",
    Itens: [
      { Titulo: "80+ Cadeiras", Subtitulo: "Linha Executiva e Operacional" },
      { Titulo: "35 Mesas de Reunião", Subtitulo: "Conectividade Embutida" },
      { Titulo: "1.250 m² Planejados", Subtitulo: "Sede Central Sustentável" },
    ],
    Item_1_titulo: "80+ Cadeiras",
    Item_1_subtitulo: "Linha Executiva e Operacional",
    Item_2_titulo: "35 Mesas de Reunião",
    Item_2_subtitulo: "Conectividade Embutida",
    Item_3_titulo: "1.250 m² Planejados",
    Item_3_subtitulo: "Sede Central Sustentável",
    Depoimento_texto:
      "O resultado superou todas as expectativas. Ambientes elegantes, funcionais e que refletem os valores cooperativistas com o mais alto padrão ergonômico.",
    Depoimento_autor: "Diretoria Executiva",
    Depoimento_cargo: "Cooperativa Primato",
    Galeria: [
      {
        url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
      },
      {
        url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80",
      },
    ],
    Localizacao: "Toledo, PR",
    Metragem: "1.250 m²",
    Data_projeto: "2026-03-10",
    Destaque_home: true,
    categorias: [{ id: 2, Nome: "PRIMATO", slug: "primato" }],
  },
  {
    id: 3,
    Titulo: "Hub de Inovação & Tecnologia",
    slug: "hub-de-inovacao-tecnologia",
    Cliente: "NEXUS TECH",
    Imagem_capa: {
      url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
    },
    Descricao_curta:
      "Postos operacionais dinâmicos para desenvolvedores e squads de produto, com foco em ergonomia intensiva para jornadas prolongadas.",
    Desafio:
      "Equipar estações de desenvolvimento intensivo com braços articulados para múltiplos monitores e cadeiras em malha mesh respirável com regulagem 4D.",
    Itens: [
      { Titulo: "60+ Cadeiras", Subtitulo: "Linha Mesh Respirável 4D" },
      { Titulo: "30 Mesas de Squads", Subtitulo: "Configuração Modular" },
      { Titulo: "420 m² Planejados", Subtitulo: "Piso Operacional Ágil" },
    ],
    Item_1_titulo: "60+ Cadeiras",
    Item_1_subtitulo: "Linha Mesh Respirável 4D",
    Item_2_titulo: "30 Mesas de Squads",
    Item_2_subtitulo: "Configuração Modular",
    Item_3_titulo: "420 m² Planejados",
    Item_3_subtitulo: "Piso Operacional Ágil",
    Depoimento_texto:
      "Nossos desenvolvedores passam muitas horas focados. A diferença na postura e na redução de fadiga foi imediata após a instalação dos móveis da Haka.",
    Depoimento_autor: "Renata Silveira",
    Depoimento_cargo: "Head de Operações, Nexus Tech",
    Galeria: [
      {
        url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1400&q=80",
      },
    ],
    Localizacao: "Curitiba, PR",
    Metragem: "420 m²",
    Data_projeto: "2026-01-20",
    Destaque_home: false,
    categorias: [{ id: 3, Nome: "CORPORATIVO", slug: "corporativo" }],
  },
];
