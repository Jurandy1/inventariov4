"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp } from "lucide-react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface DashboardChartsProps {
  data: any[] | null
  loading: boolean
}

export default function DashboardCharts({ data, loading }: DashboardChartsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!data || loading || !chartRef.current) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    const stateCounts = data.reduce(
      (acc, item) => {
        acc[item.state] = (acc[item.state] || 0) + item.quantity
        return acc
      },
      { Novo: 0, Bom: 0, Regular: 0, Avariado: 0 },
    )

    const isDark = document.documentElement.classList.contains("dark")

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Novo", "Bom", "Regular", "Avariado"],
        datasets: [
          {
            data: [stateCounts.Novo, stateCounts.Bom, stateCounts.Regular, stateCounts.Avariado],
            backgroundColor: [
              "rgba(34, 197, 94, 0.8)",
              "rgba(59, 130, 246, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
            borderColor: ["rgb(34, 197, 94)", "rgb(59, 130, 246)", "rgb(251, 191, 36)", "rgb(239, 68, 68)"],
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: isDark ? "#cbd5e1" : "#334155",
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              font: {
                size: 14,
                weight: "500",
              },
            },
          },
          title: {
            display: true,
            text: "Distribuição por Estado de Conservação",
            color: isDark ? "#cbd5e1" : "#334155",
            font: {
              size: 18,
              weight: "bold",
            },
            padding: 20,
          },
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000,
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, loading])

  const exportChart = () => {
    if (chartRef.current) {
      const link = document.createElement("a")
      link.href = chartRef.current.toDataURL("image/png")
      link.download = "dashboard-chart.png"
      link.click()
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Visão Geral do Patrimônio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          Visão Geral do Patrimônio
        </CardTitle>
        <Button variant="outline" size="sm" onClick={exportChart} className="bg-white/80">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-[450px] relative">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  )
}
