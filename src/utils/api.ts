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
      if (key.includes("Configuracoes") || value.includes("Configuracoes")) {
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
      .replace(/[?&]&/g, "?");
  }
}

/**
 * Realiza fetch no Strapi com fallback resiliente para remoção de parâmetros
 * do novo campo `Configuracoes` caso o Strapi remoto de produção ainda não tenha
 * recebido o deploy do novo schema.
 */
export async function fetchStrapi(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok && url.includes("Configuracoes")) {
    const fallbackUrl = stripConfiguracoesParam(url);
    return fetch(fallbackUrl, init);
  }
  return res;
}
