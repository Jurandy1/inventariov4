import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Diretoria Técnica de Almoxarifado e Patrimônio - Inventário 2025",
  description: "Sistema de gestão de inventário da Prefeitura de São Luís - MA",
  keywords: "inventário, patrimônio, almoxarifado, São Luís, prefeitura",
  authors: [{ name: "Jurandy & Colaboradores" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="inventory-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
