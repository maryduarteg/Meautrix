"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Pencil, ShieldCheck, Power, Loader2, List, Plus, Tag, Search, X } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const API_URL = "http://localhost:5139/api/categoriaproduto"

export interface Categoria {
  catProdId: number
  catProdDescricao: string
  catProdAtivo: string // 'A' (Ativo) ou 'I' (Inativo)
}

export default function CategoriasPage() {
  const [categoriaList, setCategoriaList] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(null)
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

  // Busca todas as categorias na API
  async function fetchCategorias() {
    try {
      setLoading(true)
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error("Falha ao buscar categorias.")
      const data: Categoria[] = await res.json()
      setCategoriaList(data)
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].catProdId)
      }
    } catch (err) {
      toast.error("Erro ao carregar categorias.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => {
    return categoriaList.find((c) => c.catProdId === selectedId) || null
  }, [categoriaList, selectedId])

  // Preenche o formulário de edição ao selecionar/editar categoria
  React.useEffect(() => {
    if (selected) {
      setEditData({
        descricao: selected.catProdDescricao,
        ativo: selected.catProdAtivo,
      })
    }
  }, [selected, editing])

  const filteredCategorias = useMemo(() => {
    return categoriaList.filter((c) => {
      const matchesDesc = c.catProdDescricao.toLowerCase().includes(descricaoFilter.toLowerCase())
      const matchesStatus = statusFilter === "Todos" || c.catProdAtivo === statusFilter
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

  // Alterar categoria (PUT /api/categoriaproduto/{id})
  async function updateCategoria() {
    if (!selected) return
    if (!editData.descricao.trim()) {
      return toast.error("Descrição é obrigatória.")
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${API_URL}/${selected.catProdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catProdDescricao: editData.descricao.trim(),
          catProdAtivo: editData.ativo,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao atualizar categoria.")
      }

      const updatedList = categoriaList.map((c) =>
        c.catProdId === selected.catProdId
          ? { ...c, catProdDescricao: editData.descricao.trim(), catProdAtivo: editData.ativo }
          : c
      )
      setCategoriaList(updatedList)

      toast.success("Categoria atualizada com sucesso!")
      setEditing(false)
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar categoria.")
    } finally {
      setSubmitting(false)
    }
  }

  // Inativar / Ativar (PATCH /api/categoriaproduto/{id})
  async function toggleCategoriaStatus(id: number) {
    const categoria = categoriaList.find((c) => c.catProdId === id)
    if (!categoria) return

    const newStatus = categoria.catProdAtivo === "A" ? "I" : "A"

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catProdAtivo: newStatus }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Não foi possível alterar o status.")
      }

      const updatedList = categoriaList.map((c) =>
        c.catProdId === id ? { ...c, catProdAtivo: newStatus } : c
      )
      setCategoriaList(updatedList)
      toast.success("Status da categoria alterado com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível alterar o status.")
    }
  }

  // Criar Categoria (POST /api/categoriaproduto)
  async function createCategoria() {
    if (!novaCategoria.descricao.trim()) {
      return toast.error("Preencha a descrição da categoria.")
    }

    try {
      setSubmitting(true)
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catProdDescricao: novaCategoria.descricao.trim(),
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao cadastrar categoria.")
      }

      toast.success("Categoria cadastrada com sucesso!")
      setNovaCategoria({ descricao: "" })
      setShowCreateForm(false)
      await fetchCategorias() // recarrega a lista para pegar o novo ID gerado pelo banco
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar categoria.")
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
                <p className="text-2xl font-semibold">{categoriaList.filter((c) => c.catProdAtivo === "A").length}</p>
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
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCategorias.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Nenhuma categoria encontrada.</p>
              ) : (
                filteredCategorias.map((c) => (
                  <div
                    key={c.catProdId}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedId(c.catProdId); setEditing(false); }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${selected?.catProdId === c.catProdId ? "border-primary bg-secondary/70" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(c.catProdDescricao)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.catProdDescricao}</p>
                      <p className="truncate text-xs text-muted-foreground">ID: {c.catProdId}</p>
                    </div>
                    <Badge variant={c.catProdAtivo === "A" ? "default" : "secondary"} className="text-[10px]">
                      {c.catProdAtivo === "A" ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); toggleCategoriaStatus(c.catProdId) }}>
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
                    <Badge variant={selected.catProdAtivo === "A" ? "default" : "secondary"}>
                      {selected.catProdAtivo === "A" ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditing((p) => !p)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />{editing ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>ID da Categoria</Label>
                    <Input value={selected.catProdId} readOnly className="mt-2 bg-muted/40 font-mono text-xs" />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={editing ? editData.descricao : selected.catProdDescricao}
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
                      <Input value={selected.catProdAtivo === "A" ? "Ativa" : "Inativa"} readOnly className="mt-2 bg-muted/40" />
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
