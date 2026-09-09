"use client"

import React, { useMemo, useState } from "react"
import { Eye, EyeOff, Pencil, ShieldCheck, Activity, Power, Loader2, List, Plus, Tag, Search, X } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export interface Categoria {
  id: number
  descricao: string
  ativo: string  // 'A' (Ativo) ou 'I' (Inativo)
}

const mockCategorias: Categoria[] = [
  { id: 1, descricao: "Estética Facial", ativo: "A" },
  { id: 2, descricao: "Estética Corporal", ativo: "A" },
  { id: 3, descricao: "Cabelos", ativo: "A" },
  { id: 4, descricao: "Unhas", ativo: "I" },
  { id: 5, descricao: "Depilação", ativo: "A" },
]

export default function CategoriasPage() {
  const [categoriaList, setCategoriaList] = useState<Categoria[]>(mockCategorias)
  const [submitting, setSubmitting] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(mockCategorias[0]?.id || null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")
  const [descricaoFilter, setDescricaoFilter] = useState("")

  // Form de edição
  const [editData, setEditData] = useState({
    descricao: "",
    ativo: "A",
  })

  // Form de criação
  const [novaCategoria, setNovaCategoria] = useState({
    descricao: "",
  })

  const selected = useMemo(() => {
    return categoriaList.find((c) => c.id === selectedId) || null
  }, [categoriaList, selectedId])

  // Preenche o formulário de edição ao selecionar/editar categoria
  React.useEffect(() => {
    if (selected) {
      setEditData({
        descricao: selected.descricao,
        ativo: selected.ativo,
      })
    }
  }, [selected, editing])

  const filteredCategorias = useMemo(() => {
    return categoriaList.filter((c) => {
      const matchesDesc = c.descricao.toLowerCase().includes(descricaoFilter.toLowerCase())
      const matchesStatus = statusFilter === "Todos" || c.ativo === statusFilter
      return matchesDesc && matchesStatus
    })
  }, [categoriaList, statusFilter, descricaoFilter])

  const getInitials = (descricao: string) => {
    if (!descricao) return "C"
    return descricao
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  // Alterar categoria (mock)
  async function updateCategoria() {
    if (!selected) return
    if (!editData.descricao.trim()) {
      return toast.error("Descrição é obrigatória.")
    }

    try {
      setSubmitting(true)
      // Simulando delay de API
      await new Promise(resolve => setTimeout(resolve, 500))

      const updatedList = categoriaList.map(c => 
        c.id === selected.id ? { ...c, descricao: editData.descricao.trim(), ativo: editData.ativo } : c
      )
      setCategoriaList(updatedList)

      toast.success("Categoria atualizada com sucesso!")
      setEditing(false)
    } catch {
      toast.error("Erro ao atualizar categoria.")
    } finally {
      setSubmitting(false)
    }
  }

  // Inativar / Ativar (mock)
  async function toggleCategoriaStatus(id: number) {
    const categoria = categoriaList.find((c) => c.id === id)
    if (!categoria) return

    try {
      // Simulando delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newStatus = categoria.ativo === "A" ? "I" : "A"
      const updatedList = categoriaList.map(c => 
        c.id === id ? { ...c, ativo: newStatus } : c
      )
      
      setCategoriaList(updatedList)
      toast.success(`Status da categoria alterado com sucesso!`)
    } catch {
      toast.error("Não foi possível alterar o status.")
    }
  }

  // Criar Categoria (mock)
  async function createCategoria() {
    if (!novaCategoria.descricao.trim()) {
      return toast.error("Preencha a descrição da categoria.")
    }

    try {
      setSubmitting(true)
      // Simulando delay de API
      await new Promise(resolve => setTimeout(resolve, 500))

      const nextId = Math.max(0, ...categoriaList.map(c => c.id)) + 1
      const nova = {
        id: nextId,
        descricao: novaCategoria.descricao.trim(),
        ativo: "A",
      }

      setCategoriaList([...categoriaList, nova])
      toast.success("Categoria cadastrada com sucesso!")
      setNovaCategoria({ descricao: "" })
      setShowCreateForm(false)
      setSelectedId(nova.id)
    } catch {
      toast.error("Erro ao cadastrar categoria.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell title="Gerenciar Categorias" description="Cadastre, atualize e gerencie as categorias de produtos.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <List className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{categoriaList.length}</p>
                <p className="text-xs text-muted-foreground">Categorias cadastradas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{categoriaList.filter((c) => c.ativo === "A").length}</p>
                <p className="text-xs text-muted-foreground">Categorias ativas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />Cadastrar nova categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-1">
              <div>
                <Label htmlFor="cat-descricao">Descrição da Categoria</Label>
                <Input id="cat-descricao" className="mt-2" placeholder="Ex.: Produtos para Cabelo" value={novaCategoria.descricao} onChange={(e) => setNovaCategoria((p) => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={submitting}>Cancelar</Button>
                <Button type="button" onClick={createCategoria} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar categoria
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="cat-desc-filter">Descrição da categoria</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="cat-desc-filter" value={descricaoFilter} onChange={(e) => setDescricaoFilter(e.target.value)} placeholder="Buscar por descrição..." className="pl-9" />
              </div>
            </div>
            
            <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Filtrar categorias por status">
              {statusFilter !== "Todos" || descricaoFilter ? (
                <button type="button" onClick={() => { setDescricaoFilter(""); setStatusFilter("Todos") }} className="mr-1 rounded-md px-2 text-muted-foreground hover:text-foreground" aria-label="Limpar filtros">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              {[
                { label: "Todas", value: "Todos" },
                { label: "Ativas", value: "A" },
                { label: "Inativas", value: "I" },
              ].map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setStatusFilter(st.value as any)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === st.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />Cadastrar categoria
            </Button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4 text-primary" />Categorias cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {filteredCategorias.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Nenhuma categoria encontrada.</p>
              ) : (
                filteredCategorias.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedId(c.id); setEditing(false); }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${selected?.id === c.id ? "border-primary bg-secondary/70" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(c.descricao)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.descricao}</p>
                      <p className="truncate text-xs text-muted-foreground">ID: {c.id}</p>
                    </div>
                    <Badge variant={c.ativo === "A" ? "default" : "secondary"} className="text-[10px]">
                      {c.ativo === "A" ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); toggleCategoriaStatus(c.id) }}>
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {selected && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4 text-primary" />Dados da categoria</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selected.ativo === "A" ? "default" : "secondary"}>
                      {selected.ativo === "A" ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditing((p) => !p)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />{editing ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>ID da Categoria</Label>
                    <Input value={selected.id} readOnly className="mt-2 bg-muted/40 font-mono text-xs" />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={editing ? editData.descricao : selected.descricao}
                      onChange={(e) => setEditData((p) => ({ ...p, descricao: e.target.value }))}
                      readOnly={!editing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    {editing ? (
                      <select
                        className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={editData.ativo}
                        onChange={(e) => setEditData((p) => ({ ...p, ativo: e.target.value }))}
                      >
                        <option value="A">Ativa</option>
                        <option value="I">Inativa</option>
                      </select>
                    ) : (
                      <Input value={selected.ativo === "A" ? "Ativa" : "Inativa"} readOnly className="mt-2 bg-muted/40" />
                    )}
                  </div>

                  {editing && (
                    <div className="sm:col-span-2 flex justify-end mt-4">
                      <Button onClick={updateCategoria} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar alterações
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
