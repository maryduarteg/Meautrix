"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarDays, Plus, Minus, RotateCcw, Check, AlertTriangle, Sparkles } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useStore, type ProcedureItem } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ProcedimentosPage() {
  const { products, procedures, registerProcedureDay } = useStore()
  const [procedureId, setProcedureId] = useState("")
  const [client, setClient] = useState("")
  const [items, setItems] = useState<ProcedureItem[]>([])

  const selected = procedures.find((p) => p.id === procedureId)

  // Ao escolher o procedimento, carrega as quantidades padrão pré-definidas
  useEffect(() => {
    if (selected) {
      setItems(selected.items.map((i) => ({ productId: i.productId, amount: i.amount })))
    } else {
      setItems([])
    }
  }, [selected])

  function setAmount(productId: string, amount: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, amount: Math.max(0, Math.round(amount * 100) / 100) } : i)),
    )
  }

  function resetDefaults() {
    if (selected) {
      setItems(selected.items.map((i) => ({ productId: i.productId, amount: i.amount })))
      toast.info("Quantidades restauradas para o padrão do procedimento.")
    }
  }

  const rows = useMemo(() => {
    return items.map((item) => {
      const product = products.find((p) => p.id === item.productId)
      const defaultAmount = selected?.items.find((i) => i.productId === item.productId)?.amount ?? 0
      const available = product?.quantity ?? 0
      return {
        productId: item.productId,
        name: product?.name ?? "Produto removido",
        unit: product?.unit ?? "",
        amount: item.amount,
        defaultAmount,
        available,
        adjusted: item.amount !== defaultAmount,
        insufficient: item.amount > available,
      }
    })
  }, [items, products, selected])

  const hasInsufficient = rows.some((r) => r.insufficient)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!procedureId) {
      toast.error("Selecione o procedimento realizado.")
      return
    }
    const result = registerProcedureDay({ procedureId, client, items })
    if (result.ok) {
      toast.success(result.message)
      setProcedureId("")
      setClient("")
      setItems([])
    } else {
      toast.error(result.message)
    }
  }

  return (
    <DashboardShell
      title="Procedimentos do Dia"
      description="Informe o procedimento realizado. As quantidades de produtos já vêm pré-definidas e podem ser ajustadas."
    >
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Seleção do procedimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Registrar procedimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Procedimento realizado *</Label>
                <Select value={procedureId} onValueChange={setProcedureId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o procedimento">
                      {(value: string) => procedures.find((p) => p.id === value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Basta escolher o procedimento — os produtos usados já são carregados automaticamente.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client">Cliente (opcional)</Label>
                <Input
                  id="client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Deixe em branco se não quiser relacionar"
                />
              </div>

              <Button type="submit" className="mt-2 w-full gap-2" disabled={!selected || hasInsufficient}>
                <Check className="h-4 w-4" />
                Registrar e dar baixa
              </Button>
              {hasInsufficient && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Estoque insuficiente para um ou mais insumos.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Ajuste das quantidades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Produtos utilizados</CardTitle>
            {selected && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={resetDefaults}>
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar padrão
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 opacity-50" />
                <p>Selecione um procedimento para ver e ajustar os produtos utilizados.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{selected.name}</p>
                  <Badge variant="secondary">{rows.filter((r) => r.amount > 0).length} produtos</Badge>
                </div>
                <Separator />
                <ul className="flex flex-col gap-4">
                  {rows.map((row) => (
                    <li key={row.productId} className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Padrão: {row.defaultAmount} {row.unit} • Em estoque: {row.available} {row.unit}
                          {row.adjusted && <span className="ml-1 font-medium text-primary">(ajustado)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 bg-transparent"
                          onClick={() => setAmount(row.productId, row.amount - 0.5)}
                          aria-label={`Diminuir ${row.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.amount}
                          onChange={(e) => setAmount(row.productId, Number(e.target.value))}
                          className={`h-8 w-20 text-center ${row.insufficient ? "border-destructive text-destructive" : ""}`}
                          aria-label={`Quantidade de ${row.name} em ${row.unit}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 bg-transparent"
                          onClick={() => setAmount(row.productId, row.amount + 0.5)}
                          aria-label={`Aumentar ${row.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-12 text-xs text-muted-foreground">{row.unit}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
