"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, AlertTriangle, CheckCircle, Package, MapPin, Sparkles } from "lucide-react"
import { formatUnitName } from "@/lib/utils"

interface UnitDescriptiveReportProps {
  data: any[]
  loading: boolean
  filters?: any
}

export default function UnitDescriptiveReport({ data, loading, filters }: UnitDescriptiveReportProps) {
  const reportData = useMemo(() => {
    if (!data || data.length === 0 || !filters?.unit || filters.unit === "" || filters.unit === "all") return null

    // Get unit name for the title
    const unitName = formatUnitName(data[0], true)

    // Calculate statistics
    const totalItems = data.reduce((sum, item) => sum + item.quantity, 0)
    const totalTypes = data.length

    // Statistics by state
    const stateStats = data.reduce(
      (acc, item) => {
        const state = item.state
        if (!acc[state]) {
          acc[state] = { count: 0, items: [] }
        }
        acc[state].count += item.quantity
        acc[state].items.push(item)
        return acc
      },
      {} as Record<string, { count: number; items: any[] }>,
    )

    // Items that need attention (damaged + regular with issues)
    const attentionItems = data.filter((item) => {
      const isAvariado = item.state === "Avariado"
      const isRegularWithIssues =
        item.state === "Regular" &&
        (!item.location ||
          item.location === "N/A" ||
          item.location === "-" ||
          (item.observation &&
            /defeito|avaria|danificado|não funciona|nao funciona|quebrado|problema/i.test(item.observation)))
      return isAvariado || isRegularWithIssues
    })

    // New items (positive highlight)
    const newItems = data.filter((item) => item.state === "Novo")

    // Good condition items
    const goodItems = data.filter((item) => item.state === "Bom")

    // Unit locations
    const locations = [
      ...new Set(data.map((item) => item.location).filter((loc) => loc && loc !== "N/A" && loc !== "-")),
    ]

    // Most common item types
    const itemTypes = data.reduce(
      (acc, item) => {
        const type = item.type
        if (!acc[type]) {
          acc[type] = { count: 0, quantity: 0, items: [] }
        }
        acc[type].count += 1
        acc[type].quantity += item.quantity
        acc[type].items.push(item)
        return acc
      },
      {} as Record<string, { count: number; quantity: number; items: any[] }>,
    )

    return {
      unitName,
      totalItems,
      totalTypes,
      stateStats,
      attentionItems,
      newItems,
      goodItems,
      locations,
      itemTypes,
    }
  }, [data, filters])

  const getStateColor = (state: string) => {
    const colors = {
      Novo: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      Bom: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      Regular: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      Avariado: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    }
    return colors[state as keyof typeof colors] || colors.Regular
  }

  const getAttentionReason = (item: any) => {
    if (item.state === "Avariado") return "Item avariado"
    if (item.state === "Regular" && (!item.location || item.location === "N/A" || item.location === "-")) {
      return "Localização não definida"
    }
    if (
      item.observation &&
      /defeito|avaria|danificado|não funciona|nao funciona|quebrado|problema/i.test(item.observation)
    ) {
      return "Observação indica problema"
    }
    return "Requer atenção"
  }

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Relatório Descritivo da Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!reportData) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Relatório Descritivo da Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível para esta unidade</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-600" />
          Relatório Descritivo da {reportData.unitName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unit Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 lg:p-6 border border-blue-200/50 dark:border-slate-600/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                A {reportData.unitName} possui um total de{" "}
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {reportData.totalItems.toLocaleString()} itens
                </span>{" "}
                distribuídos em {reportData.totalTypes} tipos diferentes.
              </h3>

              <div className="mb-4">
                <p className="text-slate-700 dark:text-slate-300">
                  A situação geral é:{" "}
                  {Object.entries(reportData.stateStats).map(([state, stats], index, array) => (
                    <span key={state}>
                      <span className="font-semibold text-slate-800 dark:text-white">{stats.count}</span>{" "}
                      <span
                        className={
                          state === "Novo"
                            ? "text-green-600 dark:text-green-400"
                            : state === "Bom"
                              ? "text-blue-600 dark:text-blue-400"
                              : state === "Regular"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-red-600 dark:text-red-400"
                        }
                      >
                        {state.toLowerCase()}
                        {stats.count !== 1 ? "s" : ""}
                      </span>
                      {index < array.length - 1 ? (index === array.length - 2 ? " e " : ", ") : "."}
                    </span>
                  ))}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                {Object.entries(reportData.stateStats).map(([state, stats]) => (
                  <div key={state} className="text-center">
                    <Badge className={`${getStateColor(state)} mb-1`}>{state}</Badge>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Attention Points */}
        {reportData.attentionItems.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50/80 dark:border-orange-800 dark:bg-orange-900/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                    ⚠️ Ponto{reportData.attentionItems.length !== 1 ? "s" : ""} de Atenção: Total de{" "}
                    <span className="font-bold">{reportData.attentionItems.length}</span> ite
                    {reportData.attentionItems.length !== 1 ? "ns" : "m"} que precisa
                    {reportData.attentionItems.length === 1 ? "" : "m"} de atenção:
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reportData.attentionItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{item.quantity}x</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white">{item.description}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span>(Local: {item.location || "não informado"})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={`${getStateColor(item.state)} text-xs`}>{item.state}</Badge>
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            {getAttentionReason(item)}
                          </span>
                        </div>
                        {item.observation && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic bg-slate-100 dark:bg-slate-700 p-2 rounded">
                            💬 "{item.observation}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* New Items (Positive Highlight) */}
        {reportData.newItems.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 lg:p-6 border border-green-200/50 dark:border-green-700/50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                  ✨ Itens Novos ({reportData.newItems.length} tipos,{" "}
                  {reportData.newItems.reduce((sum, item) => sum + item.quantity, 0)} unidades):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportData.newItems.slice(0, 6).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{item.quantity}x</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white text-sm">{item.description}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span>{item.location || "Local não informado"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {reportData.newItems.length > 6 && (
                  <p className="text-sm text-green-700 dark:text-green-400 mt-3 text-center">
                    ... e mais {reportData.newItems.length - 6} tipos de itens novos
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Attention Points */}
        {reportData.attentionItems.length === 0 && (
          <Alert className="border-green-200 bg-green-50/80 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <p className="font-semibold text-green-800 dark:text-green-300">
                ✅ Excelente! A {reportData.unitName} não possui nenhum item que requer atenção especial.
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Todos os itens estão em boas condições e com localização definida.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Unit Locations */}
        {reportData.locations.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Localizações na {reportData.unitName} ({reportData.locations.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {reportData.locations.map((location, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Summary by Types */}
        {Object.keys(reportData.itemTypes).length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Tipos de Itens na {reportData.unitName}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(reportData.itemTypes)
                .sort(([, a], [, b]) => b.quantity - a.quantity)
                .slice(0, 9)
                .map(([type, stats]) => (
                  <div key={type} className="bg-slate-50/80 dark:bg-slate-800/80 rounded-lg p-4">
                    <p className="font-medium text-slate-800 dark:text-white text-sm mb-2">{type}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.quantity}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {stats.count} registro{stats.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
