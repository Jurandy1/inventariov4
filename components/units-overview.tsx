"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Package } from "lucide-react"
import { formatUnitName } from "@/lib/utils"

interface UnitsOverviewProps {
  data: any[] | null
  loading: boolean
}

export default function UnitsOverview({ data, loading }: UnitsOverviewProps) {
  const unitsData = useMemo(() => {
    if (!data) return { byType: {}, byUnit: {} }

    const byType: Record<string, { count: number; units: Set<string> }> = {}
    const byUnit: Record<string, { type: string; totalItems: number; itemTypes: Set<string> }> = {}

    data.forEach((item) => {
      const unitName = formatUnitName(item, true)
      const serviceType = item.id.split("_")[0] || "outros"

      // Group by service type
      if (!byType[serviceType]) {
        byType[serviceType] = { count: 0, units: new Set() }
      }
      byType[serviceType].units.add(unitName)
      byType[serviceType].count = byType[serviceType].units.size

      // Group by unit
      if (!byUnit[unitName]) {
        byUnit[unitName] = {
          type: serviceType,
          totalItems: 0,
          itemTypes: new Set(),
        }
      }
      byUnit[unitName].totalItems += item.quantity
      byUnit[unitName].itemTypes.add(item.type)
    })

    return { byType, byUnit }
  }, [data])

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      conselho: "Conselho Tutelar",
      cras: "CRAS",
      creas: "CREAS",
      externa: "Unidade Externa",
      centro_pop: "Centro POP",
      abrigo: "Abrigo",
      sede: "Sede",
      outros: "Outros",
    }
    return labels[type] || type.toUpperCase()
  }

  const getServiceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      conselho: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      cras: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      creas: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
      externa: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
      centro_pop: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
      abrigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
      sede: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
      outros: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
    }
    return colors[type] || colors["outros"]
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Visão Geral das Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Visão Geral das Unidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Types Overview */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-blue-600" />
            Tipos de Unidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(unitsData.byType).map(([type, info]) => (
              <Card key={type} className="group hover:shadow-md transition-all duration-300 border-slate-200/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getServiceTypeColor(type)}>{getServiceTypeLabel(type)}</Badge>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{info.count}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {info.count === 1 ? "unidade" : "unidades"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {Array.from(info.units)
                      .slice(0, 3)
                      .map((unit) => (
                        <p key={unit} className="text-sm text-slate-600 dark:text-slate-300 truncate">
                          • {unit}
                        </p>
                      ))}
                    {info.units.size > 3 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">+{info.units.size - 3} mais...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Units Detail */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-6 w-6 text-green-600" />
            Detalhes das Unidades ({Object.keys(unitsData.byUnit).length} unidades)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(unitsData.byUnit)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([unitName, info]) => (
                <Card key={unitName} className="group hover:shadow-md transition-all duration-300 border-slate-200/50">
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 dark:text-white text-base leading-tight">
                            {unitName}
                          </h3>
                          <Badge className={`mt-2 ${getServiceTypeColor(info.type)}`}>
                            {getServiceTypeLabel(info.type)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto mb-2">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">
                            {info.totalItems.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Total de Itens</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full mx-auto mb-2">
                            <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">{info.itemTypes.size}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Tipos Diferentes</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase mb-2">
                          Principais Tipos de Itens
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(info.itemTypes)
                            .slice(0, 4)
                            .map((itemType) => (
                              <Badge key={itemType} variant="outline" className="text-xs">
                                {itemType}
                              </Badge>
                            ))}
                          {info.itemTypes.size > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{info.itemTypes.size - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
