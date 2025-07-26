"use client"

import { useState, useEffect, useCallback } from "react"

const GOOGLE_SHEET_PATRIMONIO_URL =
  "https://script.google.com/macros/s/AKfycbypxSVE9syiII4H4DumAfxWEgFm1AE7qLpuQgqHTNLMi4B7I8dWF0Het7V2Cd4_aL58Mg/exec"

const ALTERNATIVE_CSV_URLS = [
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRtgMcUrrMlaEW0BvLD1466J1geRMzLkv6iZ5QpdY53BH6bc38SMinDvC1C-iI9RKHIcWqTjRf4ccdk/pub?output=csv",
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRtgMcUrrMlaEW0BvLD1466J1geRMzLkv6iZ5QpdY53BH6bc38SMinDvC1C-iI9RKHIcWqTjRf4ccdk/pub?gid=0&single=true&output=csv",
  // Add more alternative URLs here if needed
]

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheItem {
  value: any
  expiry: number
}

const setWithExpiry = (key: string, value: any, ttl: number) => {
  try {
    const now = new Date()
    const item: CacheItem = {
      value: value,
      expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (e) {
    console.warn("Error saving to localStorage", e)
  }
}

const getWithExpiry = (key: string) => {
  try {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item: CacheItem = JSON.parse(itemStr)
    const now = new Date()

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return item.value
  } catch (e) {
    localStorage.removeItem(key)
    return null
  }
}

const parseCsvData = (csvText: string) => {
  try {
    console.log("📄 Parsing CSV data, length:", csvText.length)

    // Check if it's actually HTML (Google Sheets error page)
    if (csvText.includes("<html") || csvText.includes("<!DOCTYPE")) {
      console.error("❌ Received HTML instead of CSV - likely an error page")
      return null
    }

    const lines = csvText.trim().split(/\r\n|\n/)
    console.log("📄 Total lines found:", lines.length)

    if (lines.length < 2) {
      console.warn("⚠️ CSV has less than 2 lines")
      return null
    }

    const headerLine = lines[0]
    const delimiter = headerLine.includes(";") ? ";" : ","
    const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""))
    console.log("📄 Headers found:", headers)

    const data = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue

      const values = lines[i].split(delimiter)
      const item: any = {}

      for (let j = 0; j < headers.length; j++) {
        let value = values[j] ? values[j].trim() : ""
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        }
        item[headers[j]] = value
      }
      data.push(item)
    }

    console.log("✅ CSV parsed successfully, items:", data.length)
    return data
  } catch (error) {
    console.error("❌ Error parsing CSV data:", error)
    return null
  }
}

const formatSheetData = (sheetData: any[]) => {
  try {
    console.log("🔄 Formatting sheet data, items:", sheetData.length)

    const formatted = sheetData.map((row, index) => {
      const standardizedUnitName = row.Unidade || row.unidade || "N/A"
      let finalState = row.Estado || row.estado || "Regular"

      // Check for damaged items
      const observationText = (row["Observação"] || row.observacao || "").toLowerCase()
      const normalizedState = (finalState || "").toLowerCase()
      const isDamagedByState = /defeito|avaria|danificado|nao funciona/.test(normalizedState)
      const isDamagedByObs = /avariado|defeito|danificado|não funciona|nao funciona/.test(observationText)

      if (isDamagedByState || (finalState === "Novo" && isDamagedByObs)) {
        finalState = "Avariado"
      }

      return {
        id: `${row.Tipo || row.tipo || "item"}_${index}`,
        type: row.Tipo || row.tipo || "N/A",
        description: row["Descrição"] || row.descricao || row.Descrição || "N/A",
        unit_condition: standardizedUnitName,
        quantity: Number.parseInt(row.Quantidade || row.quantidade || "1", 10) || 1,
        location: row["Localização"] || row.localizacao || row.Localização || "N/A",
        state: finalState,
        donation_source: row["Origem da Doação"] || row.origem_doacao || "",
        observation: row["Observação"] || row.observacao || "",
        supplier: row.Fornecedor || row.fornecedor || "",
        originalStateWasNew: (row.Estado || row.estado) === "Novo",
      }
    })

    console.log("✅ Sheet data formatted successfully, items:", formatted.length)
    return formatted
  } catch (error) {
    console.error("❌ Error formatting sheet data:", error)
    return []
  }
}

