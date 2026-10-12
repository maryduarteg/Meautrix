
"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"

import {
  Pencil,
  ShieldCheck,
  UserRound,
  Users,
  UserPlus,
  Power,
  Loader2,
} from "lucide-react"

import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Required } from "@/components/ui/required"
import { RequiredMessage } from "@/components/ui/requiredMessage"

export interface Procedimento {
  procId: number
  procNome: string
  procDescricao: string
  procAtivo: string
}

const INVALID_INPUT = "border-destructive ring-2 ring-destructive/20"

type FieldErrors = Partial<Record<string, string>>

function FieldError({ error }: { error?: string }) {
  if (!error) return null

  return (
    <p className="mt-1 text-xs text-destructive">
      {error}
    </p>
  )
}

export default function ProcedimentoPage() {
  const { movements } = useStore()

  const API_URL = "http://localhost:5139/api/procedimento"

  const [procedimentoList, setProcedimentoList] = useState<Procedimento[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")

  const [createErrors, setCreateErrors] = useState<FieldErrors>({})
  const [editErrors, setEditErrors] = useState<FieldErrors>({})

  // Formulário de edição
  const [editData, setEditData] = useState({
    procNome: "",
    procDescricao: "",
    procAtivo: "A",
  })

  // Formulário de criação
  const [newProcedimento, setNewProcedimento] = useState({
    procNome: "",
    procDescricao: "",
  })

  // Limpar erros individuais
  function clearCreateError(field: string) {
    setCreateErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function clearEditError(field: string) {
    setEditErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  // Validar cadastro
  function validateCreate(): boolean {
    const errors: FieldErrors = {}

    if (!newProcedimento.procNome.trim()) {
      errors.procNome = "Informe o nome do procedimento."
    }

    if (!newProcedimento.procDescricao.trim()) {
      errors.procDescricao = "Informe a descrição do procedimento."
    }

    setCreateErrors(errors)

    return Object.keys(errors).length === 0
  }

  // Validar edição
  function validateEdit(): boolean {
    const errors: FieldErrors = {}

    if (!editData.procNome.trim()) {
      errors.procNome = "Informe o nome do procedimento."
    }

    if (!editData.procDescricao.trim()) {
      errors.procDescricao = "Informe a descrição do procedimento."
    }

    setEditErrors(errors)

    return Object.keys(errors).length === 0
  }

  // Cancelar cadastro e limpar formulário
  function cancelCreate() {
    setShowCreateForm(false)
    setCreateErrors({})
    setNewProcedimento({
      procNome: "",
      procDescricao: "",
    })
  }

  // Carregar procedimentos
  const fetchProcedimentos = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error("Falha ao carregar procedimentos.")
      }

      const rawData = await response.json()

      const normalizedData: Procedimento[] = rawData.map((p: any) => ({
        procId: p.procId,
        procNome: p.procNome ?? "",
        procDescricao: p.procDescricao ?? "",
        procAtivo: String(p.procAtivo ?? "A").toUpperCase(),
      }))

      setProcedimentoList(normalizedData)

      if (normalizedData.length > 0 && selectedId === null) {
        setSelectedId(normalizedData[0].procId)
      }
    } catch {
      toast.error("Não foi possível conectar com a API de procedimentos.")
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    fetchProcedimentos()
  }, [fetchProcedimentos])

  // Procedimento selecionado
  const selected = useMemo(() => {
    return (
      procedimentoList.find((p) => p.procId === selectedId) ||
      procedimentoList[0] ||
      null
    )
  }, [procedimentoList, selectedId])

  // Preencher formulário de edição
  useEffect(() => {
    if (selected) {
      setEditData({
        procNome: selected.procNome,
        procDescricao: selected.procDescricao,
        procAtivo: selected.procAtivo,
      })
    }
  }, [selected, editing])

  // Mantido conforme a estrutura original
  const procMovements = useMemo(() => {
    if (!selected?.procNome) return []

    return movements.filter((item) =>
      item.professional
        ? item.professional.toLowerCase().includes(selected.procNome.toLowerCase())
        : false
    )
  }, [movements, selected])

  // Obter mensagem de erro da API
  async function getApiError(response: Response, fallback: string) {
    const body = await response.json().catch(() => null)
    return body?.mensagem ?? fallback
  }

  // Filtrar procedimentos por status
  const filteredProcedimentos = useMemo(() => {
    if (statusFilter === "Todos") return procedimentoList

    return procedimentoList.filter((p) => p.procAtivo === statusFilter)
  }, [procedimentoList, statusFilter])

  // Obter iniciais
  const getInitials = (nome: string) => {
    if (!nome) return "P"

    return nome
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  // Atualizar procedimento
  async function updateProcedimento() {
    if (!selected) return
    if (!validateEdit()) return

    try {
      setSubmitting(true)

      const payload = {
        procId: selected.procId,
        procNome: editData.procNome.trim(),
        procDescricao: editData.procDescricao.trim(),
        procAtivo: editData.procAtivo || selected.procAtivo || "A",
      }

      const response = await fetch(`${API_URL}/${selected.procId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await getApiError(response, "Erro ao atualizar procedimento.")
        )
      }

      toast.success("Procedimento atualizado com sucesso!")

      setEditing(false)
      setEditErrors({})

      await fetchProcedimentos()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar procedimento."
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Inativar ou ativar procedimento
  async function toggleProcedimentoStatus(procId: number) {
    const proc = procedimentoList.find((p) => p.procId === procId)

    if (!proc) return

    try {
      if (proc.procAtivo === "A") {
        const response = await fetch(`${API_URL}/${procId}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error()
      } else {
        const response = await fetch(`${API_URL}/${procId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...proc,
            procAtivo: "A",
          }),
        })

        if (!response.ok) throw new Error()
      }

      toast.success("Status alterado com sucesso!")
      await fetchProcedimentos()
    } catch {
      toast.error("Não foi possível alterar o status.")
    }
  }

  // Cadastrar procedimento
  async function createProcedimento() {
    if (!validateCreate()) return

    try {
      setSubmitting(true)

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procNome: newProcedimento.procNome.trim(),
          procDescricao: newProcedimento.procDescricao.trim(),
          procAtivo: "A",
        }),
      })

      if (!response.ok) {
        throw new Error(
          await getApiError(response, "Erro ao cadastrar procedimento.")
        )
      }

      toast.success("Procedimento cadastrado com sucesso!")

      setCreateErrors({})
      setNewProcedimento({
        procNome: "",
        procDescricao: "",
      })
      setShowCreateForm(false)

      await fetchProcedimentos()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar procedimento."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell
      title="Gerenciar Procedimentos"
      description="Cadastre, consulte e atualize os procedimentos oferecidos."
    >
      <div className="flex flex-col gap-6">
        {/* Indicadores */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <p className="text-2xl font-semibold">
                  {procedimentoList.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Procedimentos cadastrados
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-2xl font-semibold">
                  {procedimentoList.filter((p) => p.procAtivo === "A").length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Procedimentos ativos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de cadastro */}
        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4 text-primary" />
                Cadastrar novo procedimento
              </CardTitle>

              <RequiredMessage />
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="procedimento-nome">
                  Nome <Required />
                </Label>

                <Input
                  id="procedimento-nome"
                  className={`mt-2 ${createErrors.procNome ? INVALID_INPUT : ""}`}
                  placeholder="Ex.: Design de sobrancelhas"
                  value={newProcedimento.procNome}
                  onChange={(e) => {
                    setNewProcedimento((p) => ({
                      ...p,
                      procNome: e.target.value,
                    }))
                    clearCreateError("procNome")
                  }}
                />

                <FieldError error={createErrors.procNome} />
              </div>

              <div>
                <Label htmlFor="procedimento-descricao">
                  Descrição <Required />
                </Label>

                <Input
                  id="procedimento-descricao"
                  className={`mt-2 ${createErrors.procDescricao ? INVALID_INPUT : ""}`}
                  placeholder="Descrição do procedimento"
                  value={newProcedimento.procDescricao}
                  onChange={(e) => {
                    setNewProcedimento((p) => ({
                      ...p,
                      procDescricao: e.target.value,
                    }))
                    clearCreateError("procDescricao")
                  }}
                />

                <FieldError error={createErrors.procDescricao} />
              </div>

              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelCreate}
                  disabled={submitting}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={createProcedimento}
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cadastrar procedimento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setCreateErrors({})
                setNewProcedimento({
                  procNome: "",
                  procDescricao: "",
                })
                setShowCreateForm(true)
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar procedimento
            </Button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          {/* Lista de procedimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Procedimentos cadastrados
              </CardTitle>

              <div className="mt-4 flex rounded-lg bg-muted p-1">
                {[
                  { label: "Todos", value: "Todos" },
                  { label: "Ativo", value: "A" },
                  { label: "Inativo", value: "I" },
                ].map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(st.value as "Todos" | "A" | "I")
                    }
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === st.value
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2">
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredProcedimentos.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Nenhum procedimento encontrado.
                </p>
              ) : (
                filteredProcedimentos.map((p) => (
                  <div
                    key={p.procId}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedId(p.procId)
                      setEditing(false)
                      setEditErrors({})
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selected?.procId === p.procId
                        ? "border-primary bg-secondary/70"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(p.procNome)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.procNome}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.procDescricao}
                      </p>
                    </div>

                    <Badge
                      variant={p.procAtivo === "A" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {p.procAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleProcedimentoStatus(p.procId)
                      }}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Detalhes e edição */}
          {selected && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserRound className="h-4 w-4 text-primary" />
                      Dados do procedimento
                    </CardTitle>

                    {editing ? <RequiredMessage /> : ""}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={selected.procAtivo === "A" ? "default" : "secondary"}
                    >
                      {selected.procAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editing) {
                          setEditData({
                            procNome: selected.procNome,
                            procDescricao: selected.procDescricao,
                            procAtivo: selected.procAtivo,
                          })
                          setEditErrors({})
                        } else {
                          setEditErrors({})
                        }

                        setEditing((p) => !p)
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      {editing ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>ID do procedimento</Label>
                    <Input
                      value={selected.procId}
                      readOnly
                      className="mt-2 bg-muted/40 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label>
                      Nome {editing ? <Required /> : ""}
                    </Label>

                    <Input
                      value={editing ? editData.procNome : selected.procNome}
                      onChange={(e) => {
                        setEditData((p) => ({
                          ...p,
                          procNome: e.target.value,
                        }))
                        clearEditError("procNome")
                      }}
                      readOnly={!editing}
                      className={`mt-2 ${
                        editing && editErrors.procNome ? INVALID_INPUT : ""
                      }`}
                    />

                    {editing && (
                      <FieldError error={editErrors.procNome} />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label>
                      Descrição {editing ? <Required /> : ""}
                    </Label>

                    <Input
                      value={
                        editing
                          ? editData.procDescricao
                          : selected.procDescricao
                      }
                      onChange={(e) => {
                        setEditData((p) => ({
                          ...p,
                          procDescricao: e.target.value,
                        }))
                        clearEditError("procDescricao")
                      }}
                      readOnly={!editing}
                      className={`mt-2 ${
                        editing && editErrors.procDescricao
                          ? INVALID_INPUT
                          : ""
                      }`}
                    />

                    {editing && (
                      <FieldError error={editErrors.procDescricao} />
                    )}
                  </div>

                  <div>
                    <Label>Status</Label>

                    {editing ? (
                      <select
                        disabled={true}
                        className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={editData.procAtivo}
                        onChange={(e) =>
                          setEditData((p) => ({
                            ...p,
                            procAtivo: e.target.value,
                          }))
                        }
                      >
                        <option value="A">Ativo</option>
                        <option value="I">Inativo</option>
                      </select>
                    ) : (
                      <Input
                        value={selected.procAtivo === "A" ? "Ativo" : "Inativo"}
                        readOnly
                        className="mt-2 bg-muted/40"
                      />
                    )}
                  </div>

                  {editing && (
                    <div className="flex justify-end sm:col-span-2">
                      <Button
                        onClick={updateProcedimento}
                        disabled={submitting}
                      >
                        {submitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvar alterações
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