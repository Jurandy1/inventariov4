"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Package2 } from "lucide-react"

interface StockManagementProps {
  data: any[] | null
  loading: boolean
}

export default function StockManagement({ data, loading }: StockManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")

  const filteredData = useMemo(() => {
    if (!data) return []

    return data.filter((item) => {
      const matchSearch =
        !searchTerm ||
        (item.Item || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Fornecedor || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchUnit = selectedUnit === "all" || item.Unidade === selectedUnit

      return matchSearch && matchUnit
    })
  }, [data, searchTerm, selectedUnit])

  const availableUnits = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((item) => item.Unidade || "N/A"))].sort()
  }, [data])

  const exportData = () => {
    if (!filteredData.length) return

    const headers = Object.keys(filteredData[0])
    const csvContent = [
      headers.join(";"),
      ...filteredData.map((item) =>
        headers.map((header) => `"${String(item[header] || "").replace(/"/g, '""')}"`).join(";"),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "estoque.csv"
    link.click()
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-blue-600" />
            Gestão de Estoque
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

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-blue-600" />
            Gestão de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg">Nenhum dado de estoque disponível</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Filtrar por Unidade
              </label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="bg-white/80 border-slate-200">
                  <SelectValue placeholder="Todas as Unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Buscar no Estoque
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Ex: Café, Papel A4..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={exportData} className="w-full bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Exportar Estoque
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-blue-600" />
            Itens em Estoque ({filteredData.length.toLocaleString()} itens)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/80">
                  {data[0] &&
                    Object.keys(data[0]).map((header) => (
                      <TableHead key={header} className="font-semibold">
                        {header.toUpperCase()}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    {Object.values(item).map((value, cellIndex) => (
                      <TableCell key={cellIndex} className="text-slate-700 dark:text-slate-300">
                        {String(value || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
