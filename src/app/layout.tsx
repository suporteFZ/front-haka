import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/Footer";
import {
  SITE_URL,
  DEFAULT_DESCRIPTION,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/utils/seo";
import JsonLd from "@/components/seo/JsonLd";
import { getStrapiURL } from "@/utils/api";
import SmoothScrolling from "@/components/SmoothScrolling";
import { CartProvider } from "@/context/CartContext";

// Importando a fonte SpartanMB localmente
const spartan = localFont({
  src: [
    {
      path: "./fonts/SpartanMB-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Spartan-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/SpartanMB-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/SpartanMB-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-spartan",
});

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Haka | Ergonomia e Mobiliário Corporativo de Alta Performance",
    template: "%s | Haka",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "cadeiras ergonômicas",
    "ergonomia corporativa",
    "cadeira de escritório presidente",
    "mobiliário corporativo",
    "cadeiras NR-17",
    "Haka ergonomia",
    "móveis para escritório",
  ],
  authors: [{ name: "Haka Ergonomia", url: SITE_URL }],
  creator: "Haka",
  publisher: "Haka",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Haka",
    title: "Haka | Ergonomia e Mobiliário Corporativo de Alta Performance",
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/icon.png`,
        width: 800,
        height: 800,
        alt: "Haka Ergonomia Corporativa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haka | Ergonomia e Mobiliário Corporativo",
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/icon.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Função para buscar os dados globais do Strapi
async function getGlobalData() {
  try {
    const url = getStrapiURL(
      "/api/global?populate[0]=Logo_branca&populate[1]=Logo&populate[2]=Menu_header&populate[3]=Footer.cta_imagem_fundo&populate[4]=Footer.menu_links&populate[5]=Footer.redes_sociais&populate[6]=Footer.logo_fz&populate[7]=Menu_header.categorias&populate[8]=Menu_header.marcas&populate[9]=Menu_header.links_rapidos&populate[10]=Menu_header.produtos_destaque.Imagem_destaque&populate[11]=Mais_buscados&populate[12]=Menu_mobile.Sublinks&populate[13]=Menu_mobile_footer_1&populate[14]=Menu_mobile_footer_2&populate[15]=Menu_header.produtos_destaque.Foto_mais_vendidos"
    );
    const res = await fetch(url, {
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      console.error("Erro na API do Strapi:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Erro ao buscar dados do Strapi:", error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const globalData = await getGlobalData();

  return (
    <html
      lang="pt-BR"
      className={`${spartan.variable} ${arimo.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Schemas globais: Organization & WebSite (SEO tradicional e GEO para IAs) */}
        <JsonLd data={generateOrganizationSchema(globalData)} />
        <JsonLd data={generateWebSiteSchema()} />
      </head>
      <body className="min-h-screen flex flex-col bg-stone-900" suppressHydrationWarning>
        <CartProvider>
          <SmoothScrolling>
            <Header globalData={globalData} />
            <main className="flex-1 w-full flex flex-col">{children}</main>
            <Footer globalData={globalData} />
          </SmoothScrolling>
        </CartProvider>
      </body>
    </html>
  );
}
