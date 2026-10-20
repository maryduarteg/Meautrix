"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, ClipboardList, Loader2, PackagePlus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

type Procedimento = {
  procId: number
  procNome: string
  procDescricao: string
  procAtivo: string
}

type Produto = {
  prodId: number
  prodDescricao: string
  prodAtivo: string
}

type ProdutoProcedimento = {
  prodId: number
  prodDescricao: string
  procId: number
  quantidadeSaida: number
}

const API_URL = "http://localhost:5139/api"

function getApiMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "mensagem" in body) {
    const message = (body as { mensagem?: unknown }).mensagem
    if (typeof message === "string") return message
  }

  return fallback
}

export default function ProdutosProcedimentosPage() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [vinculos, setVinculos] = useState<ProdutoProcedimento[]>([])
  const [selectedProcedureId, setSelectedProcedureId] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingVinculos, setLoadingVinculos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const selectedProcedure = useMemo(
    () => procedimentos.find((procedimento) => String(procedimento.procId) === selectedProcedureId),
    [procedimentos, selectedProcedureId],
  )

  const linkedProductIds = useMemo(
    () => new Set(vinculos.map((vinculo) => vinculo.prodId)),
    [vinculos],
  )

  const availableProducts = useMemo(
    () => produtos.filter((produto) => !linkedProductIds.has(produto.prodId)),
    [produtos, linkedProductIds],
  )

  const loadBaseData = useCallback(async () => {
    try {
      setLoadingBase(true)
      const [procedimentosResponse, produtosResponse] = await Promise.all([
        fetch(`${API_URL}/procedimento`),
        fetch(`${API_URL}/produto`),
      ])

      if (!procedimentosResponse.ok || !produtosResponse.ok) {
        throw new Error()
      }

      const [procedimentosData, produtosData] = await Promise.all([
        procedimentosResponse.json(),
        produtosResponse.json(),
      ])

      setProcedimentos(
        (procedimentosData as Procedimento[]).filter(
          (procedimento) => String(procedimento.procAtivo).toUpperCase() === "A",
        ),
      )
      setProdutos(
        (produtosData as Produto[]).filter(
          (produto) => String(produto.prodAtivo).toUpperCase() === "A",
        ),
      )
    } catch {
      toast.error("Não foi possível carregar os procedimentos e produtos disponíveis.")
    } finally {
      setLoadingBase(false)
    }
  }, [])

  const loadVinculos = useCallback(async (procedureId: string) => {
    if (!procedureId) {
      setVinculos([])
      setQuantities({})
      return
    }

    try {
      setLoadingVinculos(true)
      const response = await fetch(`${API_URL}/procedimento-produto/procedimento/${procedureId}`)
      if (!response.ok) throw new Error()

      const data = (await response.json()) as ProdutoProcedimento[]
      setVinculos(data)
      setQuantities(
        Object.fromEntries(data.map((vinculo) => [vinculo.prodId, String(vinculo.quantidadeSaida)])),
      )
    } catch {
      toast.error("Não foi possível carregar os produtos deste procedimento.")
    } finally {
      setLoadingVinculos(false)
    }
  }, [])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  useEffect(() => {
    setSelectedProductId("")
    setQuantity("")
    loadVinculos(selectedProcedureId)
  }, [selectedProcedureId, loadVinculos])

  async function addProduct() {
    const productId = Number(selectedProductId)
    const amount = Number(quantity)

    if (!selectedProcedureId) {
      toast.error("Selecione primeiro o procedimento.")
      return
    }
    if (!productId || !amount || amount <= 0) {
      toast.error("Selecione o produto e informe uma quantidade maior que zero.")
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${API_URL}/procedimento-produto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procId: Number(selectedProcedureId),
          prodId: productId,
          quantidadeSaida: amount,
        }),
      })
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(getApiMessage(body, "Não foi possível adicionar o produto."))
      }

      const newVinculo = body as ProdutoProcedimento
      setVinculos((previous) => [...previous, newVinculo])
      setQuantities((previous) => ({ ...previous, [newVinculo.prodId]: String(newVinculo.quantidadeSaida) }))
      setSelectedProductId("")
      setQuantity("")
      toast.success("Produto associado ao procedimento.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar o produto.")
    } finally {
      setSaving(false)
    }
  }

  async function updateQuantity(vinculo: ProdutoProcedimento) {
    const amount = Number(quantities[vinculo.prodId])
    if (!amount || amount <= 0) {
      toast.error("Informe uma quantidade maior que zero.")
      return
    }

    try {
      setUpdatingId(vinculo.prodId)
      const response = await fetch(
        `${API_URL}/procedimento-produto/procedimento/${vinculo.procId}/produto/${vinculo.prodId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantidadeSaida: amount }),
        },
      )
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getApiMessage(body, "Não foi possível atualizar a quantidade."))
      }

      setVinculos((previous) =>
        previous.map((item) =>
          item.prodId === vinculo.prodId ? { ...item, quantidadeSaida: amount } : item,
        ),
      )
      toast.success("Quantidade atualizada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a quantidade.")
    } finally {
      setUpdatingId(null)
    }
  }

  async function removeProduct(vinculo: ProdutoProcedimento) {
    try {
      setRemovingId(vinculo.prodId)
      const response = await fetch(
        `${API_URL}/procedimento-produto/procedimento/${vinculo.procId}/produto/${vinculo.prodId}`,
        { method: "DELETE" },
      )
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(getApiMessage(body, "Não foi possível remover o produto."))
      }

      setVinculos((previous) => previous.filter((item) => item.prodId !== vinculo.prodId))
      toast.success("Produto removido do procedimento.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o produto.")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <DashboardShell
      title="Produtos por Procedimento"
      description="Defina os produtos e as quantidades padrão utilizadas em cada procedimento."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{procedimentos.length}</p>
                <p className="text-xs text-muted-foreground">Procedimentos disponíveis</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{selectedProcedure ? vinculos.length : "—"}</p>
                <p className="text-xs text-muted-foreground">Produtos associados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
              Selecione o procedimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xl">
              <Label htmlFor="procedimento">Procedimento</Label>
              <Select value={selectedProcedureId} onValueChange={setSelectedProcedureId} disabled={loadingBase}>
                <SelectTrigger id="procedimento" className="mt-2 w-full">
                  <SelectValue placeholder={loadingBase ? "Carregando procedimentos..." : "Selecione o procedimento"}>
                    {selectedProcedure?.procNome}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {procedimentos.map((procedimento) => (
                    <SelectItem key={procedimento.procId} value={String(procedimento.procId)}>
                      {procedimento.procNome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProcedure && (
                <p className="mt-2 text-xs text-muted-foreground">{selectedProcedure.procDescricao}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <Card className={!selectedProcedure ? "opacity-70" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                Adicionar produto
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="produto">Produto disponível</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={!selectedProcedure || loadingBase || saving}>
                  <SelectTrigger id="produto" className="mt-2 w-full">
                    <SelectValue placeholder={selectedProcedure ? "Selecione o produto" : "Selecione primeiro o procedimento"}>
                      {produtos.find((produto) => String(produto.prodId) === selectedProductId)?.prodDescricao}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((produto) => (
                      <SelectItem key={produto.prodId} value={String(produto.prodId)}>
                        {produto.prodDescricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProcedure && availableProducts.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Todos os produtos ativos já foram associados.</p>
                )}
              </div>

              <div>
                <Label htmlFor="quantidade">Quantidade padrão</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ex.: 2"
                  value={quantity}
                  disabled={!selectedProcedure || saving}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">Quantidade consumida em uma execução do procedimento.</p>
              </div>

              <Button onClick={addProduct} disabled={!selectedProcedure || saving || !selectedProductId || !quantity}>
                {saving ? <Loader2 className="animate-spin" /> : <Plus />}
                Adicionar produto
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Produtos vinculados
              </CardTitle>
              {selectedProcedure && <Badge variant="secondary">{vinculos.length} {vinculos.length === 1 ? "produto" : "produtos"}</Badge>}
            </CardHeader>
            <CardContent>
              {!selectedProcedure ? (
                <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <ClipboardList className="h-8 w-8 opacity-50" />
                  <p>Selecione um procedimento para configurar os produtos utilizados.</p>
                </div>
              ) : loadingVinculos ? (
                <div className="flex h-52 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : vinculos.length === 0 ? (
                <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <PackagePlus className="h-8 w-8 opacity-50" />
                  <p>Nenhum produto associado a este procedimento.</p>
                  <p className="text-xs">Use o formulário ao lado para adicionar o primeiro produto.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-40">Quantidade padrão</TableHead>
                      <TableHead className="w-28 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vinculos.map((vinculo) => (
                      <TableRow key={vinculo.prodId}>
                        <TableCell className="font-medium">{vinculo.prodDescricao}</TableCell>
                        <TableCell>
                          <Input
                            aria-label={`Quantidade padrão de ${vinculo.prodDescricao}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="w-28"
                            value={quantities[vinculo.prodId] ?? ""}
                            disabled={updatingId === vinculo.prodId || removingId === vinculo.prodId}
                            onChange={(event) =>
                              setQuantities((previous) => ({ ...previous, [vinculo.prodId]: event.target.value }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(vinculo)}
                              disabled={updatingId === vinculo.prodId || removingId === vinculo.prodId}
                            >
                              {updatingId === vinculo.prodId ? <Loader2 className="animate-spin" /> : "Salvar"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remover ${vinculo.prodDescricao}`}
                              onClick={() => removeProduct(vinculo)}
                              disabled={updatingId === vinculo.prodId || removingId === vinculo.prodId}
                              className="text-destructive hover:text-destructive"
                            >
                              {removingId === vinculo.prodId ? <Loader2 className="animate-spin" /> : <Trash2 />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
