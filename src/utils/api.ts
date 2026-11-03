export function getStrapiURL(path = "") {
  const defaultUrl =
    process.env.NODE_ENV === "production"
      ? "https://haka-admin.fzcommerce.com.br"
      : "http://localhost:1337";

  const baseUrl = (
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    defaultUrl
  ).replace(/\/$/, "");

  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${baseUrl}${cleanPath}`;
}

export function getStrapiMedia(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  // Se a URL já for absoluta (ex: imagens externas ou S3 no futuro)
  if (url.startsWith("http") || url.startsWith("//")) {
    return url;
  }

  const defaultUrl =
    process.env.NODE_ENV === "production"
      ? "https://haka-admin.fzcommerce.com.br"
      : "http://localhost:1337";

  // Adiciona a URL do Strapi como base para imagens relativas
  const baseUrl = (
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    defaultUrl
  ).replace(/\/$/, "");

  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
}

export function stripConfiguracoesParam(url: string): string {
  try {
    const u = new URL(url);
    const newParams = new URLSearchParams();
    for (const [key, value] of u.searchParams.entries()) {
      if (
        key.includes("Configuracoes") ||
        value.includes("Configuracoes") ||
        key === "populate[categoria]" ||
        key.includes("[categoria]")
      ) {
        continue;
      }
      newParams.append(key, value);
    }
    u.search = newParams.toString();
    return u.toString();
  } catch {
    return url
      .replace(/[?&]populate\[Configuracoes\][^&]*/g, "")
      .replace(/[?&]filters\[.*?\]\[Configuracoes\][^&]*/g, "")
      .replace(/[?&]populate\[categoria\][^&]*/g, "")
      .replace(/[?&]&/g, "?");
  }
}

/**
 * Realiza fetch no Strapi com fallback resiliente para remoção de parâmetros
 * do novo campo `Configuracoes` e fallback para o ambiente remoto de produção
 * caso o Strapi local não possua registros ainda (ex: Pagina Home recém-criada).
 */
export async function fetchStrapi(url: string, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      if (url.includes("Configuracoes")) {
        const fallbackUrl = stripConfiguracoesParam(url);
        const fallbackRes = await fetch(fallbackUrl, init);
        if (fallbackRes.ok) return fallbackRes;
      }
      if ((res.status === 404 || res.status === 500) && (url.includes("localhost") || url.includes("127.0.0.1"))) {
        const prodUrl = url
          .replace("http://localhost:1337", "https://haka-admin.fzcommerce.com.br")
          .replace("http://127.0.0.1:1337", "https://haka-admin.fzcommerce.com.br");
        const prodRes = await fetch(prodUrl, init);
        if (prodRes.ok) return prodRes;
      }
    }
    return res;
  } catch (err) {
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      const prodUrl = url
        .replace("http://localhost:1337", "https://haka-admin.fzcommerce.com.br")
        .replace("http://127.0.0.1:1337", "https://haka-admin.fzcommerce.com.br");
      return fetch(prodUrl, init);
    }
    throw err;
  }
}
