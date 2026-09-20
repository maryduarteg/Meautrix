"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Power, Truck, Search, X, Pencil, Loader2, List, ShieldCheck, Building2 } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const FORNECEDOR_API_URL = "http://localhost:5139/api/fornecedor"

export interface Fornecedor {
  fornId: number
  fornRazaoSocial: string
  fornCnpj: string
  fornAtivo: string // 'A' (Ativo) ou 'I' (Inativo)
}

// Aplica a máscara 00.000.000/0000-00 enquanto o usuário digita
function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function isValidCnpj(value: string) {
  return value.replace(/\D/g, "").length === 14
}

export default function CadastroFornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)

  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")
  const [razaoSocialFilter, setRazaoSocialFilter] = useState("")

  // Form de edição
  const [editData, setEditData] = useState({
    razaoSocial: "",
    cnpj: "",
  })

  // Form de criação
  const [novoFornecedor, setNovoFornecedor] = useState({
    razaoSocial: "",
    cnpj: "",
  })

  async function fetchFornecedores() {
    try {
      const res = await fetch(FORNECEDOR_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar fornecedores.")
      const data: Fornecedor[] = await res.json()
      setFornecedores(data)
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].fornId)
      }
    } catch (err) {
      toast.error("Erro ao carregar fornecedores.")
      console.error(err)
    }
  }

  async function fetchAll() {
    setLoading(true)
    await fetchFornecedores()
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => {
    return fornecedores.find((f) => f.fornId === selectedId) || null
  }, [fornecedores, selectedId])

  // Preenche o formulário de edição ao selecionar/editar fornecedor
  useEffect(() => {
    if (selected) {
      setEditData({
        razaoSocial: selected.fornRazaoSocial,
        cnpj: selected.fornCnpj,
      })
    }
  }, [selected, editing])

  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter((f) => {
      const matchesRazaoSocial = f.fornRazaoSocial.toLowerCase().includes(razaoSocialFilter.toLowerCase())
      const matchesStatus = statusFilter === "Todos" || f.fornAtivo === statusFilter
      return matchesRazaoSocial && matchesStatus
    })
  }, [fornecedores, statusFilter, razaoSocialFilter])

  const getInitials = (razaoSocial: string) => {
    if (!razaoSocial) return "FO"
    return razaoSocial.trim().substring(0, 2).toUpperCase()
  }

  // Alterar fornecedor (PUT /api/fornecedor/{id})
  async function updateFornecedor() {
    if (!selected) return
    if (!editData.razaoSocial.trim() || !editData.cnpj.trim()) {
      return toast.error("Razão social e CNPJ são obrigatórios.")
    }
    if (editData.razaoSocial.length > 120) {
      return toast.error("A razão social deve possuir no máximo 120 caracteres.")
    }
    if (!isValidCnpj(editData.cnpj)) {
      return toast.error("Informe um CNPJ válido.")
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${FORNECEDOR_API_URL}/${selected.fornId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornRazaoSocial: editData.razaoSocial.trim(),
          fornCnpj: editData.cnpj.replace(/\D/g, ""),
          fornAtivo: selected.fornAtivo,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao atualizar fornecedor.")
      }

      const updatedList = fornecedores.map((f) =>
        f.fornId === selected.fornId
          ? {
              ...f,
              fornRazaoSocial: editData.razaoSocial.trim(),
              fornCnpj: editData.cnpj.replace(/\D/g, ""),
            }
          : f
      )
      setFornecedores(updatedList)

      toast.success("Fornecedor atualizado com sucesso!")
      setEditing(false)
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar fornecedor.")
    } finally {
      setSubmitting(false)
    }
  }

  // Inativar / Ativar (PATCH /api/fornecedor/{id})
  async function toggleFornecedorStatus(id: number) {
    const fornecedor = fornecedores.find((f) => f.fornId === id)
    if (!fornecedor) return

    const newStatus = fornecedor.fornAtivo === "A" ? "I" : "A"

    try {
      const res = await fetch(`${FORNECEDOR_API_URL}/${id}`, {
        method: "patch",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fornAtivo: newStatus }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Não foi possível alterar o status.")
      }

      const updatedList = fornecedores.map((f) => (f.fornId === id ? { ...f, fornAtivo: newStatus } : f))
      setFornecedores(updatedList)
      toast.success(`Fornecedor ${newStatus === "A" ? "reativado" : "inativado"} com sucesso!`)
    } catch (err: any) {
      toast.error(err.message || "Não foi possível alterar o status.")
    }
  }

  // Criar fornecedor (POST /api/fornecedor)
  async function createFornecedor() {
    if (!novoFornecedor.razaoSocial.trim() || !novoFornecedor.cnpj.trim()) {
      return toast.error("Preencha razão social e CNPJ do fornecedor.")
    }
    if (novoFornecedor.razaoSocial.length > 120) {
      return toast.error("A razão social deve possuir no máximo 120 caracteres.")
    }
    if (!isValidCnpj(novoFornecedor.cnpj)) {
      return toast.error("Informe um CNPJ válido.")
    }

    try {
      setSubmitting(true)
      const res = await fetch(FORNECEDOR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornRazaoSocial: novoFornecedor.razaoSocial.trim(),
          fornCnpj: novoFornecedor.cnpj.replace(/\D/g, ""),
          fornAtivo: "A",
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao cadastrar fornecedor.")
      }

      toast.success("Fornecedor cadastrado com sucesso!")
      setNovoFornecedor({ razaoSocial: "", cnpj: "" })
      setShowCreateForm(false)
      await fetchFornecedores() // recarrega para pegar o novo fornId gerado pelo banco
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar fornecedor.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell title="Cadastro de Fornecedores" description="Cadastre, consulte e atualize os fornecedores utilizados nas compras.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{fornecedores.length}</p>
                <p className="text-xs text-muted-foreground">Fornecedores cadastrados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{fornecedores.filter((f) => f.fornAtivo === "A").length}</p>
                <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />Cadastrar novo fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="forn-razao-social">Razão social</Label>
                <Input
                  id="forn-razao-social"
                  className="mt-2"
                  maxLength={120}
                  placeholder="Ex.: Distribuidora ABC Ltda"
                  value={novoFornecedor.razaoSocial}
                  onChange={(e) => setNovoFornecedor((p) => ({ ...p, razaoSocial: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="forn-cnpj">CNPJ</Label>
                <Input
                  id="forn-cnpj"
                  className="mt-2"
                  maxLength={18}
                  placeholder="00.000.000/0000-00"
                  value={novoFornecedor.cnpj}
                  onChange={(e) => setNovoFornecedor((p) => ({ ...p, cnpj: formatCnpj(e.target.value) }))}
                />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2 mt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={submitting}>Cancelar</Button>
                <Button type="button" onClick={createFornecedor} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar fornecedor
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Label htmlFor="forn-razao-filter">Razão social</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="forn-razao-filter" value={razaoSocialFilter} onChange={(e) => setRazaoSocialFilter(e.target.value)} placeholder="Buscar por razão social..." className="pl-9" />
              </div>
            </div>

            <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Filtrar fornecedores por status">
              {statusFilter !== "Todos" || razaoSocialFilter ? (
                <button type="button" onClick={() => { setRazaoSocialFilter(""); setStatusFilter("Todos") }} className="mr-1 rounded-md px-2 text-muted-foreground hover:text-foreground" aria-label="Limpar filtros">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              {[
                { label: "Todos", value: "Todos" },
                { label: "Ativos", value: "A" },
                { label: "Inativos", value: "I" },
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
              <Plus className="mr-2 h-4 w-4" />Novo fornecedor
            </Button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4 text-primary" />Fornecedores cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFornecedores.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Nenhum fornecedor encontrado.</p>
              ) : (
                filteredFornecedores.map((f) => (
                  <div
                    key={f.fornId}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedId(f.fornId); setEditing(false); }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${selected?.fornId === f.fornId ? "border-primary bg-secondary/70" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(f.fornRazaoSocial)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.fornRazaoSocial}</p>
                    </div>
                    <Badge variant={f.fornAtivo === "A" ? "default" : "secondary"} className="text-[10px]">
                      {f.fornAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); toggleFornecedorStatus(f.fornId) }}>
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
                    <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-primary" />Dados do fornecedor</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selected.fornAtivo === "A" ? "default" : "secondary"}>
                      {selected.fornAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditing((p) => !p)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />{editing ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Identificador</Label>
                    <Input value={selected.fornId} readOnly className="mt-2 bg-muted/40 font-mono text-xs" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Input value={selected.fornAtivo === "A" ? "Ativo" : "Inativo"} readOnly className="mt-2 bg-muted/40" />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Razão social</Label>
                    <Input
                      value={editing ? editData.razaoSocial : selected.fornRazaoSocial}
                      onChange={(e) => setEditData((p) => ({ ...p, razaoSocial: e.target.value }))}
                      readOnly={!editing}
                      maxLength={120}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      value={editing ? editData.cnpj : formatCnpj(selected.fornCnpj)}
                      onChange={(e) => setEditData((p) => ({ ...p, cnpj: formatCnpj(e.target.value) }))}
                      readOnly={!editing}
                      maxLength={18}
                      className="mt-2"
                    />
                  </div>

                  {editing && (
                    <div className="sm:col-span-2 flex justify-end mt-4">
                      <Button onClick={updateFornecedor} disabled={submitting}>
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
