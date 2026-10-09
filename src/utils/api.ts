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
