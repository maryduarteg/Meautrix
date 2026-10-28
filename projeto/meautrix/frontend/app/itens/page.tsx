
"use client"

import { useEffect, useMemo, useState, type ComponentProps } from "react"
import { toast } from "sonner"
import {
  Plus,
  Power,
  Boxes,
  Search,
  X,
  Pencil,
  Loader2,
  List,
  ShieldCheck,
  CalendarClock,
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

const ITEM_API_URL = "http://localhost:5139/api/item"
const PRODUTO_API_URL = "http://localhost:5139/api/produto"

const INVALID_INPUT = "border-destructive ring-2 ring-destructive/20"

const SELECT_TRIGGER_NO_CLAMP =
  "h-auto min-h-9 whitespace-normal text-left [&>span]:line-clamp-none"

export interface Item {
  iteId: number
  iteNome: string
  prodId: number
  iteAtivo: string
  iteQuantidadeAtual: number
  iteLoteNome: string
  iteLoteDataAquisicao: string
  iteLoteDataVencimento: string
}

export interface Produto {
  prodId: number
  prodDescricao: string
  prodAtivo: string
}

function ProdutoSelectTrigger({
  produtos,
  className,
  children,
  ...props
}: ComponentProps<typeof SelectTrigger> & { produtos: string[] }) {
  return (
    <span className="mt-2 inline-grid max-w-full min-w-36 grid-cols-[minmax(0,1fr)] align-top">
      <span
        aria-hidden="true"
        className="pointer-events-none invisible col-start-1 row-start-1 grid min-w-0 overflow-hidden text-sm"
      >
        {["Selecione", ...produtos].map((descricao, index) => (
          <span
            key={index}
            className="col-start-1 row-start-1 border pl-2.5 pr-8 whitespace-nowrap"
          >
            {descricao}
          </span>
        ))}
      </span>
      <SelectTrigger
        className={`col-start-1 row-start-1 w-full min-w-0 ${SELECT_TRIGGER_NO_CLAMP} ${className ?? ""}`}
        {...props}
      >
        {children}
      </SelectTrigger>
    </span>
  )
}

type FieldErrors = Partial<Record<string, string>>

function FieldError({ error }: { error?: string }) {
  if (!error) return null

  return <p className="mt-1 text-xs text-destructive">{error}</p>
}

type ItemFormData = {
  nome: string
  prodId: string
  quantidadeAtual: string
  loteNome: string
  loteDataAquisicao: string
  loteDataVencimento: string
}

const EMPTY_ITEM: ItemFormData = {
  nome: "",
  prodId: "",
  quantidadeAtual: "",
  loteNome: "",
  loteDataAquisicao: "",
  loteDataVencimento: "",
}

function validateItem(data: ItemFormData): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.nome.trim()) {
    errors.nome = "Informe o nome do item."
  }

  if (!data.prodId) {
    errors.prodId = "Selecione um produto."
  }

  if (!data.loteNome.trim()) {
    errors.loteNome = "Informe o nome do lote."
  }

  if (data.quantidadeAtual.trim() === "") {
    errors.quantidadeAtual = "Informe a quantidade atual."
  } else if (
    !Number.isFinite(Number(data.quantidadeAtual)) ||
    Number(data.quantidadeAtual) < 0
  ) {
    errors.quantidadeAtual = "Informe uma quantidade válida, maior ou igual a zero."
  }


  if (!data.loteDataAquisicao) {
    errors.loteDataAquisicao = "Informe a data de aquisição."
  }

  if (!data.loteDataVencimento) {
    errors.loteDataVencimento = "Informe a data de vencimento."
  }

  if (
    data.loteDataAquisicao &&
    data.loteDataVencimento &&
    !errors.loteDataAquisicao &&
    !errors.loteDataVencimento
  ) {
    const dataAquisicao = new Date(`${data.loteDataAquisicao}T00:00:00`)
    const dataVencimento = new Date(`${data.loteDataVencimento}T00:00:00`)

    if (dataVencimento.getTime() <= dataAquisicao.getTime()) {
      errors.loteDataVencimento =
        "A data de vencimento deve ser posterior à data de aquisição."
    }
  }

  return errors
}

