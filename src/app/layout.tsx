import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/Footer";

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
  title: "Haka - Ergonomia Inteligente",
  description: "Loja Haka",
};

// Função para buscar os dados globais do Strapi
import { getStrapiURL } from "@/utils/api";

async function getGlobalData() {
  try {
    // Adicionamos no-store para evitar cache desatualizado durante o desenvolvimento
    const url = getStrapiURL("/api/global?populate[0]=Logo_branca&populate[1]=Logo&populate[2]=Menu_header&populate[3]=Footer.cta_imagem_fundo&populate[4]=Footer.menu_links&populate[5]=Footer.redes_sociais&populate[6]=Footer.logo_fz&populate[7]=Menu_header.categorias&populate[8]=Menu_header.marcas&populate[9]=Menu_header.links_rapidos&populate[10]=Menu_header.produtos_destaque.Imagem_destaque&populate[11]=Mais_buscados&populate[12]=Menu_mobile.Sublinks&populate[13]=Menu_mobile_footer_1&populate[14]=Menu_mobile_footer_2");
    const res = await fetch(url, {
      cache: "no-store",
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

import SmoothScrolling from "@/components/SmoothScrolling";
import { CartProvider } from "@/context/CartContext";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const globalData = await getGlobalData();

  return (
    <html
      lang="en"
      className={`${spartan.variable} ${arimo.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-stone-900" suppressHydrationWarning>
        <CartProvider>
          <SmoothScrolling>
            <Header globalData={globalData} />
            {/* Removendo o padding top para a home ocupar a tela toda */}
            <main className="flex-1 w-full flex flex-col">
              {children}
            </main>
            <Footer globalData={globalData} />
          </SmoothScrolling>
        </CartProvider>
      </body>
    </html>
  );
}
