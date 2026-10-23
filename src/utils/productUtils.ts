export interface ConfiguracaoItem {
  id?: number | string;
  Nome: string;
  Codigo?: string;
  Foto?: any;
  Galeria?: any[];
  Preco?: number;
  Preco_promocional?: number;
  Preco_adicional?: number;
  Cor_hex?: string;
  Descricao?: string;
}

/**
 * Retorna as configurações (variações/modelos de produto) de um produto.
 * Suporta o novo campo `Configuracoes` do Strapi e retrocompatibilidade com grupo "Configuração" de `Grupos_variacao`.
 */
export function getProductConfigurations(product: any): ConfiguracaoItem[] {
  if (!product) return [];

  // 1. Campo dedicado oficial no Strapi
  if (product.Configuracoes && Array.isArray(product.Configuracoes) && product.Configuracoes.length > 0) {
    return product.Configuracoes;
  }

  // 2. Retrocompatibilidade: busca grupo com título "Configuração" / "Configurações" dentro de Grupos_variacao
  if (product.Grupos_variacao && Array.isArray(product.Grupos_variacao)) {
    const configGroup = product.Grupos_variacao.find((g: any) =>
      g.Titulo?.toLowerCase().trim().startsWith("configura")
    );
    if (configGroup?.Opcoes && Array.isArray(configGroup.Opcoes)) {
      return configGroup.Opcoes;
    }
  }

  return [];
}

/**
 * Retorna apenas os grupos de componentes e acessórios (ex: Bases, Braços, etc.),
 * excluindo o grupo "Configuração" se ele foi usado para cadastrar os modelos.
 */
export function getAccessoryGroups(product: any): any[] {
  if (!product?.Grupos_variacao || !Array.isArray(product.Grupos_variacao)) return [];
  return product.Grupos_variacao.filter(
    (g: any) => !g.Titulo?.toLowerCase().trim().startsWith("configura")
  );
}

/**
 * Expande produtos que possuem configurações individuais em cards separados para listagens
 * (Busca, Categorias e Catálogo), exibindo cada variação com sua própria foto e título.
 * Se `query` for fornecida e não corresponder ao nome do produto como um todo, filtra
 * apenas as configurações que correspondam ao termo pesquisado.
 */
export function expandProductsForListing(products: any[], query?: string): any[] {
  if (!Array.isArray(products)) return [];
  const result: any[] = [];
  const cleanQuery = query?.trim().toLowerCase();

  for (const product of products) {
    const configs = getProductConfigurations(product);

    if (configs && configs.length > 0) {
      // Se tiver query, verifica se a query dá match no nome do produto, marca ou categoria
      const productMatchesQuery =
        !cleanQuery ||
        product.Nome?.toLowerCase().includes(cleanQuery) ||
        product.Subtitulo?.toLowerCase().includes(cleanQuery) ||
        product.marca?.Nome?.toLowerCase().includes(cleanQuery) ||
        product.categoria?.Nome?.toLowerCase().includes(cleanQuery);

      const targetConfigs = productMatchesQuery
        ? configs
        : configs.filter((cfg: any) =>
            cfg.Nome?.toLowerCase().includes(cleanQuery!) ||
            cfg.Codigo?.toLowerCase().includes(cleanQuery!) ||
            cfg.Descricao?.toLowerCase().includes(cleanQuery!)
          );

      const configsToRender = targetConfigs.length > 0 ? targetConfigs : configs;

      configsToRender.forEach((cfg: any, idx: number) => {
        const rootGaleria = Array.isArray(product.Galeria) ? product.Galeria : [];
        const cfgGaleria = Array.isArray(cfg.Galeria) && cfg.Galeria.length > 0 ? cfg.Galeria : [];

        // Fotos exclusivas desta configuração específica: APENAS do campo Galeria (ignora campo Foto)
        const cfgPhotos: any[] = [];
        if (Array.isArray(cfg.Galeria)) {
          cfg.Galeria.forEach((img: any) => {
            if (img?.url && !cfgPhotos.some((p) => p.url === img.url)) {
              cfgPhotos.push(img);
            }
          });
        }

        // Se a configuração possui fotos próprias, o card usa EXCLUSIVAMENTE as fotos dela.
        // Se ela tiver apenas 1 foto, o card terá apenas 1 foto (não puxa foto de outra variação no hover!).
        let cardGaleria: any[] = [];
        if (cfgPhotos.length > 0) {
          cardGaleria = cfgPhotos;
        } else if (rootGaleria.length > 0) {
          cardGaleria = rootGaleria;
        }

        // Limpa o nome para não duplicar se a opção já contiver o nome do produto
        const configTitle = cfg.Nome.toLowerCase().includes(product.Nome.toLowerCase())
          ? cfg.Nome
          : `${product.Nome} — ${cfg.Nome}`;

        result.push({
          ...product,
          id: `${product.id}-cfg-${cfg.id || idx}`,
          originalId: product.id,
          Nome: configTitle,
          slug: `${product.slug}?config=${encodeURIComponent(cfg.Nome)}`,
          Preco: cfg.Preco || product.Preco,
          Preco_promocional: cfg.Preco_promocional || product.Preco_promocional,
          Galeria: cardGaleria,
          // Removemos Grupos_variacao e Variacoes do card expandido para não vazar opções de outras variações no hover
          Grupos_variacao: [],
          Variacoes: [],
          isConfigurationCard: true,
          configurationName: cfg.Nome,
        });
      });
    } else {
      result.push(product);
    }
  }

  return result;
}