// Comprehensive demo data that covers all system features
const getDemoPatrimonioData = () => {
  return [
    // CRAS Centro
    {
      Tipo: "Mobiliário",
      Descrição: "Cadeira de Escritório Giratória",
      Unidade: "CRAS Centro",
      Quantidade: "12",
      Localização: "Sala de Atendimento",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Equipamento",
      Descrição: "Computador Desktop Dell",
      Unidade: "CRAS Centro",
      Quantidade: "4",
      Localização: "Recepção",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "TechSul Informática",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Bebedouro Industrial",
      Unidade: "CRAS Centro",
      Quantidade: "1",
      Localização: "Copa",
      Estado: "Bom",
      "Origem da Doação": "Doação Municipal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Mobiliário",
      Descrição: "Mesa de Reunião Oval",
      Unidade: "CRAS Centro",
      Quantidade: "2",
      Localização: "Sala de Reuniões",
      Estado: "Regular",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - pequenos riscos",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Equipamento",
      Descrição: "Impressora Multifuncional HP",
      Unidade: "CRAS Centro",
      Quantidade: "1",
      Localização: "Administração",
      Estado: "Avariado",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - precisa de manutenção",
      Fornecedor: "TechSul Informática",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Ar Condicionado Split 12000 BTUs",
      Unidade: "CRAS Centro",
      Quantidade: "2",
      Localização: "Atendimento",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Clima São Luís",
    },

    // CREAS Norte
    {
      Tipo: "Mobiliário",
      Descrição: "Cadeira Plástica Empilhável",
      Unidade: "CREAS Norte",
      Quantidade: "20",
      Localização: "Sala de Espera",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Plásticos Nordeste",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Ar Condicionado Split 18000 BTUs",
      Unidade: "CREAS Norte",
      Quantidade: "3",
      Localização: "Atendimento",
      Estado: "Novo",
      "Origem da Doação": "Doação Estadual",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Equipamento",
      Descrição: "Notebook Lenovo",
      Unidade: "CREAS Norte",
      Quantidade: "5",
      Localização: "Coordenação",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "TechSul Informática",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Ventilador de Teto",
      Unidade: "CREAS Norte",
      Quantidade: "6",
      Localização: "Sala de Atendimento",
      Estado: "Regular",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Elétrica Central",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Bebedouro Gelágua",
      Unidade: "CREAS Norte",
      Quantidade: "1",
      Localização: "Recepção",
      Estado: "Bom",
      "Origem da Doação": "Doação Municipal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },

    // CT São Luís
    {
      Tipo: "Mobiliário",
      Descrição: "Mesa de Escritório L",
      Unidade: "São Luís",
      Quantidade: "8",
      Localização: "Gabinete",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Equipamento",
      Descrição: "Telefone Fixo Digital",
      Unidade: "São Luís",
      Quantidade: "10",
      Localização: "Atendimento",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Telecom MA",
    },
    {
      Tipo: "Mobiliário",
      Descrição: "Arquivo de Aço 4 Gavetas",
      Unidade: "São Luís",
      Quantidade: "6",
      Localização: "Arquivo",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Ventilador de Coluna",
      Unidade: "São Luís",
      Quantidade: "4",
      Localização: "Sala de Atendimento",
      Estado: "Regular",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Elétrica Central",
    },

    // CRAS Cohama
    {
      Tipo: "Equipamento",
      Descrição: "Projetor Multimídia",
      Unidade: "CRAS Cohama",
      Quantidade: "1",
      Localização: "Auditório",
      Estado: "Bom",
      "Origem da Doação": "Doação Federal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Micro-ondas 30L",
      Unidade: "CRAS Cohama",
      Quantidade: "1",
      Localização: "Copa",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Eletro São Luís",
    },
    {
      Tipo: "Mobiliário",
      Descrição: "Sofá 3 Lugares",
      Unidade: "CRAS Cohama",
      Quantidade: "2",
      Localização: "Sala de Espera",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Ar Condicionado Split 9000 BTUs",
      Unidade: "CRAS Cohama",
      Quantidade: "3",
      Localização: "Atendimento",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Clima São Luís",
    },

    // CRAS Turu
    {
      Tipo: "Mobiliário",
      Descrição: "Mesa Redonda",
      Unidade: "CRAS Turu",
      Quantidade: "4",
      Localização: "Sala de Atividades",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Equipamento",
      Descrição: "TV LED 42 polegadas",
      Unidade: "CRAS Turu",
      Quantidade: "1",
      Localização: "Sala de Espera",
      Estado: "Novo",
      "Origem da Doação": "Doação Municipal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Bebedouro Coluna",
      Unidade: "CRAS Turu",
      Quantidade: "1",
      Localização: "Corredor",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Eletro São Luís",
    },

    // Centro POP
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Geladeira Duplex 400L",
      Unidade: "Centro POP",
      Quantidade: "2",
      Localização: "Cozinha",
      Estado: "Bom",
      "Origem da Doação": "Doação Municipal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Mobiliário",
      Descrição: "Beliche de Ferro",
      Unidade: "Centro POP",
      Quantidade: "15",
      Localização: "Dormitório",
      Estado: "Regular",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Fogão Industrial 6 Bocas",
      Unidade: "Centro POP",
      Quantidade: "1",
      Localização: "Cozinha",
      Estado: "Bom",
      "Origem da Doação": "Doação Municipal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Máquina de Lavar 12kg",
      Unidade: "Centro POP",
      Quantidade: "2",
      Localização: "Lavanderia",
      Estado: "Novo",
      "Origem da Doação": "Doação Estadual",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },

    // Sede
    {
      Tipo: "Equipamento",
      Descrição: "Servidor Dell PowerEdge",
      Unidade: "Sede",
      Quantidade: "1",
      Localização: "TI",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "TechSul Informática",
    },
    {
      Tipo: "Mobiliário",
      Descrição: "Estante de Aço 5 Prateleiras",
      Unidade: "Sede",
      Quantidade: "12",
      Localização: "Almoxarifado",
      Estado: "Bom",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },
    {
      Tipo: "Equipamento",
      Descrição: "Roteador Wi-Fi Empresarial",
      Unidade: "Sede",
      Quantidade: "3",
      Localização: "TI",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "TechSul Informática",
    },
    {
      Tipo: "Mobiliário",
      Descrição: "Mesa de Diretoria",
      Unidade: "Sede",
      Quantidade: "1",
      Localização: "Diretoria",
      Estado: "Novo",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Móveis São Luís Ltda",
    },

    // Unidade Externa Itaqui-Bacanga
    {
      Tipo: "Mobiliário",
      Descrição: "Cadeira Plástica",
      Unidade: "Unidade Externa Itaqui-Bacanga",
      Quantidade: "25",
      Localização: "Sala Multiuso",
      Estado: "Regular",
      "Origem da Doação": "",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "Plásticos Nordeste",
    },
    {
      Tipo: "Equipamento",
      Descrição: "Caixa de Som Amplificada",
      Unidade: "Unidade Externa Itaqui-Bacanga",
      Quantidade: "2",
      Localização: "Sala Multiuso",
      Estado: "Bom",
      "Origem da Doação": "Doação Municipal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },

    // Abrigo Institucional
    {
      Tipo: "Mobiliário",
      Descrição: "Cama Solteiro",
      Unidade: "Abrigo Institucional",
      Quantidade: "20",
      Localização: "Dormitório Infantil",
      Estado: "Bom",
      "Origem da Doação": "Doação Federal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Eletrodoméstico",
      Descrição: "Geladeira 300L",
      Unidade: "Abrigo Institucional",
      Quantidade: "1",
      Localização: "Cozinha",
      Estado: "Novo",
      "Origem da Doação": "Doação Municipal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
    {
      Tipo: "Equipamento",
      Descrição: "Tablet Educativo",
      Unidade: "Abrigo Institucional",
      Quantidade: "8",
      Localização: "Sala de Estudos",
      Estado: "Novo",
      "Origem da Doação": "Doação Federal",
      Observação: "Sistema em modo demonstração - dados de exemplo",
      Fornecedor: "",
    },
  ]
}

const getDemoStockData = () => {
  return [
    {
      Item: "Papel A4 75g",
      Quantidade: "500",
      Unidade: "Resma",
      Fornecedor: "Papelaria Central MA",
      "Data de Entrada": "15/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
    {
      Item: "Caneta Esferográfica Azul",
      Quantidade: "200",
      Unidade: "Unidade",
      Fornecedor: "Material Escolar MA",
      "Data de Entrada": "10/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
    {
      Item: "Café em Pó Tradicional",
      Quantidade: "50",
      Unidade: "Pacote 500g",
      Fornecedor: "Distribuidora Nordeste",
      "Data de Entrada": "20/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
    {
      Item: "Água Mineral",
      Quantidade: "100",
      Unidade: "Galão 20L",
      Fornecedor: "Água Pura MA",
      "Data de Entrada": "18/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
    {
      Item: "Açúcar Cristal",
      Quantidade: "30",
      Unidade: "Pacote 1kg",
      Fornecedor: "Distribuidora Nordeste",
      "Data de Entrada": "22/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
    {
      Item: "Detergente Neutro",
      Quantidade: "24",
      Unidade: "Frasco 500ml",
      Fornecedor: "Limpeza Total MA",
      "Data de Entrada": "12/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
    {
      Item: "Papel Higiênico",
      Quantidade: "100",
      Unidade: "Rolo",
      Fornecedor: "Higiene São Luís",
      "Data de Entrada": "08/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
    {
      Item: "Álcool em Gel 70%",
      Quantidade: "50",
      Unidade: "Frasco 500ml",
      Fornecedor: "Farmácia Central",
      "Data de Entrada": "25/01/2025",
      Observação: "Sistema em modo demonstração - dados de exemplo",
    },
  ]
}

const useInventoryData = () => {
  const [allItems, setAllItems] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false)

  // Enhanced fetch function with multiple URL attempts
  const safeFetch = useCallback(async (url: string, isCSV = false): Promise<any[] | null> => {
    const urlsToTry = isCSV ? [url, ...ALTERNATIVE_CSV_URLS] : [url]

    for (let i = 0; i < urlsToTry.length; i++) {
      const currentUrl = urlsToTry[i]
      try {
        console.log(`🔄 Tentativa ${i + 1}/${urlsToTry.length}: ${currentUrl}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.log("⏰ Timeout atingido para:", currentUrl)
          controller.abort()
        }, 15000) // 15 seconds timeout

        const response = await fetch(currentUrl, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            Accept: isCSV ? "text/csv, text/plain, */*" : "application/json, */*",
            "User-Agent": "Mozilla/5.0 (compatible; InventorySystem/1.0)",
          },
          signal: controller.signal,
          mode: "cors",
        })

        clearTimeout(timeoutId)

        console.log(`📡 Response status: ${response.status} for ${currentUrl}`)

        if (!response.ok) {
          console.warn(`⚠️ HTTP ${response.status}: ${response.statusText} for ${currentUrl}`)
          continue // Try next URL
        }

        let data
        if (isCSV) {
          const csvText = await response.text()
          console.log(`📄 CSV text length: ${csvText.length}`)

          // Check if we got an error page instead of CSV
          if (
            csvText.includes("Sorry, the file you have requested does not exist") ||
            csvText.includes("<html") ||
            csvText.includes("<!DOCTYPE")
          ) {
            console.warn(`⚠️ Received error page instead of CSV from ${currentUrl}`)
            continue // Try next URL
          }

          data = parseCsvData(csvText)
        } else {
          const rawData = await response.json()
          console.log(`📊 JSON data type:`, typeof rawData)
          data = Array.isArray(rawData) ? rawData : rawData?.content || rawData?.data || null
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(`⚠️ Invalid or empty data from ${currentUrl}`)
          continue // Try next URL
        }

        console.log(`✅ Dados carregados com sucesso de ${currentUrl}: ${data.length} itens`)
        return data
      } catch (error) {
        console.error(`❌ Erro ao buscar dados de ${currentUrl}:`, error)
        if (error.name === "AbortError") {
          console.error("❌ Request cancelado por timeout")
        }
        // Continue to next URL
      }
    }

    console.error("❌ Todas as tentativas de URL falharam")
    return null
  }, [])

  const loadData = useCallback(async () => {
    console.log("🚀 Iniciando carregamento do sistema...")
    setLoading(true)
    setError(null)

    // Prepare demo data as fallback
    const demoPatrimonio = formatSheetData(getDemoPatrimonioData())
    const demoStock = getDemoStockData()

    try {
      // First, try to load from cache
      console.log("💾 Verificando cache...")
      const cachedPatrimonio = getWithExpiry("patrimonioCache")
      const cachedStock = getWithExpiry("estoqueCache")

      if (cachedPatrimonio && Array.isArray(cachedPatrimonio) && cachedPatrimonio.length > 0) {
        console.log("✅ Dados do patrimônio encontrados no cache")
        const formattedCachedData = formatSheetData(cachedPatrimonio)
        setAllItems(formattedCachedData)
        setIsOfflineMode(false)

        const cacheTime = new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        setLastUpdate(`${cacheTime} (Cache)`)
      } else {
        // No cache, set demo data temporarily
        console.log("📝 Usando dados demo temporariamente...")
        setAllItems(demoPatrimonio)
        setIsOfflineMode(true)
      }

      if (cachedStock && Array.isArray(cachedStock) && cachedStock.length > 0) {
        console.log("✅ Dados do estoque encontrados no cache")
        setStockItems(cachedStock)
      } else {
        setStockItems(demoStock)
      }

      setLoading(false)

      // Now try to fetch fresh data
      console.log("🌐 Tentando carregar dados frescos...")

      // Try patrimonio data
      const freshPatrimonioData = await safeFetch(GOOGLE_SHEET_PATRIMONIO_URL)

      if (freshPatrimonioData && Array.isArray(freshPatrimonioData) && freshPatrimonioData.length > 0) {
        console.log("🎉 Dados frescos do patrimônio carregados com sucesso!")
        const formattedFreshData = formatSheetData(freshPatrimonioData)
        setAllItems(formattedFreshData)
        setIsOfflineMode(false)
        setError(null)

        // Cache the fresh data
        setWithExpiry("patrimonioCache", freshPatrimonioData, CACHE_TTL)

        const freshTime = new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        setLastUpdate(freshTime)
      } else {
        console.log("⚠️ Não foi possível carregar dados frescos do patrimônio")
        if (!cachedPatrimonio) {
          setIsOfflineMode(true)
          setError(
            "❌ Erro de Conectividade: Não foi possível acessar as planilhas do Google. Possíveis causas:\n\n• URL da planilha incorreta ou arquivo não existe\n• Planilha não está pública\n• Problemas de rede ou CORS\n• Planilha foi movida ou deletada\n\n✅ Sistema funcionando com dados de demonstração.",
          )
        }
      }

      // Try stock data with multiple URLs
      const freshStockData = await safeFetch(ALTERNATIVE_CSV_URLS[0], true)

      if (freshStockData && Array.isArray(freshStockData) && freshStockData.length > 0) {
        console.log("🎉 Dados frescos do estoque carregados com sucesso!")
        setStockItems(freshStockData)
        setWithExpiry("estoqueCache", freshStockData, CACHE_TTL)
      } else {
        console.log("⚠️ Não foi possível carregar dados frescos do estoque")
      }
    } catch (error) {
      console.error("❌ Erro geral no carregamento:", error)
      setAllItems(demoPatrimonio)
      setStockItems(demoStock)
      setIsOfflineMode(true)
      setError(
        `❌ Erro no Sistema: ${error.message}\n\n✅ Sistema funcionando com dados de demonstração para garantir funcionalidade completa.`,
      )
      setLoading(false)

      const errorTime = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      setLastUpdate(`${errorTime} (Erro)`)
    }
  }, [safeFetch])

  const refreshData = useCallback(() => {
    console.log("🔄 Forçando refresh dos dados...")
    try {
      localStorage.removeItem("patrimonioCache")
      localStorage.removeItem("estoqueCache")
      console.log("🗑️ Cache limpo")
    } catch (e) {
      console.warn("⚠️ Erro ao limpar cache:", e)
    }
    loadData()
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    allItems,
    stockItems,
    loading,
    error,
    lastUpdate,
    refreshData,
    isOfflineMode,
  }
}

export { useInventoryData }
