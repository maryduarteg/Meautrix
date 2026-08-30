"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Package, AlertTriangle } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const units = ["un", "ml", "g", "frasco", "par", "caixa"]
const categories = ["Preenchedor", "Botox", "Descartável", "Anestésico", "Skincare", "Outros"]

export default function CadastroPage() {
  const { products, addProduct, removeProduct } = useStore()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [unit, setUnit] = useState("")
  const [quantity, setQuantity] = useState("")
  const [minStock, setMinStock] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !category || !unit || !quantity) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }
    addProduct({
      name,
      category,
      unit,
      quantity: Number(quantity),
      minStock: Number(minStock) || 0,
    })
    toast.success(`Produto "${name}" cadastrado.`)
    setName("")
    setCategory("")
    setUnit("")
    setQuantity("")
    setMinStock("")
  }

  return (
    <DashboardShell
      title="Cadastro de Produtos"
      description="Adicione insumos ao estoque e defina o nível mínimo de alerta."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-primary" />
              Novo produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome do produto *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Ácido Hialurônico 1ml"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Unidade *</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="un" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="qty">Quantidade *</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="min">Estoque mínimo</Label>
                <Input
                  id="min"
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="Alerta quando atingir este nível"
                />
              </div>

              <Button type="submit" className="mt-2 w-full">
                Cadastrar produto
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Produtos em estoque
              <Badge variant="secondary" className="ml-1">
                {products.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const low = p.quantity <= p.minStock
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.category}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.quantity} {p.unit}
                        </TableCell>
                        <TableCell>
                          {low ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Baixo
                            </Badge>
                          ) : (
                            <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                              Ok
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              removeProduct(p.id)
                              toast.success(`"${p.name}" removido.`)
                            }}
                            aria-label={`Remover ${p.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Nenhum produto cadastrado ainda.
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
