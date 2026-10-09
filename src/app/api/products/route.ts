import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/utils/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const brand = searchParams.get("brand")?.trim() || "";
  const brandSlug = searchParams.get("brandSlug")?.trim() || "";
  const color = searchParams.get("color")?.trim() || "";
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const sort = searchParams.get("sort")?.trim() || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const queryParts: string[] = [
    "filters[Ativo][$ne]=false",
    `pagination[page]=${page}`,
    `pagination[pageSize]=${pageSize}`,
    "populate[Variacoes][populate]=*",
    "populate[marca]=true",
    "populate[categoria]=true",
    "populate[Imagem_destaque]=true",
    "populate[Foto_mais_vendidos]=true",
  ];

  if (q) {
    const encoded = encodeURIComponent(q);
    queryParts.push(
      `filters[$or][0][Nome][$containsi]=${encoded}&filters[$or][1][Subtitulo][$containsi]=${encoded}&filters[$or][2][marca][Nome][$containsi]=${encoded}&filters[$or][3][categoria][Nome][$containsi]=${encoded}`
    );
  }

  if (category) {
    let categorySlugs = [category];
    const subcatsParam = searchParams.get("subcategories")?.trim();
    if (subcatsParam) {
      const parsed = subcatsParam.split(",").map((s) => s.trim()).filter(Boolean);
      categorySlugs = Array.from(new Set([category, ...parsed]));
    } else {
      try {
        const catRes = await fetch(
          getStrapiURL(
            `/api/categorias?filters[slug][$eq]=${encodeURIComponent(
              category
            )}&populate[subcategorias]=true`
          ),
          { cache: "no-store" }
        );
        if (catRes.ok) {
          const catJson = await catRes.json();
          const subcats = catJson.data?.[0]?.subcategorias || [];
          const subSlugs = subcats.map((s: any) => s.slug).filter(Boolean);
          categorySlugs = Array.from(new Set([category, ...subSlugs]));
        }
      } catch (err) {
        console.error("Erro ao buscar subcategorias:", err);
      }
    }

    if (categorySlugs.length === 1) {
      queryParts.push(`filters[categoria][slug][$eq]=${encodeURIComponent(categorySlugs[0])}`);
    } else {
      categorySlugs.forEach((slug, idx) => {
        queryParts.push(`filters[categoria][slug][$in][${idx}]=${encodeURIComponent(slug)}`);
      });
    }
  }

  if (brandSlug) {
    queryParts.push(`filters[marca][slug][$eqi]=${encodeURIComponent(brandSlug)}`);
  } else if (brand && brand !== "all") {
    queryParts.push(`filters[marca][Nome][$eqi]=${encodeURIComponent(brand)}`);
  }

  if (color && color !== "all") {
    queryParts.push(`filters[Variacoes][Nome_cor][$eqi]=${encodeURIComponent(color)}`);
  }

  if (priceMin && priceMin !== "0") {
    queryParts.push(`filters[Variacoes][Preco][$gte]=${priceMin}`);
  }
  if (priceMax && priceMax !== "Infinity") {
    queryParts.push(`filters[Variacoes][Preco][$lte]=${priceMax}`);
  }

  if (sort === "price-asc") {
    queryParts.push("sort[0]=Variacoes.Preco:asc");
  } else if (sort === "price-desc") {
    queryParts.push("sort[0]=Variacoes.Preco:desc");
  } else if (sort === "name-asc") {
    queryParts.push("sort[0]=Nome:asc");
  } else if (sort === "name-desc") {
    queryParts.push("sort[0]=Nome:desc");
  }

  const url = getStrapiURL(`/api/produtos?${queryParts.join("&")}`);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Erro ao buscar produtos do Strapi" },
        { status: res.status }
      );
    }
    const json = await res.json();
    return NextResponse.json({
      data: json.data || [],
      meta: json.meta || { pagination: { page, pageSize, pageCount: 1, total: 0 } },
    });
  } catch (error) {
    console.error("Erro na rota /api/products:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
