"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ThumbsUp,
  Gift,
  PieChart,
  Moon,
  Sun,
  BarChart3,
  RefreshCw,
  Menu,
  X,
  Wifi,
  WifiOff,
  Info,
  Building2,
  ClipboardList,
} from "lucide-react"
import { useTheme } from "next-themes"
import DashboardCharts from "@/components/dashboard-charts"
import InventoryTable from "@/components/inventory-table"
import StockManagement from "@/components/stock-management"
import TotalItemsView from "@/components/total-items-view"
import UnitsOverview from "@/components/units-overview"
import NeedsAnalysis from "@/components/needs-analysis"
import { useInventoryData } from "@/hooks/use-inventory-data"

export default function InventoryDashboard() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [filters, setFilters] = useState({
    service: "all",
    unit: "",
    state: "all",
    donation: "all",
    search: "",
  })

  const { allItems, stockItems, loading, error, lastUpdate, refreshData, isOfflineMode } = useInventoryData()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? (key === "unit" ? "" : "all") : value,
    }))
  }, [])

  // Reset page when filters change
  useEffect(() => {
    // Reset to first page when filters change
  }, [filters])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const getFilteredItems = useCallback(() => {
    if (!allItems) return []

    return allItems.filter((item) => {
      const matchService = !filters.service || item.id.startsWith(`${filters.service}_`)
      const matchUnit = !filters.unit || item.unit_condition === filters.unit
      const matchState = !filters.state || item.state === filters.state
      const matchSearch =
        !filters.search ||
        item.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.type.toLowerCase().includes(filters.search.toLowerCase())

      let matchDonation = true
      if (filters.donation === "sim") {
        matchDonation = item.donation_source && !["proprio", "proprios"].includes(item.donation_source.toLowerCase())
      } else if (filters.donation === "nao") {
        matchDonation = !item.donation_source || ["proprio", "proprios"].includes(item.donation_source.toLowerCase())
      }

      return matchService && matchUnit && matchState && matchSearch && matchDonation
    })
  }, [allItems, filters])

  const summaryStats = {
    total: allItems?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    damaged: allItems?.filter((item) => item.state === "Avariado").reduce((sum, item) => sum + item.quantity, 0) || 0,
    new: allItems?.filter((item) => item.state === "Novo").reduce((sum, item) => sum + item.quantity, 0) || 0,
    good: allItems?.filter((item) => item.state === "Bom").reduce((sum, item) => sum + item.quantity, 0) || 0,
    donations:
      allItems
        ?.filter(
          (item) => item.donation_source && !["proprio", "proprios"].includes(item.donation_source.toLowerCase()),
        )
        .reduce((sum, item) => sum + item.quantity, 0) || 0,
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Modern Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-md border border-slate-200 dark:border-slate-700">
                <img
                  src="https://www.saoluis.ma.gov.br/img/logo_mobile.png?1738946184"
                  alt="Prefeitura de São Luís"
                  className="h-8 lg:h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=40&width=120&text=Prefeitura"
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white leading-tight">
                  Inventário 2025
                </h1>
                <p className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Almoxarifado e Patrimônio
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 mr-4">
                {isOfflineMode ? (
                  <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-medium">Modo Demo</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs font-medium">Online</span>
                  </div>
                )}
              </div>

              {lastUpdate && (
                <div className="text-right mr-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Última atualização</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{lastUpdate}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="bg-white/80 dark:bg-slate-800/80"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="bg-white/80 dark:bg-slate-800/80">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 py-4 space-y-3">
              <div className="text-center">
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Inventário 2025</h1>
                <p className="text-sm text-blue-600 dark:text-blue-400">Almoxarifado e Patrimônio</p>

                {/* Mobile Connection Status */}
                <div className="flex items-center justify-center space-x-2 mt-2">
                  {isOfflineMode ? (
                    <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                      <WifiOff className="h-4 w-4" />
                      <span className="text-xs font-medium">Modo Demonstração</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <Wifi className="h-4 w-4" />
                      <span className="text-xs font-medium">Online</span>
                    </div>
                  )}
                </div>

                {lastUpdate && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Última atualização: {lastUpdate}</p>
                )}
              </div>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={loading}
                  className="bg-white/80 dark:bg-slate-800/80"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
                <Button variant="outline" size="sm" onClick={toggleTheme} className="bg-white/80 dark:bg-slate-800/80">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Demo Mode Alert */}
        {isOfflineMode && (
          <Alert className="mb-6 border-blue-200 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              <div className="space-y-2">
                <p className="font-semibold">🎯 Modo Demonstração Ativo</p>
                <p>
                  O sistema está funcionando com dados de exemplo para demonstrar todas as funcionalidades. Todos os
                  recursos estão disponíveis para teste.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshData}
                    className="bg-white/80 dark:bg-slate-800/80"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Conectar Novamente
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && !isOfflineMode && (
          <Alert className="mb-6 border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <div className="space-y-2">
                <p className="font-semibold">Erro ao carregar dados:</p>
                <p>{error}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshData}
                    className="bg-white/80 dark:bg-slate-800/80"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      localStorage.clear()
                      window.location.reload()
                    }}
                    className="bg-white/80 dark:bg-slate-800/80"
                  >
                    Limpar Cache
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-white/10" />
            <CardContent className="relative p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-2 lg:mb-0">
                  <p className="text-blue-100 text-xs lg:text-sm font-medium">Total</p>
                  <p className="text-xl lg:text-3xl font-bold">{summaryStats.total.toLocaleString()}</p>
                </div>
                <div className="self-end lg:self-auto">
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full">
                    <Package className="h-5 w-5 lg:h-8 lg:w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-white/10" />
            <CardContent className="relative p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-2 lg:mb-0">
                  <p className="text-red-100 text-xs lg:text-sm font-medium">Avariados</p>
                  <p className="text-xl lg:text-3xl font-bold">{summaryStats.damaged.toLocaleString()}</p>
                </div>
                <div className="self-end lg:self-auto">
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full">
                    <AlertTriangle className="h-5 w-5 lg:h-8 lg:w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-white/10" />
            <CardContent className="relative p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-2 lg:mb-0">
                  <p className="text-green-100 text-xs lg:text-sm font-medium">Novos</p>
                  <p className="text-xl lg:text-3xl font-bold">{summaryStats.new.toLocaleString()}</p>
                </div>
                <div className="self-end lg:self-auto">
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full">
                    <TrendingUp className="h-5 w-5 lg:h-8 lg:w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-white/10" />
            <CardContent className="relative p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-2 lg:mb-0">
                  <p className="text-sky-100 text-xs lg:text-sm font-medium">Bom Estado</p>
                  <p className="text-xl lg:text-3xl font-bold">{summaryStats.good.toLocaleString()}</p>
                </div>
                <div className="self-end lg:self-auto">
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full">
                    <ThumbsUp className="h-5 w-5 lg:h-8 lg:w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-white/10" />
            <CardContent className="relative p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-2 lg:mb-0">
                  <p className="text-purple-100 text-xs lg:text-sm font-medium">Doações</p>
                  <p className="text-xl lg:text-3xl font-bold">{summaryStats.donations.toLocaleString()}</p>
                </div>
                <div className="self-end lg:self-auto">
                  <div className="p-2 lg:p-3 bg-white/20 rounded-full">
                    <Gift className="h-5 w-5 lg:h-8 lg:w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-1 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-0 bg-transparent gap-1">
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2 lg:gap-3 py-3 lg:py-4 px-3 lg:px-6 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm lg:text-base"
              >
                <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="font-medium hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="patrimonio"
                className="flex items-center gap-2 lg:gap-3 py-3 lg:py-4 px-3 lg:px-6 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm lg:text-base"
              >
                <Package className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="font-medium hidden sm:inline">Patrimônio</span>
              </TabsTrigger>
              <TabsTrigger
                value="estoque"
                className="flex items-center gap-2 lg:gap-3 py-3 lg:py-4 px-3 lg:px-6 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm lg:text-base"
              >
                <Package className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="font-medium hidden sm:inline">Estoque</span>
              </TabsTrigger>
              <TabsTrigger
                value="total-itens"
                className="flex items-center gap-2 lg:gap-3 py-3 lg:py-4 px-3 lg:px-6 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm lg:text-base"
              >
                <PieChart className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="font-medium hidden sm:inline">Total Itens</span>
              </TabsTrigger>
              <TabsTrigger
                value="unidades"
                className="flex items-center gap-2 lg:gap-3 py-3 lg:py-4 px-3 lg:px-6 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm lg:text-base"
              >
                <Building2 className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="font-medium hidden sm:inline">Unidades</span>
              </TabsTrigger>
              <TabsTrigger
                value="necessidades"
                className="flex items-center gap-2 lg:gap-3 py-3 lg:py-4 px-3 lg:px-6 rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm lg:text-base"
              >
                <ClipboardList className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="font-medium hidden sm:inline">Necessidades</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardCharts data={allItems} loading={loading} />
          </TabsContent>

          <TabsContent value="patrimonio" className="space-y-6">
            <InventoryTable
              data={getFilteredItems()}
              loading={loading}
              filters={filters}
              onFilterChange={handleFilterChange}
              allItems={allItems}
            />
          </TabsContent>

          <TabsContent value="estoque" className="space-y-6">
            <StockManagement data={stockItems} loading={loading} />
          </TabsContent>

          <TabsContent value="total-itens" className="space-y-6">
            <TotalItemsView data={allItems} loading={loading} />
          </TabsContent>

          <TabsContent value="unidades" className="space-y-6">
            <UnitsOverview data={allItems} loading={loading} />
          </TabsContent>

          <TabsContent value="necessidades" className="space-y-6">
            <NeedsAnalysis data={allItems} loading={loading} />
          </TabsContent>
        </Tabs>

        {/* Modern Footer */}
        <footer className="text-center mt-12 lg:mt-16 py-6 lg:py-8">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50 inline-block shadow-lg">
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm lg:text-base">
              Desenvolvido por:{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Jurandy & Colaboradores</span>
            </p>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-500 mt-1">Prefeitura de São Luís - MA</p>
            {isOfflineMode && (
              <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                Sistema funcionando em modo demonstração
              </p>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}
