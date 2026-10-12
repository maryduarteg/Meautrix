
"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Plus,
  Power,
  Package,
  Search,
  X,
  Pencil,
  Loader2,
  List,
  ShieldCheck,
  Tag,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Required } from "@/components/ui/required"
import { RequiredMessage } from "@/components/ui/requiredMessage"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRODUTO_API_URL = "http://localhost:5139/api/produto"
const CATEGORIA_API_URL = "http://localhost:5139/api/categoriaproduto"
const MEDIDA_API_URL = "http://localhost:5139/api/medida"
const FORNECEDOR_API_URL = "http://localhost:5139/api/fornecedor"

const SELECT_TRIGGER_NO_CLAMP =
  "h-auto min-h-9 whitespace-normal text-left [&>span]:line-clamp-none"

const INVALID_INPUT = "border-destructive ring-2 ring-destructive/20"

type FieldErrors = Partial<Record<string, string>>

function FieldError({ error }: { error?: string }) {
  if (!error) return null

  return <p className="mt-1 text-xs text-destructive">{error}</p>
}

export interface Produto {
  prodId: number
  prodDescricao: string
  prodQuantidadeMinima: number
  medidasMedId: number
  catProdId: number
  prodAtivo: string
  fornId: number
}

export interface Fornecedor {
  fornId: number
  fornRazaoSocial: string
  fornCnpj: string
  fornAtivo: string
}

export interface Categoria {
  catProdId: number
  catProdDescricao: string
  catProdAtivo: string
}

export interface Medida {
  medId: number
  medSigla: string
  medDescricao: string
  medAtivo: string
}

