"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, CircleDollarSign, Loader2, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5139"}/api`

type Promocao = {
  prom_id: number
  prom_titulo: string
  prom_mensagem: string
  prom_data_minima: string
  prom_data_maxima: string
}

type Procedimento = {
  procId: number
  procNome: string
  procValor: number | null
  procAtivo: string
}

type Vinculo = {
  prom_proc_id: number
  procedimentos_proc_id: number
  proc_nome: string
  proc_valor: number
  prom_proc_desconto: number
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

async function requisitar<T>(caminho: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${caminho}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const validacao = body?.errors ? Object.values(body.errors).flat().join(" ") : null
    throw new ApiError(body?.mensagem ?? validacao ?? "Não foi possível concluir a operação.", response.status)
  }
  return body as T
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function hojeLocal() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, "0")
  const dia = String(agora.getDate()).padStart(2, "0")
  return `${agora.getFullYear()}-${mes}-${dia}`
}

function valorNumerico(texto: string) {
  const valor = Number(texto.replace(",", "."))
  return Number.isFinite(valor) ? valor : 0
}

function numeroInformado(texto: string) {
  return texto.trim() !== "" && Number.isFinite(Number(texto.replace(",", ".")))
}

function arredondarMoeda(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

function EditorDesconto({
  valorBase,
  descontoInicial,
  disabled,
  textoBotao,
  onConfirmar,
  onCancelar,
}: {
  valorBase: number
  descontoInicial: number
  disabled?: boolean
  textoBotao: string
  onConfirmar: (desconto: number) => void
  onCancelar?: () => void
}) {
  const [modo, setModo] = useState<"fixo" | "percentual">("fixo")
  const [entrada, setEntrada] = useState(descontoInicial.toFixed(2))

  const desconto = modo === "fixo"
    ? arredondarMoeda(valorNumerico(entrada))
    : arredondarMoeda(valorBase * valorNumerico(entrada) / 100)
  const percentual = valorBase > 0 ? desconto / valorBase * 100 : 0
  const invalido = !numeroInformado(entrada) || desconto < 0 || desconto > valorBase
  const mensagemErro = !numeroInformado(entrada)
    ? "Informe um valor de desconto válido."
    : desconto < 0
      ? "O desconto não pode ser negativo."
      : desconto > valorBase
        ? "O desconto não pode ser maior que o valor original do procedimento."
        : ""

  function mudarModo(novoModo: "fixo" | "percentual") {
    setModo(novoModo)
    setEntrada((novoModo === "fixo" ? desconto : percentual).toFixed(2))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => mudarModo("fixo")}
          disabled={disabled}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${modo === "fixo" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Valor fixo (R$)
        </button>
        <button
          type="button"
          onClick={() => mudarModo("percentual")}
          disabled={disabled || valorBase === 0}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${modo === "percentual" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Porcentagem (%)
        </button>
      </div>

      <div>
        <Label>{modo === "fixo" ? "Desconto em reais" : "Desconto percentual"}</Label>
        <Input
          className="mt-2"
          type="number"
          min="0"
          max={modo === "percentual" ? "100" : String(valorBase)}
          step="0.01"
          inputMode="decimal"
          value={entrada}
          disabled={disabled}
          aria-invalid={invalido}
          aria-describedby={invalido ? "desconto-erro" : undefined}
          className={`mt-2 ${invalido ? "border-destructive ring-2 ring-destructive/20" : ""}`}
          onChange={(event) => setEntrada(event.target.value)}
        />
        {invalido && <p id="desconto-erro" role="alert" className="mt-1 text-xs text-destructive">{mensagemErro}</p>}
      </div>

      <div className="rounded-lg bg-secondary/60 p-3 text-sm">
        <p>Desconto aplicado: <strong>{moeda(desconto)}</strong></p>
        <p className="mt-1 text-xs text-muted-foreground">
          Equivale a {percentual.toFixed(2).replace(".", ",")}% do valor original. Valor final: {moeda(arredondarMoeda(valorBase - desconto))}.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        {onCancelar && <Button type="button" variant="outline" disabled={disabled} onClick={onCancelar}>Cancelar</Button>}
        <Button type="button" disabled={disabled || invalido} onClick={() => onConfirmar(desconto)}>{textoBotao}</Button>
      </div>
    </div>
  )
}

export default function PromocaoProcedimentosPage() {
  const params = useParams<{ id: string }>()
  const promId = Number(params.id)
  const [promocao, setPromocao] = useState<Promocao | null>(null)
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [busca, setBusca] = useState("")
  const [selecionado, setSelecionado] = useState<Procedimento | null>(null)
  const [editando, setEditando] = useState<Vinculo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  const expirada = !!promocao && promocao.prom_data_maxima < hojeLocal()
  const futura = !!promocao && promocao.prom_data_minima > hojeLocal()
  const idsVinculados = useMemo(() => new Set(vinculos.map((vinculo) => vinculo.procedimentos_proc_id)), [vinculos])
  const candidatos = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR")
    return procedimentos.filter((procedimento) => {
      const ativo = procedimento.procAtivo.toUpperCase() === "A"
      const possuiValor = procedimento.procValor !== null
      const corresponde = !termo || procedimento.procNome.toLocaleLowerCase("pt-BR").includes(termo) || String(procedimento.procId).includes(termo)
      return ativo && possuiValor && !idsVinculados.has(procedimento.procId) && corresponde
    })
  }, [busca, idsVinculados, procedimentos])

  const carregar = useCallback(async () => {
    if (!Number.isInteger(promId) || promId <= 0) {
      setErro("Promoção inválida.")
      setCarregando(false)
      return
    }

    try {
      setCarregando(true)
      setErro("")
      const [dadosPromocao, dadosVinculos, dadosProcedimentos] = await Promise.all([
        requisitar<Promocao>(`/promocoes/${promId}`),
        requisitar<Vinculo[]>(`/promocoes/${promId}/procedimentos`),
        requisitar<Procedimento[]>("/procedimento"),
      ])
      setPromocao(dadosPromocao)
      setVinculos(dadosVinculos)
      setProcedimentos(dadosProcedimentos)
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar a associação da promoção.")
    } finally {
      setCarregando(false)
    }
  }, [promId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function adicionar(desconto: number) {
    if (!selecionado) return
    try {
      setSalvando(true)
      const novos = await requisitar<Vinculo[]>(`/promocoes/${promId}/procedimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          procedimentos_proc_id: selecionado.procId,
          prom_proc_desconto: desconto,
        }]),
      })
      setVinculos((atual) => [...atual, ...novos])
      setSelecionado(null)
      setBusca("")
      toast.success("Procedimento associado à promoção.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível associar o procedimento.")
    } finally {
      setSalvando(false)
    }
  }

  async function atualizar(vinculo: Vinculo, desconto: number) {
    try {
      setSalvando(true)
      const atualizado = await requisitar<Vinculo>(`/promocoes/${promId}/procedimentos/${vinculo.prom_proc_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedimentos_proc_id: vinculo.procedimentos_proc_id,
          prom_proc_desconto: desconto,
        }),
      })
      setVinculos((atual) => atual.map((item) => item.prom_proc_id === atualizado.prom_proc_id ? atualizado : item))
      setEditando(null)
      toast.success("Desconto atualizado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o desconto.")
    } finally {
      setSalvando(false)
    }
  }

  async function remover(vinculo: Vinculo) {
    try {
      setSalvando(true)
      await requisitar<void>(`/promocoes/${promId}/procedimentos/${vinculo.prom_proc_id}`, { method: "DELETE" })
      setVinculos((atual) => atual.filter((item) => item.prom_proc_id !== vinculo.prom_proc_id))
      toast.success("Procedimento removido da promoção.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o procedimento.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <DashboardShell title="Procedimentos da Promoção" description="Associe procedimentos e defina descontos em valor fixo ou percentual.">
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <Button variant="outline" render={<Link href="/promocoes" />}><ArrowLeft />Voltar para promoções</Button>
        </div>

        {erro && <Card className="border-destructive/30"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-destructive">
          <p>{erro}</p><Button variant="outline" onClick={() => void carregar()}>Tentar novamente</Button>
        </CardContent></Card>}

        {carregando ? <Card><CardContent className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando promoção...</CardContent></Card>
          : promocao && <>
            <Card className="border-primary/20">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4 text-primary" />{promocao.prom_titulo}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">{promocao.prom_mensagem}</p>
                </div>
                <Badge variant={expirada ? "destructive" : "secondary"}>{expirada ? "Promoção expirada" : futura ? "Promoção futura" : "Promoção ativa"}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <p><span className="text-muted-foreground">Início:</span> {promocao.prom_data_minima.split("-").reverse().join("/")}</p>
                <p><span className="text-muted-foreground">Término:</span> {promocao.prom_data_maxima.split("-").reverse().join("/")}</p>
                <p><span className="text-muted-foreground">Procedimentos associados:</span> {vinculos.length}</p>
              </CardContent>
            </Card>

            {expirada && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Esta promoção expirou. A consulta permanece disponível, mas não é possível adicionar, editar ou remover procedimentos.
            </div>}

            <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
              <Card className={expirada ? "opacity-70" : undefined}>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" />Adicionar procedimento</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {!selecionado ? <>
                    <div>
                      <Label htmlFor="busca-procedimento">Buscar por nome ou código</Label>
                      <div className="relative mt-2"><Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="busca-procedimento" className="pl-8" placeholder="Ex.: Limpeza ou 12" value={busca} disabled={expirada} onChange={(event) => setBusca(event.target.value)} />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-lg border">
                      {candidatos.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">Nenhum procedimento ativo disponível.</p>
                        : candidatos.map((procedimento) => <button key={procedimento.procId} type="button" disabled={expirada} onClick={() => setSelecionado(procedimento)} className="flex w-full items-center justify-between gap-3 border-b p-3 text-left last:border-0 hover:bg-muted disabled:pointer-events-none">
                          <span><span className="block text-sm font-medium">{procedimento.procNome}</span><span className="text-xs text-muted-foreground">Código #{procedimento.procId}</span></span>
                          <span className="text-sm font-medium text-primary">{moeda(procedimento.procValor ?? 0)}</span>
                        </button>)}
                    </div>
                  </> : <>
                    <div className="rounded-lg border bg-muted/30 p-3"><p className="text-sm font-medium">{selecionado.procNome}</p><p className="mt-1 text-xs text-muted-foreground">Código #{selecionado.procId} · Valor original: {moeda(selecionado.procValor ?? 0)}</p></div>
                    <EditorDesconto key={`novo-${selecionado.procId}`} valorBase={selecionado.procValor ?? 0} descontoInicial={0} disabled={salvando || expirada} textoBotao="Associar procedimento" onConfirmar={adicionar} onCancelar={() => setSelecionado(null)} />
                  </>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="h-4 w-4 text-primary" />Procedimentos com desconto</CardTitle><Badge variant="secondary">{vinculos.length}</Badge></CardHeader>
                <CardContent>
                  {vinculos.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground"><CircleDollarSign className="h-9 w-9 opacity-50" /><p>Nenhum procedimento associado a esta promoção.</p><p className="text-xs">Use a busca ao lado para adicionar o primeiro procedimento.</p></div>
                    : <Table><TableHeader><TableRow><TableHead>Procedimento</TableHead><TableHead>Valor original</TableHead><TableHead>Desconto</TableHead><TableHead>Preço final</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                      <TableBody>{vinculos.map((vinculo) => <TableRow key={vinculo.prom_proc_id}>
                        <TableCell className="min-w-44 whitespace-normal"><p className="font-medium">{vinculo.proc_nome}</p><p className="text-xs text-muted-foreground">Código #{vinculo.procedimentos_proc_id}</p></TableCell>
                        <TableCell>{moeda(vinculo.proc_valor)}</TableCell><TableCell className="font-medium text-primary">-{moeda(vinculo.prom_proc_desconto)}</TableCell><TableCell className="font-semibold">{moeda(arredondarMoeda(vinculo.proc_valor - vinculo.prom_proc_desconto))}</TableCell>
                        <TableCell><div className="flex justify-end gap-1"><Button size="sm" variant="outline" disabled={expirada || salvando} onClick={() => setEditando(vinculo)}><Pencil />Editar</Button><Button size="sm" variant="outline" className="text-destructive" disabled={expirada || salvando} onClick={() => void remover(vinculo)}><Trash2 />Remover</Button></div></TableCell>
                      </TableRow>)}</TableBody></Table>}
                </CardContent>
              </Card>
            </div>

            {editando && <Card className="border-primary/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Pencil className="h-4 w-4 text-primary" />Editar desconto · {editando.proc_nome}</CardTitle></CardHeader><CardContent className="max-w-lg">
              <EditorDesconto key={`editar-${editando.prom_proc_id}`} valorBase={editando.proc_valor} descontoInicial={editando.prom_proc_desconto} disabled={salvando || expirada} textoBotao="Salvar desconto" onConfirmar={(desconto) => atualizar(editando, desconto)} onCancelar={() => setEditando(null)} />
            </CardContent></Card>}
          </>}
      </div>
    </DashboardShell>
  )
}
