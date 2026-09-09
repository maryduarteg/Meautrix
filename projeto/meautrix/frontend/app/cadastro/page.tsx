"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { Plus, Power, Package, AlertTriangle, Search, X, Filter, Pencil } from "lucide-react"
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
  const { products, addProduct, updateProduct, toggleProductStatus } = useStore()
  
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [unit, setUnit] = useState("")
  const [quantity, setQuantity] = useState("")
  const [minStock, setMinStock] = useState("")

  // Filtros
  const [searchName, setSearchName] = useState("")
  const [searchCategory, setSearchCategory] = useState("Todas")
  const [searchStatus, setSearchStatus] = useState<"Todos" | "A" | "I">("Todos")
  const [searchMinQty, setSearchMinQty] = useState("")

  function handleEditStart(p: any) {
    setEditingId(p.id)
    setName(p.name)
    setCategory(p.category)
    setUnit(p.unit)
    setQuantity(p.quantity.toString())
    setMinStock(p.minStock.toString())
  }

  function handleCancelEdit() {
    setEditingId(null)
    setName("")
    setCategory("")
    setUnit("")
    setQuantity("")
    setMinStock("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !category || !unit || !quantity) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }
    if (name.length > 90) {
      toast.error("A descrição do produto deve possuir no máximo 90 caracteres.")
      return
    }
    
    if (editingId) {
      updateProduct(editingId, {
        name,
        category,
        unit,
        quantity: Number(quantity),
        minStock: Number(minStock) || 0,
      })
      toast.success(`Produto "${name}" alterado.`)
    } else {
      addProduct({
        name,
        category,
        unit,
        quantity: Number(quantity),
        minStock: Number(minStock) || 0,
      })
      toast.success(`Produto "${name}" cadastrado.`)
    }
    
    handleCancelEdit()
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesName = p.name.toLowerCase().includes(searchName.toLowerCase())
      const matchesCategory = searchCategory === "Todas" || p.category === searchCategory
      const matchesStatus = searchStatus === "Todos" || (searchStatus === "A" ? p.active : !p.active)
      const matchesMinQty = searchMinQty === "" || p.minStock >= Number(searchMinQty)
      return matchesName && matchesCategory && matchesStatus && matchesMinQty
    })
  }, [products, searchName, searchCategory, searchStatus, searchMinQty])

  return (
    <DashboardShell
      title="Cadastro de Produtos"
      description="Gerencie os produtos cadastrados no sistema, utilizados nos procedimentos e com controle de estoque."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Formulário */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {editingId ? (
                  <Pencil className="h-4 w-4 text-primary" />
                ) : (
                  <Plus className="h-4 w-4 text-primary" />
                )}
                {editingId ? "Editar produto" : "Novo produto"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Descrição do produto *</Label>
                  <Input
                    id="name"
                    value={name}
                    maxLength={90}
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
                  <Label htmlFor="min">Qtde. mínima (Alerta)</Label>
                  <Input
                    id="min"
                    type="number"
                    min="0"
                    step="0.01"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="Ex.: 5"
                  />
                </div>

                {editingId ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <Button type="submit" className="mt-2 w-full">
                    Cadastrar produto
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tabela com Filtros */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Filtros de busca
                </div>
                {(searchName || searchCategory !== "Todas" || searchStatus !== "Todos" || searchMinQty) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchName("")
                      setSearchCategory("Todas")
                      setSearchStatus("Todos")
                      setSearchMinQty("")
                    }}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Descrição</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Buscar..."
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Categoria</Label>
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Status</Label>
                <Select value={searchStatus} onValueChange={(val: any) => setSearchStatus(val)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="A">Ativos</SelectItem>
                    <SelectItem value="I">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Estoque Mínimo (≥)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={searchMinQty}
                  onChange={(e) => setSearchMinQty(e.target.value)}
                  placeholder="Ex.: 10"
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" />
                Produtos em estoque
                <Badge variant="secondary" className="ml-1">
                  {filteredProducts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto / Categoria</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead>Alerta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => {
                      const low = p.quantity <= p.minStock
                      return (
                        <TableRow key={p.id} className={!p.active ? "opacity-60 grayscale" : ""}>
                          <TableCell>
                            <p className="font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.category}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.quantity} {p.unit}
                          </TableCell>
                          <TableCell>
                            {low ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Baixo (Min: {p.minStock})
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Ok
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.active ? "default" : "secondary"}>
                              {p.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => handleEditStart(p)}
                                title="Editar"
                                aria-label={`Editar ${p.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={p.active ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-primary"}
                                onClick={() => {
                                  toggleProductStatus(p.id)
                                  toast.success(`Status de "${p.name}" alterado.`)
                                }}
                                title={p.active ? "Inativar" : "Ativar"}
                                aria-label={p.active ? `Inativar ${p.name}` : `Ativar ${p.name}`}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          Nenhum produto encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
