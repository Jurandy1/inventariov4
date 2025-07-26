"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Search, Filter, Package, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { formatUnitName } from "@/lib/utils"
import UnitDescriptiveReport from "@/components/unit-descriptive-report"

interface InventoryTableProps {
  data: any[]
  loading: boolean
  filters: any
  onFilterChange: (key: string, value: string) => void
  allItems: any[] | null
}

const ITEMS_PER_PAGE = 20

export default function InventoryTable({ data, loading, filters, onFilterChange, allItems }: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [unitSearchTerm, setUnitSearchTerm] = useState("")
  const [unitModalOpen, setUnitModalOpen] = useState(false)

  const serviceTypes = [
    { value: "conselho", label: "CONSELHO" },
    { value: "cras", label: "CRAS" },
    { value: "creas", label: "CREAS" },
    { value: "externa", label: "UNIDADE EXTERNA" },
    { value: "centro_pop", label: "CENTRO POP" },
    { value: "abrigo", label: "ABRIGO" },
    { value: "sede", label: "SEDE" },
  ]

  const states = ["Novo", "Bom", "Regular", "Avariado"]

  // Get the display name for selected unit
  const selectedUnitDisplay = useMemo(() => {
    if (!filters.unit || filters.unit === "all") return ""
    const selectedItem = allItems?.find((item) => item.unit_condition === filters.unit)
    return selectedItem ? formatUnitName(selectedItem, true) : ""
  }, [filters.unit, allItems])

  // Filter available units based on search
  const filteredUnits = useMemo(() => {
    if (!allItems || !filters.service || filters.service === "all") return []

    const units = [
      ...new Set(
        allItems
          .filter((item) => item.id.startsWith(`${filters.service}_`))
          .map((item) => ({
            value: item.unit_condition,
            label: formatUnitName(item, true),
          })),
      ),
    ].sort((a, b) => a.label.localeCompare(b.label))

    if (!unitSearchTerm) return units

    return units.filter((unit) => unit.label.toLowerCase().includes(unitSearchTerm.toLowerCase()))
  }, [allItems, filters.service, unitSearchTerm])

  // Reset unit selection when service changes
  useEffect(() => {
    if (filters.service && filters.unit && filters.unit !== "all") {
      const isValidUnit = allItems?.some(
        (item) => item.id.startsWith(`${filters.service}_`) && item.unit_condition === filters.unit,
      )
      if (!isValidUnit) {
        onFilterChange("unit", "")
      }
    }
  }, [filters.service, filters.unit, allItems, onFilterChange])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [data, currentPage])

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)

  const getStateColor = (state: string) => {
    const colors = {
      Novo: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200",
      Bom: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200",
      Regular: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200",
      Avariado: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200",
    }
    return colors[state as keyof typeof colors] || colors.Regular
  }

  const handleUnitSelect = (unit: { value: string; label: string }) => {
    onFilterChange("unit", unit.value)
    setUnitModalOpen(false)
    setUnitSearchTerm("")
  }

  const handleClearUnit = () => {
    onFilterChange("unit", "")
    setUnitModalOpen(false)
    setUnitSearchTerm("")
  }

  const exportData = () => {
    const headers = [
      "Tipo",
      "Descrição",
      "Unidade",
      "Quantidade",
      "Localização",
      "Estado",
      "Origem da Doação",
      "Observação",
      "Fornecedor",
    ]
    const csvContent = [
      headers.join(";"),
      ...data.map((item) =>
        [
          item.type,
          item.description,
          formatUnitName(item, true),
          item.quantity,
          item.location,
          item.state,
          item.donation_source || "",
          item.observation || "",
          item.supplier || "",
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(";"),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "inventario.csv"
    link.click()
  }

  if (loading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Patrimônio Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!loading && (!data || data.length === 0)) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Patrimônio Detalhado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">Nenhum dado disponível</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">
                Verifique os filtros aplicados ou a conexão com os dados
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="bg-white/80 dark:bg-slate-800/80"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Mobile-First Filters */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo de Unidade</label>
              <Select value={filters.service || "all"} onValueChange={(value) => onFilterChange("service", value)}>
                <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Unidade</label>
              <Dialog open={unitModalOpen} onOpenChange={setUnitModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600"
                    disabled={!filters.service || filters.service === "all"}
                  >
                    {selectedUnitDisplay || "Selecione uma Unidade..."}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                  <DialogHeader>
                    <DialogTitle>Selecionar Unidade</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Pesquisar unidade..."
                      className="bg-white/80 dark:bg-slate-800/80"
                      value={unitSearchTerm}
                      onChange={(e) => setUnitSearchTerm(e.target.value)}
                    />
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredUnits.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                          {unitSearchTerm ? "Nenhuma unidade encontrada" : "Nenhuma unidade disponível"}
                        </p>
                      ) : (
                        filteredUnits.map((unit) => (
                          <Button
                            key={unit.value}
                            variant="ghost"
                            className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => handleUnitSelect(unit)}
                          >
                            {unit.label}
                          </Button>
                        ))
                      )}
                    </div>
                    <Button variant="outline" onClick={handleClearUnit}>
                      Limpar Seleção
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Estado</label>
              <Select value={filters.state || "all"} onValueChange={(value) => onFilterChange("state", value)}>
                <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600">
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

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Origem</label>
              <Select value={filters.donation || "all"} onValueChange={(value) => onFilterChange("donation", value)}>
                <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="sim">Apenas Doações</SelectItem>
                  <SelectItem value="nao">Apenas Próprios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Buscar Item</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Ex: Cadeira, Mesa..."
                  value={filters.search}
                  onChange={(e) => onFilterChange("search", e.target.value)}
                  className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Descriptive Report - Only shows when a specific unit is selected */}
      <UnitDescriptiveReport data={data} loading={loading} filters={filters} />

      {/* Enhanced Table */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Inventário Detalhado ({data.length.toLocaleString()} itens)
          </CardTitle>
          <Button onClick={exportData} variant="outline" className="bg-white/80 dark:bg-slate-800/80">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards View */}
          <div className="block lg:hidden space-y-4">
            {paginatedData.map((item, index) => (
              <Card key={index} className="border border-slate-200 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">{item.description}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.type}</p>
                      </div>
                      <Badge className={`${getStateColor(item.state)} font-medium`}>{item.state}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Unidade:</span>
                        <p className="font-medium">{formatUnitName(item, true)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Quantidade:</span>
                        <p className="font-bold text-blue-600">{item.quantity}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Local:</span>
                        <p className="font-medium">{item.location}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Origem:</span>
                        <p className="font-medium">{item.donation_source || "N/A"}</p>
                      </div>
                    </div>
                    {item.observation && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Observação:</span>
                        <p className="text-sm mt-1">{item.observation}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/80">
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Unidade</TableHead>
                  <TableHead className="text-center font-semibold">Qtd</TableHead>
                  <TableHead className="font-semibold">Localização</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Origem</TableHead>
                  <TableHead className="font-semibold">Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{item.type}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{formatUnitName(item, true)}</TableCell>
                    <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{item.location}</TableCell>
                    <TableCell>
                      <Badge className={`${getStateColor(item.state)} font-medium`}>{item.state}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {item.donation_source || "N/A"}
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate text-slate-600 dark:text-slate-400"
                      title={item.observation}
                    >
                      {item.observation || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Mobile-First Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium text-center sm:text-left">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, data.length)} de{" "}
                {data.length.toLocaleString()}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white/80 dark:bg-slate-800/80"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                <span className="text-sm font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white/80 dark:bg-slate-800/80"
                >
                  <span className="hidden sm:inline mr-1">Próximo</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
