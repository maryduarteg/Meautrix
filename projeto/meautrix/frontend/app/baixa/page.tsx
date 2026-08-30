"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ClipboardList, ArrowDownCircle, Check, AlertTriangle } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useStore } from "@/lib/store"
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

export default function BaixaPage() {
  const { products, procedures, registerBaixa } = useStore()
  const [procedureId, setProcedureId] = useState("")
  const [professional, setProfessional] = useState("")
  const [client, setClient] = useState("")
  const [times, setTimes] = useState("1")

  const selected = procedures.find((p) => p.id === procedureId)
  const multiplier = Math.max(1, Number(times) || 1)

  const preview = useMemo(() => {
    if (!selected) return []
    return selected.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)
      const needed = item.amount * multiplier
      const available = product?.quantity ?? 0
      return {
        productId: item.productId,
        name: product?.name ?? "Produto removido",
        unit: product?.unit ?? "",
        needed,
        available,
        after: available - needed,
        insufficient: needed > available,
      }
    })
  }, [selected, products, multiplier])

  const hasInsufficient = preview.some((p) => p.insufficient)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!procedureId || !professional || !client) {
      toast.error("Selecione o procedimento e preencha profissional e cliente.")
      return
    }
    const result = registerBaixa({
      procedureId,
      professional,
      client,
      times: multiplier,
    })
    if (result.ok) {
      toast.success(result.message)
      setProcedureId("")
      setProfessional("")
      setClient("")
      setTimes("1")
    } else {
      toast.error(result.message)
    }
  }

  return (
    <DashboardShell
      title="Dar Baixa em Produtos"
      description="Selecione o procedimento realizado para deduzir automaticamente os insumos do estoque."
    >
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Registro de procedimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Procedimento *</Label>
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
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="prof">Profissional *</Label>
                <Input
                  id="prof"
                  value={professional}
                  onChange={(e) => setProfessional(e.target.value)}
                  placeholder="Ex.: Dra. Marina Costa"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client">Cliente *</Label>
                <Input
                  id="client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="times">Quantidade de sessões / repetições</Label>
                <Input
                  id="times"
                  type="number"
                  min="1"
                  value={times}
                  onChange={(e) => setTimes(e.target.value)}
                />
              </div>

              <Button type="submit" className="mt-2 w-full gap-2" disabled={!selected || hasInsufficient}>
                <ArrowDownCircle className="h-4 w-4" />
                Confirmar baixa
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

        {/* Pré-visualização do consumo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consumo previsto</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <ClipboardList className="h-8 w-8 opacity-50" />
                <p>Selecione um procedimento para visualizar a baixa de estoque.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{selected.name}</p>
                  <Badge variant="secondary">{multiplier}x</Badge>
                </div>
                <Separator />
                <ul className="flex flex-col gap-3">
                  {preview.map((item) => (
                    <li key={item.productId} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Em estoque: {item.available} {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-sm font-semibold text-destructive">
                          -{item.needed} {item.unit}
                        </span>
                        {item.insufficient ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Insuf.
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
                            <Check className="h-3 w-3" />
                            {item.after} {item.unit}
                          </Badge>
                        )}
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
