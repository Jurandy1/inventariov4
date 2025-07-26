"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, PieChart } from "lucide-react"
import { formatUnitName } from "@/lib/utils"

interface TotalItemsViewProps {
  data: any[] | null
  loading: boolean
}

export default function TotalItemsView({ data, loading }: TotalItemsViewProps) {
  const [filters, setFilters] = useState({
    category: "all",
    search: "",
    unit: "all",
    state: "all",
  })

  const groupedItems = useMemo(() => {
    if (!data) return {}

    let filteredData = data

    if (filters.category !== "all") {
      filteredData = filteredData.filter((item) => item.type === filters.category)
    }

    if (filters.search) {
      filteredData = filteredData.filter((item) =>
        item.description.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    if (filters.unit !== "all") {
      filteredData = filteredData.filter((item) => formatUnitName(item, true) === filters.unit)
    }

    if (filters.state !== "all") {
      filteredData = filteredData.filter((item) => item.state === filters.state)
    }

    return filteredData.reduce(
      (acc, item) => {
        const desc = item.description
        if (!desc || desc === "N/A") return acc

        if (!acc[desc]) {
          acc[desc] = {
            total: 0,
            type: item.type,
            locations: {},
          }
        }

        acc[desc].total += item.quantity

        const unitName = formatUnitName(item, true)
        const locationKey = `${unitName} - ${item.location || "N/D"}`
        acc[desc].locations[locationKey] = (acc[desc].locations[locationKey] || 0) + item.quantity

        return acc
      },
      {} as Record<string, any>,
    )
  }, [data, filters])

  const availableCategories = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((item) => item.type))].filter((type) => type && type !== "N/A").sort()
  }, [data])

  const availableUnits = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((item) => formatUnitName(item, true)))].sort()
  }, [data])

  const states = ["Novo", "Bom", "Regular", "Avariado"]

  const totalItems = Object.keys(groupedItems).length
  const totalQuantity = Object.values(groupedItems).reduce((sum: number, item: any) => sum + item.total, 0)

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Total de Itens
          </CardTitle>
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
    <div className="space-y-8">
      {/* Enhanced Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Categoria (Tipo)</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-white/80 border-slate-200">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Buscar por Descrição
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Ex: Fogão, Cadeira..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-white/80 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Unidade</label>
              <Select value={filters.unit} onValueChange={(value) => setFilters((prev) => ({ ...prev, unit: value }))}>
                <SelectTrigger className="bg-white/80 border-slate-200">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Estado</label>
              <Select
                value={filters.state}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, state: value }))}
              >
                <SelectTrigger className="bg-white/80 border-slate-200">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary */}
      {totalItems > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-blue-200/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <PieChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    Exibindo <span className="font-bold text-blue-600 dark:text-blue-400">{totalItems}</span> tipo(s) de
                    item
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Com base nos filtros aplicados</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Quantidade Total</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {totalItems === 0 ? (
          <div className="col-span-full text-center py-16">
            <PieChart className="h-20 w-20 text-slate-300 mx-auto mb-6" />
            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium mb-2">Nenhum item encontrado</p>
            <p className="text-slate-500 dark:text-slate-400">Tente ajustar os filtros para ver mais resultados</p>
          </div>
        ) : (
          Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([description, data]: [string, any]) => (
              <Card
                key={description}
                className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-white/20"
              >
                <CardContent className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-lg leading-tight pr-3">
                      {description}
                    </h3>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {data.total.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                  >
                    {data.type}
                  </Badge>

                  <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                      Distribuição por Local
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Object.entries(data.locations)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([location, quantity]: [string, any]) => (
                          <div
                            key={location}
                            className="flex justify-between items-center text-sm py-2 px-3 rounded-lg bg-slate-50/80 dark:bg-slate-700/50 hover:bg-slate-100/80 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="truncate pr-3 text-slate-700 dark:text-slate-300">{location}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 flex-shrink-0 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-md">
                              {quantity}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  )
}
