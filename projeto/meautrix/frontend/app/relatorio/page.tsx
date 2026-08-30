"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Package, ClipboardList, AlertTriangle, TrendingDown } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const chartConfig = {
  total: { label: "Qtd. consumida", color: "var(--chart-1)" },
} satisfies ChartConfig

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function RelatorioPage() {
  const { products, movements } = useStore()

  const lowStock = products.filter((p) => p.quantity <= p.minStock)

  const consumptionByProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of movements) {
      for (const c of m.consumption) {
        map.set(c.productName, (map.get(c.productName) ?? 0) + c.amount)
      }
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({
        name: name.length > 16 ? name.slice(0, 15) + "…" : name,
        total: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total)
  }, [movements])

  const stats = [
    {
      label: "Produtos cadastrados",
      value: products.length,
      icon: Package,
    },
    {
      label: "Procedimentos realizados",
      value: movements.length,
      icon: ClipboardList,
    },
    {
      label: "Itens com estoque baixo",
      value: lowStock.length,
      icon: AlertTriangle,
    },
    {
      label: "Tipos de insumo consumidos",
      value: consumptionByProduct.length,
      icon: TrendingDown,
    },
  ]

  return (
    <DashboardShell
      title="Relatório"
      description="Acompanhe o consumo de insumos e o histórico de procedimentos."
    >
      <div className="flex flex-col gap-6">
        {/* Cartões de resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Gráfico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consumo total por produto</CardTitle>
            </CardHeader>
            <CardContent>
              {consumptionByProduct.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">Sem movimentações registradas.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={consumptionByProduct} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={11}
                      interval={0}
                      angle={-15}
                      height={50}
                      textAnchor="end"
                    />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Alertas de estoque */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Reposição necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Todos os produtos estão acima do estoque mínimo.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {lowStock.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Mínimo: {p.minStock} {p.unit}</p>
                      </div>
                      <Badge variant="destructive">
                        {p.quantity} {p.unit}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico de movimentações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de procedimentos</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Insumos consumidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(m.date)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {m.procedureName}
                        {m.times > 1 && (
                          <Badge variant="secondary" className="ml-2">
                            {m.times}x
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.professional}</TableCell>
                      <TableCell className="text-muted-foreground">{m.client}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {m.consumption.map((c, i) => (
                            <Badge key={i} variant="outline" className="font-normal">
                              {c.productName.split(" ").slice(0, 2).join(" ")}: {c.amount}
                              {c.unit}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Nenhum procedimento registrado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
