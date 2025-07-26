"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, AlertTriangle, CheckCircle } from "lucide-react"
import { formatUnitName } from "@/lib/utils"

interface NeedsAnalysisProps {
  data: any[] | null
  loading: boolean
}

export default function NeedsAnalysis({ data, loading }: NeedsAnalysisProps) {
  const [filter, setFilter] = useState("todos")

  const analysisResults = useMemo(() => {
    if (!data) return []

    const suitableLocations = [
      "recepção",
      "sala",
      "atendimento",
      "cozinha",
      "refeitório",
      "copa",
      "auditório",
      "gabinete",
    ]
    const itemsForAnalysis = data.filter((item) => item.type.toLowerCase() !== "sede")
    const units = [...new Set(itemsForAnalysis.map((item) => formatUnitName(item, true)))]

    const results: any[] = []

    units.forEach((unitName) => {
      const unitItems = itemsForAnalysis.filter((item) => formatUnitName(item, true) === unitName)
      const unitNeeds = {
        unitName,
        missing: [] as any[],
      }

      // Check for water fountain
      const hasBebedouro = unitItems.some((item) => item.description.toLowerCase().includes("bebedouro"))

      if (!hasBebedouro) {
        unitNeeds.missing.push({
          item: "Bebedouro",
          location: "Área Comum (Ex: Recepção ou Copa)",
        })
      }

      // Check for climate control in suitable locations
      const locationsInUnit = [...new Set(unitItems.map((item) => item.location))]
      const relevantLocations = locationsInUnit.filter((loc) =>
        suitableLocations.some((sLoc) => loc.toLowerCase().includes(sLoc)),
      )

      relevantLocations.forEach((location) => {
        const itemsInLocation = unitItems.filter((item) => item.location === location)
        const hasAC = itemsInLocation.some((item) => item.description.toLowerCase().includes("ar condicionado"))
        const hasVentilador = itemsInLocation.some((item) => item.description.toLowerCase().includes("ventilador"))

        if (!hasAC && !hasVentilador) {
          unitNeeds.missing.push({
            item: "Ar Condicionado ou Ventilador",
            location: location,
          })
        }
      })

      if (unitNeeds.missing.length > 0) {
        results.push(unitNeeds)
      }
    })

    return results
  }, [data])

  const filteredResults = useMemo(() => {
    if (filter === "todos") return analysisResults

    if (filter === "bebedouro") {
      return analysisResults
        .map((unit) => ({
          ...unit,
          missing: unit.missing.filter((need: any) => need.item === "Bebedouro"),
        }))
        .filter((unit) => unit.missing.length > 0)
    }

    if (filter === "climatizacao") {
      return analysisResults
        .map((unit) => ({
          ...unit,
          missing: unit.missing.filter((need: any) => need.item === "Ar Condicionado ou Ventilador"),
        }))
        .filter((unit) => unit.missing.length > 0)
    }

    return []
  }, [analysisResults, filter])

  const generatePDFReport = () => {
    // This would integrate with jsPDF in a real implementation
    const reportContent = filteredResults
      .map(
        (result) =>
          `${result.unitName}:\n${result.missing
            .map((need: any) => `- Falta: ${need.item} (Sugestão: ${need.location})`)
            .join("\n")}`,
      )
      .join("\n\n")

    const blob = new Blob([reportContent], { type: "text/plain" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "relatorio_necessidades.txt"
    link.click()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Necessidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Análise de Necessidades Essenciais</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Ferramenta para identificar a falta de itens essenciais (climatização e bebedouros) nas unidades.
              </p>
            </div>
            <Button onClick={generatePDFReport} className="bg-red-600 hover:bg-red-700">
              <FileText className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-xs">
              <label className="block text-sm font-medium mb-2">Filtrar por Necessidade</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Necessidades</SelectItem>
                  <SelectItem value="bebedouro">Falta de Bebedouro</SelectItem>
                  <SelectItem value="climatizacao">Falta de Climatização</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredResults.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Foram encontradas <strong>{filteredResults.length}</strong> unidade(s) com necessidades para o filtro
            selecionado.
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredResults.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl text-green-600 dark:text-green-400 font-semibold">Tudo em ordem!</p>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Nenhuma necessidade encontrada para o filtro selecionado.
            </p>
          </div>
        ) : (
          filteredResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg text-primary">{result.unitName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.missing.map((need: any, needIndex: number) => (
                    <div key={needIndex} className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{need.item}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sugestão de Local: {need.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
