"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Pencil, ShieldCheck, Power, Loader2, List, Plus, Tag, Search, X, Ruler } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const API_URL = "http://localhost:5139/api/medida"

export interface Medida {
  medId: number
  medSigla: string
  medDescricao: string
  medAtivo: string  // 'A' (Ativa) ou 'I' (Inativa)
}

export default function MedidasPage() {
  const [medidaList, setMedidaList] = useState<Medida[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")
  const [siglaFilter, setSiglaFilter] = useState("")
  const [descricaoFilter, setDescricaoFilter] = useState("")

  // Form de edição
  const [editData, setEditData] = useState({
    sigla: "",
    descricao: "",
    ativo: "A",
  })

  // Form de criação
  const [novaMedida, setNovaMedida] = useState({
    sigla: "",
    descricao: "",
  })

  // Busca todas as medidas na API
  async function fetchMedidas() {
    try {
      setLoading(true)
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error("Falha ao buscar medidas.")
      const data: Medida[] = await res.json()
      setMedidaList(data)
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].medId)
      }
    } catch (err) {
      toast.error("Erro ao carregar medidas.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedidas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => {
    return medidaList.find((m) => m.medId === selectedId) || null
  }, [medidaList, selectedId])

  // Preenche o formulário de edição ao selecionar/editar medida
  React.useEffect(() => {
    if (selected) {
      setEditData({
        sigla: selected.medSigla,
        descricao: selected.medDescricao,
        ativo: selected.medAtivo,
      })
    }
  }, [selected, editing])

  const filteredMedidas = useMemo(() => {
    return medidaList.filter((m) => {
      const matchesSigla = m.medSigla.toLowerCase().includes(siglaFilter.toLowerCase())
      const matchesDesc = m.medDescricao.toLowerCase().includes(descricaoFilter.toLowerCase())
      const matchesStatus = statusFilter === "Todos" || m.medAtivo === statusFilter
      return matchesSigla && matchesDesc && matchesStatus
    })
  }, [medidaList, statusFilter, siglaFilter, descricaoFilter])

  const getInitials = (sigla: string) => {
    if (!sigla) return "M"
    return sigla.substring(0, 2).toUpperCase()
  }

  // Alterar medida (PUT /api/medidas/{id})
  async function updateMedida() {
    if (!selected) return
    if (!editData.sigla.trim() || !editData.descricao.trim()) {
      return toast.error("Sigla e Descrição são obrigatórias.")
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${API_URL}/${selected.medId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medSigla: editData.sigla.trim(),
          medDescricao: editData.descricao.trim(),
          medAtivo: editData.ativo,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao atualizar medida.")
      }

      const updatedList = medidaList.map((m) =>
        m.medId === selected.medId
          ? {
              ...m,
              medSigla: editData.sigla.trim(),
              medDescricao: editData.descricao.trim(),
              medAtivo: editData.ativo,
            }
          : m
      )
      setMedidaList(updatedList)

      toast.success("Medida atualizada com sucesso!")
      setEditing(false)
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar medida.")
    } finally {
      setSubmitting(false)
    }
  }

  // Inativar / Ativar (PATCH /api/medidas/{id})
  async function toggleMedidaStatus(id: number) {
    const medida = medidaList.find((m) => m.medId === id)
    if (!medida) return

    const newStatus = medida.medAtivo === "A" ? "I" : "A"

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medAtivo: newStatus }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Não foi possível alterar o status.")
      }

      const updatedList = medidaList.map((m) =>
        m.medId === id ? { ...m, medAtivo: newStatus } : m
      )
      setMedidaList(updatedList)
      toast.success(`Medida ${newStatus === "A" ? "reativada" : "inativada"} com sucesso!`)
    } catch (err: any) {
      toast.error(err.message || "Não foi possível alterar o status.")
    }
  }

  // Criar Medida (POST /api/medidas)
  async function createMedida() {
    if (!novaMedida.sigla.trim() || !novaMedida.descricao.trim()) {
      return toast.error("Preencha a sigla e a descrição da medida.")
    }

    try {
      setSubmitting(true)
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medSigla: novaMedida.sigla.trim(),
          medDescricao: novaMedida.descricao.trim(),
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao cadastrar medida.")
      }

      toast.success("Medida cadastrada com sucesso!")
      setNovaMedida({ sigla: "", descricao: "" })
      setShowCreateForm(false)
      await fetchMedidas() // recarrega a lista para pegar o novo MedId gerado pelo banco
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar medida.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell title="Gerenciar Medidas" description="Cadastre, consulte e atualize as unidades de medida utilizadas nos produtos.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Ruler className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{medidaList.length}</p>
                <p className="text-xs text-muted-foreground">Medidas cadastradas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{medidaList.filter((m) => m.medAtivo === "A").length}</p>
                <p className="text-xs text-muted-foreground">Medidas ativas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />Cadastrar nova medida
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="med-sigla">Sigla</Label>
                <Input id="med-sigla" className="mt-2" placeholder="Ex.: ml" value={novaMedida.sigla} onChange={(e) => setNovaMedida((p) => ({ ...p, sigla: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="med-descricao">Descrição</Label>
                <Input id="med-descricao" className="mt-2" placeholder="Ex.: Mililitro" value={novaMedida.descricao} onChange={(e) => setNovaMedida((p) => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2 mt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={submitting}>Cancelar</Button>
                <Button type="button" onClick={createMedida} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar medida
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Label htmlFor="med-sigla-filter">Sigla</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="med-sigla-filter" value={siglaFilter} onChange={(e) => setSiglaFilter(e.target.value)} placeholder="Buscar por sigla..." className="pl-9" />
              </div>
            </div>

            <div className="flex-1">
              <Label htmlFor="med-desc-filter">Descrição</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="med-desc-filter" value={descricaoFilter} onChange={(e) => setDescricaoFilter(e.target.value)} placeholder="Buscar por descrição..." className="pl-9" />
              </div>
            </div>

            <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Filtrar medidas por status">
              {statusFilter !== "Todos" || siglaFilter || descricaoFilter ? (
                <button type="button" onClick={() => { setSiglaFilter(""); setDescricaoFilter(""); setStatusFilter("Todos") }} className="mr-1 rounded-md px-2 text-muted-foreground hover:text-foreground" aria-label="Limpar filtros">
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
              <Plus className="mr-2 h-4 w-4" />Nova medida
            </Button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4 text-primary" />Medidas cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMedidas.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Nenhuma medida encontrada.</p>
              ) : (
                filteredMedidas.map((m) => (
                  <div
                    key={m.medId}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedId(m.medId); setEditing(false); }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${selected?.medId === m.medId ? "border-primary bg-secondary/70" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(m.medSigla)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.medDescricao}</p>
                      <p className="truncate text-xs text-muted-foreground">Sigla: {m.medSigla}</p>
                    </div>
                    <Badge variant={m.medAtivo === "A" ? "default" : "secondary"} className="text-[10px]">
                      {m.medAtivo === "A" ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); toggleMedidaStatus(m.medId) }}>
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
                    <CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4 text-primary" />Dados da medida</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selected.medAtivo === "A" ? "default" : "secondary"}>
                      {selected.medAtivo === "A" ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditing((p) => !p)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />{editing ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Identificador</Label>
                    <Input value={selected.medId} readOnly className="mt-2 bg-muted/40 font-mono text-xs" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Input value={selected.medAtivo === "A" ? "Ativa" : "Inativa"} readOnly className="mt-2 bg-muted/40" />
                  </div>

                  <div>
                    <Label>Sigla</Label>
                    <Input
                      value={editing ? editData.sigla : selected.medSigla}
                      onChange={(e) => setEditData((p) => ({ ...p, sigla: e.target.value }))}
                      readOnly={!editing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={editing ? editData.descricao : selected.medDescricao}
                      onChange={(e) => setEditData((p) => ({ ...p, descricao: e.target.value }))}
                      readOnly={!editing}
                      className="mt-2"
                    />
                  </div>

                  {editing && (
                    <div className="sm:col-span-2 flex justify-end mt-4">
                      <Button onClick={updateMedida} disabled={submitting}>
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