export default function CadastroItemPage() {
  const [itens, setItens] = useState<Item[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)

  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")
  const [nomeFilter, setNomeFilter] = useState("")
  const [produtoFilter, setProdutoFilter] = useState("Todos")

  const [createErrors, setCreateErrors] = useState<FieldErrors>({})
  const [editErrors, setEditErrors] = useState<FieldErrors>({})

  const [editData, setEditData] = useState<ItemFormData>({ ...EMPTY_ITEM })
  const [novoItem, setNovoItem] = useState<ItemFormData>({ ...EMPTY_ITEM })

  const produtosAtivos = useMemo(
    () => produtos.filter((p) => p.prodAtivo === "A"),
    [produtos]
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

  function closeCreateForm() {
    setShowCreateForm(false)
    setNovoItem({ ...EMPTY_ITEM })
    setCreateErrors({})
  }

  function getProdutoDescricao(id: number) {
    return produtos.find((p) => p.prodId === id)?.prodDescricao ?? "—"
  }

  function formatDate(iso: string) {
    if (!iso) return "—"

    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"

    return d.toLocaleDateString("pt-BR")
  }

  async function fetchItens() {
    try {
      const res = await fetch(ITEM_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar itens.")

      const data: Item[] = await res.json()
      setItens(data)

      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].iteId)
      }
    } catch (err) {
      toast.error("Erro ao carregar itens.")
      console.error(err)
    }
  }

  async function fetchProdutos() {
    try {
      const res = await fetch(PRODUTO_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar produtos.")

      const data: Produto[] = await res.json()
      setProdutos(data)
    } catch (err) {
      toast.error("Erro ao carregar produtos.")
      console.error(err)
    }
  }

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchItens(), fetchProdutos()])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(
    () => itens.find((i) => i.iteId === selectedId) || null,
    [itens, selectedId]
  )

  useEffect(() => {
    if (selected) {
      setEditData({
        nome: selected.iteNome,
        prodId: String(selected.prodId),
        quantidadeAtual: String(selected.iteQuantidadeAtual),
        loteNome: selected.iteLoteNome,
        loteDataAquisicao: selected.iteLoteDataAquisicao?.substring(0, 10) ?? "",
        loteDataVencimento: selected.iteLoteDataVencimento?.substring(0, 10) ?? "",
      })
    }
  }, [selected, editing])

  const filteredItens = useMemo(() => {
    return itens.filter((i) => {
      const matchesNome = i.iteNome.toLowerCase().includes(nomeFilter.toLowerCase())
      const matchesStatus = statusFilter === "Todos" || i.iteAtivo === statusFilter
      const matchesProduto =
        produtoFilter === "Todos" || String(i.prodId) === produtoFilter

      return matchesNome && matchesStatus && matchesProduto
    })
  }, [itens, statusFilter, nomeFilter, produtoFilter])

  const getInitials = (nome: string) => {
    if (!nome) return "I"
    return nome.trim().substring(0, 2).toUpperCase()
  }

  async function updateItem() {
    if (!selected) return

    const errors = validateItem(editData)
    setEditErrors(errors)

    if (Object.keys(errors).length > 0) return

    try {
      setSubmitting(true)

      const res = await fetch(`${ITEM_API_URL}/${selected.iteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iteNome: editData.nome.trim(),
          prodId: Number(editData.prodId),
          iteAtivo: selected.iteAtivo,
          iteQuantidadeAtual: Number(editData.quantidadeAtual),
          iteLoteNome: editData.loteNome.trim(),
          iteLoteDataAquisicao: editData.loteDataAquisicao,
          iteLoteDataVencimento: editData.loteDataVencimento,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao atualizar item.")
      }

      const updatedList = itens.map((i) =>
        i.iteId === selected.iteId
          ? {
              ...i,
              iteNome: editData.nome.trim(),
              prodId: Number(editData.prodId),
              iteQuantidadeAtual: Number(editData.quantidadeAtual),
              iteLoteNome: editData.loteNome.trim(),
              iteLoteDataAquisicao: editData.loteDataAquisicao,
              iteLoteDataVencimento: editData.loteDataVencimento,
            }
          : i
      )

      setItens(updatedList)
      toast.success("Item atualizado com sucesso!")
      setEditing(false)
      setEditErrors({})
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar item.")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleItemStatus(id: number) {
    const item = itens.find((i) => i.iteId === id)
    if (!item) return

    const newStatus = item.iteAtivo === "A" ? "I" : "A"

    try {
      const res = await fetch(`${ITEM_API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iteAtivo: newStatus }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Não foi possível alterar o status.")
      }

      setItens((prev) =>
        prev.map((i) => (i.iteId === id ? { ...i, iteAtivo: newStatus } : i))
      )

      toast.success(`Item ${newStatus === "A" ? "reativado" : "inativado"} com sucesso!`)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível alterar o status."
      )
    }
  }

  async function createItem() {
    const errors = validateItem(novoItem)
    setCreateErrors(errors)

    if (Object.keys(errors).length > 0) return

    try {
      setSubmitting(true)

      const res = await fetch(ITEM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iteNome: novoItem.nome.trim(),
          prodId: Number(novoItem.prodId),
          iteQuantidadeAtual: Number(novoItem.quantidadeAtual),
          iteLoteNome: novoItem.loteNome.trim(),
          iteLoteDataAquisicao: novoItem.loteDataAquisicao,
          iteLoteDataVencimento: novoItem.loteDataVencimento,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao cadastrar item.")
      }

      toast.success("Item cadastrado com sucesso!")
      closeCreateForm()
      await fetchItens()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar item.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell
      title="Cadastro de Itens"
      description="Cadastre, consulte e atualize os itens (lotes) de estoque vinculados aos produtos."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{itens.length}</p>
                <p className="text-xs text-muted-foreground">Itens cadastrados</p>
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
                  {itens.filter((i) => i.iteAtivo === "A").length}
                </p>
                <p className="text-xs text-muted-foreground">Itens ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />
                Cadastrar novo item
              </CardTitle>
              <RequiredMessage />
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="ite-nome">Nome do item <Required /></Label>
                <Input
                  id="ite-nome"
                  className={`mt-2 ${createErrors.nome ? INVALID_INPUT : ""}`}
                  placeholder="Ex.: Ácido Hialurônico 1ml"
                  value={novoItem.nome}
                  onChange={(e) => {
                    setNovoItem((p) => ({ ...p, nome: e.target.value }))
                    clearCreateError("nome")
                  }}
                />
                <FieldError error={createErrors.nome} />
              </div>

              <div className="sm:col-span-2">
                <Label>Produto <Required /></Label>
                <Select
                  value={novoItem.prodId}
                  onValueChange={(v) => {
                    setNovoItem((p) => ({ ...p, prodId: v }))
                    clearCreateError("prodId")
                  }}
                >
                  <ProdutoSelectTrigger
                    produtos={produtosAtivos.map((p) => p.prodDescricao)}
                    className={`${
                      createErrors.prodId ? INVALID_INPUT : ""
                    }`}
                  >
                    <SelectValue placeholder="Selecione">
                      {novoItem.prodId
                        ? produtosAtivos.find(
                            (p) => String(p.prodId) === novoItem.prodId
                          )?.prodDescricao
                        : undefined}
                    </SelectValue>
                  </ProdutoSelectTrigger>
                  <SelectContent>
                    {produtosAtivos.map((p) => (
                      <SelectItem key={p.prodId} value={String(p.prodId)}>
                        {p.prodDescricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={createErrors.prodId} />
              </div>

              <div>
                <Label htmlFor="ite-qtd-atual">Quantidade atual <Required /></Label>
                <Input
                  id="ite-qtd-atual"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-2 ${createErrors.quantidadeAtual ? INVALID_INPUT : ""}`}
                  placeholder="Ex.: 10"
                  value={novoItem.quantidadeAtual}
                  onChange={(e) => {
                    setNovoItem((p) => ({ ...p, quantidadeAtual: e.target.value }))
                    clearCreateError("quantidadeAtual")
                  }}
                />
                <FieldError error={createErrors.quantidadeAtual} />
              </div>


              <div>
                <Label htmlFor="ite-lote-nome">Nome do lote <Required /></Label>
                <Input
                  id="ite-lote-nome"
                  className={`mt-2 ${createErrors.loteNome ? INVALID_INPUT : ""}`}
                  placeholder="Ex.: Lote 2026-A"
                  value={novoItem.loteNome}
                  onChange={(e) => {
                    setNovoItem((p) => ({ ...p, loteNome: e.target.value }))
                    clearCreateError("loteNome")
                  }}
                />
                <FieldError error={createErrors.loteNome} />
              </div>

              <div>
                <Label htmlFor="ite-lote-aquisicao">
                  Data de aquisição <Required />
                </Label>
                <Input
                  id="ite-lote-aquisicao"
                  type="date"
                  className={`mt-2 ${
                    createErrors.loteDataAquisicao ? INVALID_INPUT : ""
                  }`}
                  value={novoItem.loteDataAquisicao}
                  onChange={(e) => {
                    setNovoItem((p) => ({ ...p, loteDataAquisicao: e.target.value }))
                    clearCreateError("loteDataAquisicao")
                    clearCreateError("loteDataVencimento")
                  }}
                />
                <FieldError error={createErrors.loteDataAquisicao} />
              </div>

              <div>
                <Label htmlFor="ite-lote-vencimento">
                  Data de vencimento <Required />
                </Label>
                <Input
                  id="ite-lote-vencimento"
                  type="date"
                  className={`mt-2 ${
                    createErrors.loteDataVencimento ? INVALID_INPUT : ""
                  }`}
                  value={novoItem.loteDataVencimento}
                  onChange={(e) => {
                    setNovoItem((p) => ({ ...p, loteDataVencimento: e.target.value }))
                    clearCreateError("loteDataVencimento")
                  }}
                />
                <FieldError error={createErrors.loteDataVencimento} />
              </div>

              <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateForm}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={createItem} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar item
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Label htmlFor="ite-nome-filter">Nome</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ite-nome-filter"
                  value={nomeFilter}
                  onChange={(e) => setNomeFilter(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1">
              <Label htmlFor="ite-prod-filter">Produto</Label>
              <Select value={produtoFilter} onValueChange={setProdutoFilter}>
                <ProdutoSelectTrigger
                  produtos={["Todos", ...produtos.map((p) => p.prodDescricao)]}
                  id="ite-prod-filter"
                >
                  <SelectValue placeholder="Selecione">
                    {produtoFilter === "Todos"
                      ? "Todos"
                      : getProdutoDescricao(Number(produtoFilter))}
                  </SelectValue>
                </ProdutoSelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {produtos.map((p) => (
                    <SelectItem key={p.prodId} value={String(p.prodId)}>
                      {p.prodDescricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="flex rounded-lg bg-muted p-1"
              role="group"
              aria-label="Filtrar itens por status"
            >
              {statusFilter !== "Todos" || nomeFilter || produtoFilter !== "Todos" ? (
                <button
                  type="button"
                  onClick={() => {
                    setNomeFilter("")
                    setStatusFilter("Todos")
                    setProdutoFilter("Todos")
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
                  onClick={() => setStatusFilter(st.value as "Todos" | "A" | "I")}
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
                setShowCreateForm(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo item
            </Button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card className="min-w-0 self-start">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4 text-primary" />
                Itens cadastrados
              </CardTitle>
            </CardHeader>

            <CardContent className="consulta-scroll flex flex-col gap-2" tabIndex={0} role="region" aria-label="Itens cadastrados">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItens.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Nenhum item encontrado.
                </p>
              ) : (
                filteredItens.map((i) => (
                  <div
                    key={i.iteId}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedId(i.iteId)
                      setEditing(false)
                      setEditErrors({})
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selected?.iteId === i.iteId
                        ? "border-primary bg-secondary/70"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(i.iteNome)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.iteNome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {i.iteLoteNome}
                      </p>
                    </div>

                    <Badge
                      variant={i.iteAtivo === "A" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {i.iteAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleItemStatus(i.iteId)
                      }}
                    >
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
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      Dados do item
                    </CardTitle>
                    {editing && <RequiredMessage />}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selected.iteAtivo === "A" ? "default" : "secondary"}>
                      {selected.iteAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing((prev) => !prev)
                        setEditErrors({})
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
                      value={selected.iteId}
                      readOnly
                      className="mt-2 bg-muted/40 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Input
                      value={selected.iteAtivo === "A" ? "Ativo" : "Inativo"}
                      readOnly
                      className="mt-2 bg-muted/40"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Nome do item {editing && <Required />}</Label>
                    <Input
                      value={editing ? editData.nome : selected.iteNome}
                      onChange={(e) => {
                        setEditData((p) => ({ ...p, nome: e.target.value }))
                        clearEditError("nome")
                      }}
                      readOnly={!editing}
                      className={`mt-2 ${editing && editErrors.nome ? INVALID_INPUT : ""}`}
                    />
                    {editing && <FieldError error={editErrors.nome} />}
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Produto {editing && <Required />}</Label>

                    {editing ? (
                      <Select
                        value={editData.prodId}
                        onValueChange={(v) => {
                          setEditData((p) => ({ ...p, prodId: v }))
                          clearEditError("prodId")
                        }}
                      >
                        <ProdutoSelectTrigger
                          produtos={produtosAtivos.map((p) => p.prodDescricao)}
                          className={`${
                            editErrors.prodId ? INVALID_INPUT : ""
                          }`}
                        >
                          <SelectValue placeholder="Selecione">
                            {editData.prodId
                              ? produtosAtivos.find(
                                  (p) => String(p.prodId) === editData.prodId
                                )?.prodDescricao
                              : undefined}
                          </SelectValue>
                        </ProdutoSelectTrigger>

                        <SelectContent>
                          {produtosAtivos.map((p) => (
                            <SelectItem key={p.prodId} value={String(p.prodId)}>
                              {p.prodDescricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={getProdutoDescricao(selected.prodId)}
                        readOnly
                        className="mt-2 bg-muted/40"
                      />
                    )}

                    {editing && <FieldError error={editErrors.prodId} />}
                  </div>

                  <div>
                    <Label>Quantidade atual {editing && <Required />}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editing
                          ? editData.quantidadeAtual
                          : selected.iteQuantidadeAtual
                      }
                      onChange={(e) => {
                        setEditData((p) => ({
                          ...p,
                          quantidadeAtual: e.target.value,
                        }))
                        clearEditError("quantidadeAtual")
                      }}
                      readOnly={!editing}
                      className={`mt-2 ${
                        editing && editErrors.quantidadeAtual ? INVALID_INPUT : ""
                      }`}
                    />
                    {editing && <FieldError error={editErrors.quantidadeAtual} />}
                  </div>


                  <div>
                    <Label>Nome do lote {editing && <Required />}</Label>
                    <Input
                      value={editing ? editData.loteNome : selected.iteLoteNome}
                      onChange={(e) => {
                        setEditData((p) => ({ ...p, loteNome: e.target.value }))
                        clearEditError("loteNome")
                      }}
                      readOnly={!editing}
                      className={`mt-2 ${
                        editing && editErrors.loteNome ? INVALID_INPUT : ""
                      }`}
                    />
                    {editing && <FieldError error={editErrors.loteNome} />}
                  </div>

                  <div>
                    <Label>Data de aquisição {editing && <Required />}</Label>

                    {editing ? (
                      <Input
                        type="date"
                        value={editData.loteDataAquisicao}
                        onChange={(e) => {
                          setEditData((p) => ({
                            ...p,
                            loteDataAquisicao: e.target.value,
                          }))
                          clearEditError("loteDataAquisicao")
                          clearEditError("loteDataVencimento")
                        }}
                        className={`mt-2 ${
                          editErrors.loteDataAquisicao ? INVALID_INPUT : ""
                        }`}
                      />
                    ) : (
                      <Input
                        value={formatDate(selected.iteLoteDataAquisicao)}
                        readOnly
                        className="mt-2 bg-muted/40"
                      />
                    )}

                    {editing && (
                      <FieldError error={editErrors.loteDataAquisicao} />
                    )}
                  </div>

                  <div>
                    <Label>Data de vencimento {editing && <Required />}</Label>

                    {editing ? (
                      <Input
                        type="date"
                        value={editData.loteDataVencimento}
                        onChange={(e) => {
                          setEditData((p) => ({
                            ...p,
                            loteDataVencimento: e.target.value,
                          }))
                          clearEditError("loteDataVencimento")
                        }}
                        className={`mt-2 ${
                          editErrors.loteDataVencimento ? INVALID_INPUT : ""
                        }`}
                      />
                    ) : (
                      <Input
                        value={formatDate(selected.iteLoteDataVencimento)}
                        readOnly
                        className="mt-2 bg-muted/40"
                      />
                    )}

                    {editing && (
                      <FieldError error={editErrors.loteDataVencimento} />
                    )}
                  </div>

                  {editing && (
                    <div className="mt-4 flex justify-end sm:col-span-2">
                      <Button onClick={updateItem} disabled={submitting}>
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
