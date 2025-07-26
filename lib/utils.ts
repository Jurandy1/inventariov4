import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeWords(str: string): string {
  if (!str) return ""
  return str.toLowerCase().replace(/([^\s/]+)/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}

export function getServiceKey(serviceName: string): string {
  const name = (serviceName || "").toLowerCase().trim()
  if (name === "conselho" || name === "ct") return "conselho"
  if (name.includes("cras")) return "cras"
  if (name.includes("creas")) return "creas"
  if (name.includes("externa")) return "externa"
  if (name.includes("centro pop") || name === "centro pop") return "centro_pop"
  if (name.includes("abrigo")) return "abrigo"
  if (name.includes("sede")) return "sede"
  return "item"
}

export function formatUnitName(item: any, includeType = false): string {
  const nomeUnidade = item.unit_condition
  const idPrefix = (item.id || "").split("_")[0]
  const lowerCaseName = nomeUnidade.toLowerCase()

  if (item.type === "CT") {
    return `CT ${nomeUnidade}`
  }

  let prefix = ""
  switch (idPrefix) {
    case "creas":
      prefix = "CREAS "
      break
    case "cras":
      if (!lowerCaseName.startsWith("cras ")) {
        prefix = "CRAS "
      }
      break
    case "externa":
    case "centro_pop":
    case "abrigo":
    case "sede":
    case "conselho":
      return nomeUnidade
  }

  return `${prefix}${nomeUnidade}`
}

export function normalizeString(str: string): string {
  if (!str) return ""
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), delay)
  }
}
