export function getStrapiURL(path = "") {
  const baseUrl = (process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");
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

  // Adiciona a URL do Strapi como base para imagens relativas
  const baseUrl = (process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
}