export default function CadastroPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [medidas, setMedidas] = useState<Medida[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)

  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")
  const [descricaoFilter, setDescricaoFilter] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("Todas")

  const [createErrors, setCreateErrors] = useState<FieldErrors>({})
  const [editErrors, setEditErrors] = useState<FieldErrors>({})

  // Formulário de edição
  const [editData, setEditData] = useState({
    descricao: "",
    catProdId: "",
    medidasMedId: "",
    quantidadeMinima: "",
    fornId: "",
  })

  // Formulário de criação
  const [novoProduto, setNovoProduto] = useState({
    descricao: "",
    catProdId: "",
    medidasMedId: "",
    quantidadeMinima: "",
    fornId: "",
  })

  const categoriasAtivas = useMemo(
    () => categorias.filter((c) => c.catProdAtivo === "A"),
    [categorias]
  )

  const medidasAtivas = useMemo(
    () => medidas.filter((m) => m.medAtivo === "A"),
    [medidas]
  )

  const fornecedoresAtivos = useMemo(
    () => fornecedores.filter((f) => f.fornAtivo === "A"),
    [fornecedores]
  )

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

  function validateProduto(data: typeof novoProduto): FieldErrors {
    const errors: FieldErrors = {}

    if (!data.descricao.trim()) {
      errors.descricao = "Informe a descrição do produto."
    } else if (data.descricao.trim().length > 90) {
      errors.descricao = "A descrição deve possuir no máximo 90 caracteres."
    }

    if (!data.catProdId) {
      errors.catProdId = "Selecione uma categoria."
    }

    if (!data.medidasMedId) {
      errors.medidasMedId = "Selecione uma medida."
    }

    if (!data.fornId) {
      errors.fornId = "Selecione um fornecedor."
    }

    if (data.quantidadeMinima.trim() === "") {
      errors.quantidadeMinima = "Informe a quantidade mínima."
    } else if (
      !Number.isFinite(Number(data.quantidadeMinima)) ||
      Number(data.quantidadeMinima) < 0
    ) {
      errors.quantidadeMinima =
        "A quantidade mínima deve ser um número maior ou igual a zero."
    }

    return errors
  }

  function validateCreate(): boolean {
    const errors = validateProduto(novoProduto)
    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateEdit(): boolean {
    const errors = validateProduto(editData)
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  function cancelCreate() {
    setShowCreateForm(false)
    setCreateErrors({})
    setNovoProduto({
      descricao: "",
      catProdId: "",
      medidasMedId: "",
      quantidadeMinima: "",
      fornId: "",
    })
  }

  function getCategoriaDescricao(id: number) {
    return categorias.find((c) => c.catProdId === id)?.catProdDescricao ?? "—"
  }

  function getMedidaSigla(id: number) {
    return medidas.find((m) => m.medId === id)?.medSigla ?? "—"
  }

  function getFornecedorRazaoSocial(id: number) {
    return fornecedores.find((f) => f.fornId === id)?.fornRazaoSocial ?? "—"
  }

  async function fetchProdutos() {
    try {
      const res = await fetch(PRODUTO_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar produtos.")

      const data: Produto[] = await res.json()
      setProdutos(data)

      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].prodId)
      }
    } catch (err) {
      toast.error("Erro ao carregar produtos.")
      console.error(err)
    }
  }

  async function fetchCategorias() {
    try {
      const res = await fetch(CATEGORIA_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar categorias.")

      const data: Categoria[] = await res.json()
      setCategorias(data)
    } catch (err) {
      toast.error("Erro ao carregar categorias.")
      console.error(err)
    }
  }

  async function fetchMedidas() {
    try {
      const res = await fetch(MEDIDA_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar medidas.")

      const data: Medida[] = await res.json()
      setMedidas(data)
    } catch (err) {
      toast.error("Erro ao carregar medidas.")
      console.error(err)
    }
  }

  async function fetchFornecedores() {
    try {
      const res = await fetch(FORNECEDOR_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar fornecedores.")

      const data: Fornecedor[] = await res.json()
      setFornecedores(data)
    } catch (err) {
      toast.error("Erro ao carregar fornecedores.")
      console.error(err)
    }
  }

  async function fetchAll() {
    setLoading(true)
    await Promise.all([
      fetchProdutos(),
      fetchCategorias(),
      fetchMedidas(),
      fetchFornecedores(),
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => {
    return produtos.find((p) => p.prodId === selectedId) || null
  }, [produtos, selectedId])

  useEffect(() => {
    if (selected) {
      setEditData({
        descricao: selected.prodDescricao,
        catProdId: String(selected.catProdId),
        medidasMedId: String(selected.medidasMedId),
        quantidadeMinima: String(selected.prodQuantidadeMinima),
        fornId: String(selected.fornId),
      })
    }
  }, [selected, editing])

  const filteredProdutos = useMemo(() => {
    return produtos.filter((p) => {
      const matchesDesc = p.prodDescricao
        .toLowerCase()
        .includes(descricaoFilter.toLowerCase())

      const matchesStatus =
        statusFilter === "Todos" || p.prodAtivo === statusFilter

      const matchesCategoria =
        categoriaFilter === "Todas" ||
        String(p.catProdId) === categoriaFilter

      return matchesDesc && matchesStatus && matchesCategoria
    })
  }, [produtos, statusFilter, descricaoFilter, categoriaFilter])

  const getInitials = (descricao: string) => {
    if (!descricao) return "P"
    return descricao.trim().substring(0, 2).toUpperCase()
  }

  // Atualizar produto
  async function updateProduto() {
    if (!selected) return
    if (!validateEdit()) return

    try {
      setSubmitting(true)

      const res = await fetch(`${PRODUTO_API_URL}/${selected.prodId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodDescricao: editData.descricao.trim(),
          prodQuantidadeMinima: Number(editData.quantidadeMinima),
          medidasMedId: Number(editData.medidasMedId),
          catProdId: Number(editData.catProdId),
          fornId: Number(editData.fornId),
          prodAtivo: selected.prodAtivo,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao atualizar produto.")
      }

      const updatedList = produtos.map((p) =>
        p.prodId === selected.prodId
          ? {
              ...p,
              prodDescricao: editData.descricao.trim(),
              prodQuantidadeMinima: Number(editData.quantidadeMinima),
              medidasMedId: Number(editData.medidasMedId),
              catProdId: Number(editData.catProdId),
              fornId: Number(editData.fornId),
            }
          : p
      )

      setProdutos(updatedList)
      setEditErrors({})
      setEditing(false)
      toast.success("Produto atualizado com sucesso!")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar produto."
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Inativar / ativar produto
  async function toggleProdutoStatus(id: number) {
    const produto = produtos.find((p) => p.prodId === id)
    if (!produto) return

    const newStatus = produto.prodAtivo === "A" ? "I" : "A"

    try {
      const res = await fetch(`${PRODUTO_API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prodAtivo: newStatus }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Não foi possível alterar o status.")
      }

      setProdutos((prev) =>
        prev.map((p) =>
          p.prodId === id ? { ...p, prodAtivo: newStatus } : p
        )
      )

      toast.success(
        `Produto ${newStatus === "A" ? "reativado" : "inativado"} com sucesso!`
      )
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status."
      )
    }
  }

  // Criar produto
  async function createProduto() {
    if (!validateCreate()) return

    try {
      setSubmitting(true)

      const res = await fetch(PRODUTO_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodDescricao: novoProduto.descricao.trim(),
          prodQuantidadeMinima: Number(novoProduto.quantidadeMinima),
          medidasMedId: Number(novoProduto.medidasMedId),
          catProdId: Number(novoProduto.catProdId),
          fornId: Number(novoProduto.fornId),
          prodAtivo: "A",
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao cadastrar produto.")
      }

      toast.success("Produto cadastrado com sucesso!")
      setCreateErrors({})
      setNovoProduto({
        descricao: "",
        catProdId: "",
        medidasMedId: "",
        quantidadeMinima: "",
        fornId: "",
      })
      setShowCreateForm(false)

      await fetchProdutos()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao cadastrar produto."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell
      title="Cadastro de Produtos"
      description="Cadastre, consulte e atualize os produtos utilizados nos procedimentos."
    >
      <div className="flex flex-col gap-6">
        {/* Indicadores */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{produtos.length}</p>
                <p className="text-xs text-muted-foreground">
                  Produtos cadastrados
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
                  {produtos.filter((p) => p.prodAtivo === "A").length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Produtos ativos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cadastro */}
        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />
                Cadastrar novo produto
              </CardTitle>
              <RequiredMessage />
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="prod-descricao">
                  Descrição do produto <Required />
                </Label>
                <Input
                  id="prod-descricao"
                  className={`mt-2 ${createErrors.descricao ? INVALID_INPUT : ""}`}
                  maxLength={90}
                  placeholder="Ex.: Ácido Hialurônico 1ml"
                  value={novoProduto.descricao}
                  onChange={(e) => {
                    setNovoProduto((p) => ({
                      ...p,
                      descricao: e.target.value,
                    }))
                    clearCreateError("descricao")
                  }}
                />
                <FieldError error={createErrors.descricao} />
              </div>

              <div>
                <Label>Categoria <Required /></Label>
                <Select
                  value={novoProduto.catProdId}
                  onValueChange={(v) => {
                    setNovoProduto((p) => ({ ...p, catProdId: v }))
                    clearCreateError("catProdId")
                  }}
                >
                  <SelectTrigger
                    className={`mt-2 ${SELECT_TRIGGER_NO_CLAMP} ${createErrors.catProdId ? INVALID_INPUT : ""}`}
                  >
                    <SelectValue placeholder="Selecione">
                      {novoProduto.catProdId
                        ? categoriasAtivas.find(
                            (c) =>
                              String(c.catProdId) === novoProduto.catProdId
                          )?.catProdDescricao
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasAtivas.map((c) => (
                      <SelectItem
                        key={c.catProdId}
                        value={String(c.catProdId)}
                      >
                        {c.catProdDescricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={createErrors.catProdId} />
              </div>

              <div>
                <Label>Medida <Required /></Label>
                <Select
                  value={novoProduto.medidasMedId}
                  onValueChange={(v) => {
                    setNovoProduto((p) => ({ ...p, medidasMedId: v }))
                    clearCreateError("medidasMedId")
                  }}
                >
                  <SelectTrigger
                    className={`mt-2 ${SELECT_TRIGGER_NO_CLAMP} ${createErrors.medidasMedId ? INVALID_INPUT : ""}`}
                  >
                    <SelectValue placeholder="Selecione">
                      {novoProduto.medidasMedId
                        ? medidasAtivas.find(
                            (m) => String(m.medId) === novoProduto.medidasMedId
                          )?.medSigla
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {medidasAtivas.map((m) => (
                      <SelectItem key={m.medId} value={String(m.medId)}>
                        {m.medSigla} — {m.medDescricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={createErrors.medidasMedId} />
              </div>

              <div>
                <Label>Fornecedor <Required /></Label>
                <Select
                  value={novoProduto.fornId}
                  onValueChange={(v) => {
                    setNovoProduto((p) => ({ ...p, fornId: v }))
                    clearCreateError("fornId")
                  }}
                >
                  <SelectTrigger
                    className={`mt-2 ${SELECT_TRIGGER_NO_CLAMP} ${createErrors.fornId ? INVALID_INPUT : ""}`}
                  >
                    <SelectValue placeholder="Selecione">
                      {novoProduto.fornId
                        ? fornecedoresAtivos.find(
                            (f) => String(f.fornId) === novoProduto.fornId
                          )?.fornRazaoSocial
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedoresAtivos.map((f) => (
                      <SelectItem key={f.fornId} value={String(f.fornId)}>
                        {f.fornRazaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={createErrors.fornId} />
              </div>

              <div>
                <Label htmlFor="prod-qtd-min">
                  Quantidade mínima (Alerta) <Required />
                </Label>
                <Input
                  id="prod-qtd-min"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-2 ${createErrors.quantidadeMinima ? INVALID_INPUT : ""}`}
                  placeholder="Ex.: 5"
                  value={novoProduto.quantidadeMinima}
                  onChange={(e) => {
                    setNovoProduto((p) => ({
                      ...p,
                      quantidadeMinima: e.target.value,
                    }))
                    clearCreateError("quantidadeMinima")
                  }}
                />
                <FieldError error={createErrors.quantidadeMinima} />
              </div>

              <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
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
                  onClick={createProduto}
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cadastrar produto
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Label htmlFor="prod-desc-filter">Descrição</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prod-desc-filter"
                  value={descricaoFilter}
                  onChange={(e) => setDescricaoFilter(e.target.value)}
                  placeholder="Buscar por descrição..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1">
              <Label htmlFor="prod-cat-filter">Categoria</Label>
              <Select
                value={categoriaFilter}
                onValueChange={setCategoriaFilter}
              >
                <SelectTrigger
                  id="prod-cat-filter"
                  className={`mt-2 ${SELECT_TRIGGER_NO_CLAMP}`}
                >
                  <SelectValue placeholder="Selecione">
                    {categoriaFilter === "Todas"
                      ? "Todas"
                      : getCategoriaDescricao(Number(categoriaFilter))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem
                      key={c.catProdId}
                      value={String(c.catProdId)}
                    >
                      {c.catProdDescricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="flex rounded-lg bg-muted p-1"
              role="group"
              aria-label="Filtrar produtos por status"
            >
              {statusFilter !== "Todos" ||
              descricaoFilter ||
              categoriaFilter !== "Todas" ? (
                <button
                  type="button"
                  onClick={() => {
                    setDescricaoFilter("")
                    setStatusFilter("Todos")
                    setCategoriaFilter("Todas")
                  }}
                  className="mr-1 rounded-md px-2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar filtros"
                >
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

            <Button
              onClick={() => {
                setCreateErrors({})
                setNovoProduto({
                  descricao: "",
                  catProdId: "",
                  medidasMedId: "",
                  quantidadeMinima: "",
                  fornId: "",
                })
                setShowCreateForm(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo produto
            </Button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          {/* Lista */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4 text-primary" />
                Produtos cadastrados
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProdutos.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Nenhum produto encontrado.
                </p>
              ) : (
                filteredProdutos.map((p) => (
                  <div
                    key={p.prodId}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedId(p.prodId)
                      setEditing(false)
                      setEditErrors({})
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selected?.prodId === p.prodId
                        ? "border-primary bg-secondary/70"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(p.prodDescricao)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.prodDescricao}
                      </p>
                    </div>

                    <Badge
                      variant={p.prodAtivo === "A" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {p.prodAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleProdutoStatus(p.prodId)
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
                      <Tag className="h-4 w-4 text-primary" />
                      Dados do produto
                    </CardTitle>
                    {editing ? <RequiredMessage /> : ""}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={selected.prodAtivo === "A" ? "default" : "secondary"}
                    >
                      {selected.prodAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editing && selected) {
                          setEditData({
                            descricao: selected.prodDescricao,
                            catProdId: String(selected.catProdId),
                            medidasMedId: String(selected.medidasMedId),
                            quantidadeMinima: String(selected.prodQuantidadeMinima),
                            fornId: String(selected.fornId),
                          })
                        }

                        setEditErrors({})
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
                    <Label>Identificador</Label>
                    <Input
                      value={selected.prodId}
                      readOnly
                      className="mt-2 bg-muted/40 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Input
                      value={selected.prodAtivo === "A" ? "Ativo" : "Inativo"}
                      readOnly
                      className="mt-2 bg-muted/40"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>
                      Descrição {editing ? <Required /> : ""}
                    </Label>
                    <Input
                      value={editing ? editData.descricao : selected.prodDescricao}
                      onChange={(e) => {
                        setEditData((p) => ({
                          ...p,
                          descricao: e.target.value,
                        }))
                        clearEditError("descricao")
                      }}
                      readOnly={!editing}
                      maxLength={90}
                      className={`mt-2 ${editing && editErrors.descricao ? INVALID_INPUT : ""}`}
                    />
                    {editing && <FieldError error={editErrors.descricao} />}
                  </div>

                  <div>
                    <Label>
                      Categoria {editing ? <Required /> : ""}
                    </Label>
                    {editing ? (
                      <>
                        <Select
                          value={editData.catProdId}
                          onValueChange={(v) => {
                            setEditData((p) => ({ ...p, catProdId: v }))
                            clearEditError("catProdId")
                          }}
                        >
                          <SelectTrigger
                            className={`mt-2 ${SELECT_TRIGGER_NO_CLAMP} ${editErrors.catProdId ? INVALID_INPUT : ""}`}
                          >
                            <SelectValue placeholder="Selecione">
                              {editData.catProdId
                                ? categoriasAtivas.find(
                                    (c) =>
                                      String(c.catProdId) === editData.catProdId
                                  )?.catProdDescricao
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categoriasAtivas.map((c) => (
                              <SelectItem
                                key={c.catProdId}
                                value={String(c.catProdId)}
                              >
                                {c.catProdDescricao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError error={editErrors.catProdId} />
                      </>
                    ) : (
                      <Input
                        value={getCategoriaDescricao(selected.catProdId)}
                        readOnly
                        className="mt-2 bg-muted/40"
                      />
                    )}
                  </div>

                  <div>
                    <Label>
                      Medida {editing ? <Required /> : ""}
                    </Label>
                    {editing ? (
                      <>
                        <Select
                          value={editData.medidasMedId}
                          onValueChange={(v) => {
                            setEditData((p) => ({ ...p, medidasMedId: v }))
                            clearEditError("medidasMedId")
                          }}
                        >
                          <SelectTrigger
                            className={`mt-2 ${SELECT_TRIGGER_NO_CLAMP} ${editErrors.medidasMedId ? INVALID_INPUT : ""}`}
                          >
                            <SelectValue placeholder="Selecione">
                              {editData.medidasMedId
                                ? medidasAtivas.find(
                                    (m) =>
                                      String(m.medId) === editData.medidasMedId
                                  )?.medSigla
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {medidasAtivas.map((m) => (
                              <SelectItem
                                key={m.medId}
                                value={String(m.medId)}
                              >
                                {m.medSigla} — {m.medDescricao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError error={editErrors.medidasMedId} />
                      </>
                    ) : (
                      <Input
                        value={getMedidaSigla(selected.medidasMedId)}
                        readOnly
                        className="mt-2 bg-muted/40"
                      />
                    )}
                  </div>

                  <div>
                    <Label>
                      Fornecedor {editing ? <Required /> : ""}
                    </Label>
                    {editing ? (
                      <>
                        <Select
                          value={editData.fornId}
                          onValueChange={(v) => {
                            setEditData((p) => ({ ...p, fornId: v }))
                            clearEditError("fornId")
                          }}
                        >
                          <SelectTrigger
                            className={`mt-2 ${SELECT_TRIGGER_NO_CLAMP} ${editErrors.fornId ? INVALID_INPUT : ""}`}
                          >
                            <SelectValue placeholder="Selecione">
                              {editData.fornId
                                ? fornecedoresAtivos.find(
                                    (f) =>
                                      String(f.fornId) === editData.fornId
                                  )?.fornRazaoSocial
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {fornecedoresAtivos.map((f) => (
                              <SelectItem
                                key={f.fornId}
                                value={String(f.fornId)}
                              >
                                {f.fornRazaoSocial}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError error={editErrors.fornId} />
                      </>
                    ) : (
                      <Input
                        value={getFornecedorRazaoSocial(selected.fornId)}
                        readOnly
                        className="mt-2 bg-muted/40"
                      />
                    )}
                  </div>

                  <div>
                    <Label>
                      Quantidade mínima (Alerta) {editing ? <Required /> : ""}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editing
                          ? editData.quantidadeMinima
                          : selected.prodQuantidadeMinima
                      }
                      onChange={(e) => {
                        setEditData((p) => ({
                          ...p,
                          quantidadeMinima: e.target.value,
                        }))
                        clearEditError("quantidadeMinima")
                      }}
                      readOnly={!editing}
                      className={`mt-2 ${editing && editErrors.quantidadeMinima ? INVALID_INPUT : ""}`}
                    />
                    {editing && (
                      <FieldError error={editErrors.quantidadeMinima} />
                    )}
                  </div>

                  {editing && (
                    <div className="mt-4 flex justify-end sm:col-span-2">
                      <Button onClick={updateProduto} disabled={submitting}>
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