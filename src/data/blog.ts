export interface PostItem {
  id: number;
  documentId?: string;
  Titulo: string;
  slug: string;
  Resumo?: string | null;
  Texto?: string | any | null;
  Banner?: {
    id?: number;
    url: string;
    alternativeText?: string | null;
  } | null;
  createdAt?: string;
  publishedAt?: string;
}

export const FALLBACK_POSTS: PostItem[] = [
  {
    id: 1,
    Titulo: "Ergonomia Corporativa: Como o Mobiliário Certo Eleva a Produtividade",
    slug: "ergonomia-corporativa-produtividade",
    Resumo:
      "Descubra como investir em cadeiras ergonômicas certificadas e mesas ajustáveis transforma a rotina corporativa e reduz a fadiga física de equipes de alta performance.",
    Texto: `
## O Impacto Direto do Mobiliário no Rendimento Profissional

No ambiente corporativo contemporâneo, a ergonomia deixou de ser apenas uma exigência normativa para se consolidar como um dos pilares estratégicos de saúde corporativa e alta produtividade.

Passamos em média mais de 8 horas sentados diante de telas. Quando o mobiliário não apoia a biomecânica natural do corpo humano, o resultado imediato é o surgimento de dores lombares, fadiga muscular precoce e queda acentuada nos níveis de foco e concentração.

### Benefícios Comprovados da Ergonomia Ativa:
- **Redução de dores e lesões por esforço repetitivo:** Apoio lombar regulável e assentos com espuma injetada distribuem a pressão corpórea uniformemente.
- **Melhora na circulação e oxigenação:** Ajustes de altura e mecanismos syncron permitem alternância suave de postura ao longo do dia.
- **Aumento mensurável da produtividade:** Colaboradores confortáveis permanecem concentrados por períodos mais longos com menor índice de pausas forçadas por desconforto.

Investir em soluções desenvolvidas com rigor biomecânico, como as linhas Cavaletti e Haka, é assegurar a longevidade e o bem-estar de quem constrói o futuro da sua empresa todos os dias.
    `,
    Banner: {
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      alternativeText: "Escritório corporativo moderno e ergonômico",
    },
    publishedAt: "2026-10-15T10:00:00.000Z",
  },
  {
    id: 2,
    Titulo: "Tendências de Espaços Corporativos: Flexibilidade e Colaboração",
    slug: "tendencias-espacos-corporativos-flexibilidade",
    Resumo:
      "Do modelo híbrido aos lounges de descompressão: conheça as soluções de layout e design que estão redefinindo os escritórios modernos.",
    Texto: `
## A Reinvenção dos Espaços de Trabalho

A dinâmica dos escritórios evoluiu rapidamente nos últimos anos. Os modelos rígidos e estações de trabalho isoladas deram lugar a ecossistemas fluidos, onde a versatilidade dita as regras do espaço.

Hoje, um escritório moderno precisa atender a múltiplos momentos da jornada de trabalho: momentos de concentração individual profunda, reuniões informais e espaços colaborativos dinâmicos.

### As Principais Diretrizes do Novo Design de Escritórios:
- **Mobiliário Modular e Reconfigurável:** Mesas e divisórias que se adaptam rapidamente a diferentes dinâmicas de equipes e eventos.
- **Áreas de Descompressão Funcionais:** Poltronas e sofás com suporte ergonômico e tomadas integradas, promovendo pausas regenerativas sem perder a conectividade.
- **Acústica e Privacidade Integradas:** Painéis fonoabsorventes e booths acústicos que garantem conversas reservadas sem isolar o ambiente.

O design inteligente do espaço é a ferramenta mais poderosa para inspirar criatividade e fortalecer a cultura corporativa.
    `,
    Banner: {
      url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
      alternativeText: "Ambiente de escritório aberto e colaborativo",
    },
    publishedAt: "2026-10-20T14:30:00.000Z",
  },
  {
    id: 3,
    Titulo: "Guia da NR-17: O que Você Precisa Saber ao Escolher Cadeiras de Escritório",
    slug: "guia-nr-17-cadeiras-escritorio",
    Resumo:
      "Entenda os parâmetros técnicos da Norma Regulamentadora 17 e garanta a conformidade legal e o bem-estar postural da sua equipe.",
    Texto: `
## Entendendo a Norma Regulamentadora NR-17

A NR-17 visa estabelecer parâmetros que permitam a adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores, de modo a proporcionar um máximo de conforto, segurança e desempenho eficiente.

Para cadeiras operacionais e executivas, a norma especifica uma série de requisitos técnicos indispensáveis que toda empresa deve observar na aquisição de mobiliário.

### Requisitos Essenciais para Cadeiras segundo a NR-17:
1. **Regulagem de Altura:** Sistema acionado a gás com curso suave para permitir que os pés fiquem totalmente apoiados no chão e as pernas em ângulo de 90 graus.
2. **Apoio Lombar Ajustável:** O encosto deve fornecer apoio efetivo à região lombar, respeitando a curvatura natural da coluna.
3. **Borda Frontal Arredondada:** O assento deve ter borda frontal curva (raio de curvatura suave) para não comprimir os vasos sanguíneos da região poplítea.
4. **Braços Reguláveis:** Apoios de braço com ajuste de altura para manter os ombros relaxados e os cotovelos alinhados ao plano de trabalho da mesa.

Optar por produtos com laudo ergonômico comprovado protege a saúde dos colaboradores e resguarda a empresa de passivos trabalhistas.
    `,
    Banner: {
      url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      alternativeText: "Cadeiras ergonômicas de alta performance",
    },
    publishedAt: "2026-10-25T09:15:00.000Z",
  },
  {
    id: 4,
    Titulo: "Biofilia e Materiais Naturais: Bem-Estar Invisível no Trabalho",
    slug: "biofilia-materiais-naturais-trabalho",
    Resumo:
      "A integração de plantas, madeira natural e tecidos respiráveis cria ambientes que reduzem o estresse e estimulam a criatividade.",
    Texto: `
## O Poder do Design Biofílico nos Ambientes Corporativos

O termo *biofilia* descreve a tendência inata dos seres humanos de buscar conexões com a natureza. Quando transposto para o design de interiores corporativos, o conceito se traduz em ambientes mais calmos, acolhedores e profundamente restauradores.

Estudos mostram que ambientes de trabalho que incorporam elementos naturais conseguem reduzir os níveis de cortisol (hormônio do estresse) em até 15%, além de aumentar a sensação de vitalidade e clareza mental.

### Elementos Biofílicos no Mobiliário:
- **Tonalidades Terrosas e Neutras:** Paletas que remetem a argila, areia, musgo e madeira escura criam sensação de ancoragem e serenidade.
- **Tecidos Naturais e Tecnológicos:** Revestimentos com texturas agradáveis ao toque, alta respirabilidade térmica e fácil higienização.
- **Integração com Paisagismo Interno:** Divisórias e floreiras modulares integradas às estações de trabalho que trazem vida ao layout sem comprometer o fluxo de passagem.

A harmonia entre estética, natureza e ergonomia é a fórmula definitiva para espaços onde as pessoas realmente desejam estar.
    `,
    Banner: {
      url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      alternativeText: "Ambiente de escritório com plantas e luz natural",
    },
    publishedAt: "2026-10-28T16:00:00.000Z",
  },
];
