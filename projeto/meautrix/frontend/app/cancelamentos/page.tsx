"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, CalendarX2, Clock, Loader2, RotateCcw, Search } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { filtrarCancelamentos, hojeLocal, intervaloFiltro, type AgendamentoCancelamento, type FiltroPeriodo } from "@/lib/cancelamentos"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5139"
const PERIODOS: { value: FiltroPeriodo; label: string }[] = [
  { value: "todos", label: "Hoje e futuros" },
  { value: "hoje", label: "Hoje" },
  { value: "amanha", label: "Amanhã" },
  { value: "7", label: "Próximos 7 dias" },
  { value: "15", label: "Próximos 15 dias" },
  { value: "periodo", label: "Período personalizado" },
]

class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

async function requisitar<T>(caminho: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${caminho}`, {
    ...options, credentials: "include", cache: "no-store",
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const validacao = body?.errors ? Object.values(body.errors).flat().join(" ") : null
    throw new ApiError(response.status === 401 ? "Sua sessão expirou. Entre novamente para continuar."
      : body?.mensagem ?? validacao ?? "Não foi possível concluir a operação. Tente novamente.", response.status)
  }
  return body as T
}

function formatarData(valor: string) {
  return valor.slice(0, 10).split("-").reverse().join("/")
}

export default function CancelamentosPage() {
  const [lista, setLista] = useState<AgendamentoCancelamento[]>([])
  const [hoje, setHoje] = useState("")
  const [cliente, setCliente] = useState("")
  const [procedimento, setProcedimento] = useState("")
  const [periodo, setPeriodo] = useState<FiltroPeriodo>("todos")
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [salvandoId, setSalvandoId] = useState<number | null>(null)
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [sessaoExpirada, setSessaoExpirada] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const atualizar = () => {
      const dia = hojeLocal()
      setHoje(dia)
      setInicio(valor => !valor || valor < dia ? dia : valor)
      setFim(valor => !valor || valor < dia ? dia : valor)
    }
    atualizar()
    const timer = window.setInterval(atualizar, 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!hoje) return
    const controller = new AbortController()
    async function carregar() {
      setCarregando(true)
      setErro("")
      try {
        const dados = await requisitar<AgendamentoCancelamento[]>("/api/agendamentos/cancelamentos", { signal: controller.signal })
        if (!controller.signal.aborted) {
          setLista(dados)
          setSessaoExpirada(false)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErro(error instanceof ApiError ? error.message : "Não foi possível carregar os agendamentos. Tente novamente.")
          if (error instanceof ApiError && error.status === 401) {
            setSessaoExpirada(true)
            setLista([])
          }
        }
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }
    void carregar()
    return () => controller.abort()
  }, [hoje, tentativa])

  const intervalo = useMemo(() => hoje ? intervaloFiltro(hoje, periodo, inicio, fim)
    : { inicio: "", fim: "", erro: "" }, [hoje, periodo, inicio, fim])
  const filtrados = useMemo(() => filtrarCancelamentos(lista, hoje, intervalo, cliente, procedimento),
    [lista, hoje, intervalo, cliente, procedimento])
  const cancelados = filtrados.filter(a => a.cancelado === "S").length

  async function alterar(agendamento: AgendamentoCancelamento) {
    if (salvandoId !== null || sessaoExpirada || carregando) return
    setSalvandoId(agendamento.id)
    setErro("")
    setMensagem("")
    try {
      const salvo = await requisitar<AgendamentoCancelamento>(`/api/agendamentos/${agendamento.id}/cancelamento`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelado: agendamento.cancelado === "S" ? "N" : "S" }),
      })
      setLista(atual => atual.map(a => a.id === salvo.id ? salvo : a))
      setMensagem(`${salvo.procedimentoNome}: ${salvo.cancelado === "S" ? "cancelado" : "reativado"} com sucesso.`)
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar a alteração. Tente novamente.")
      if (error instanceof ApiError && error.status === 401) {
        setSessaoExpirada(true)
        setLista([])
      }
    } finally { setSalvandoId(null) }
  }

  return (
    <DashboardShell title="Cancelamento de Procedimentos" description="Cancele ou reative os procedimentos agendados de hoje em diante.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Procedimentos encontrados", valor: filtrados.length, icon: CalendarDays },
            { label: "Não cancelados", valor: filtrados.length - cancelados, icon: Clock },
            { label: "Cancelados", valor: cancelados, icon: CalendarX2 },
          ].map(({ label, valor, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></div>
            <div><p className="text-2xl font-semibold">{carregando ? "—" : valor}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </CardContent></Card>)}
        </div>

        <Card><CardHeader><CardTitle>Filtros de consulta</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">
          <div><Label htmlFor="cancelamento-cliente">Nome da cliente</Label>
            <div className="relative mt-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="cancelamento-cliente" className="pl-9" placeholder="Buscar cliente..." value={cliente} onChange={e => setCliente(e.target.value)} /></div>
          </div>
          <div><Label htmlFor="cancelamento-procedimento">Nome do procedimento</Label>
            <div className="relative mt-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="cancelamento-procedimento" className="pl-9" placeholder="Buscar procedimento..." value={procedimento} onChange={e => setProcedimento(e.target.value)} /></div>
          </div>
          <div><Label htmlFor="cancelamento-periodo">Data do procedimento</Label>
            <Select value={periodo} onValueChange={v => { if (v) setPeriodo(v as FiltroPeriodo) }}>
              <SelectTrigger id="cancelamento-periodo" className="mt-2 w-full"><SelectValue>{PERIODOS.find(p => p.value === periodo)?.label}</SelectValue></SelectTrigger>
              <SelectContent>{PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            {(periodo === "7" || periodo === "15") && <p className="mt-1 text-xs text-muted-foreground">Inclui hoje: {formatarData(intervalo.inicio)} a {formatarData(intervalo.fim)}.</p>}
          </div>
          {periodo === "periodo" && <>
            <div><Label htmlFor="cancelamento-inicio">Data inicial</Label><Input id="cancelamento-inicio" className="mt-2" type="date" min={hoje} value={inicio} aria-invalid={!!intervalo.erro} aria-describedby={intervalo.erro ? "cancelamento-erro-periodo" : undefined} onChange={e => setInicio(e.target.value)} /></div>
            <div><Label htmlFor="cancelamento-fim">Data final</Label><Input id="cancelamento-fim" className="mt-2" type="date" min={inicio >= hoje ? inicio : hoje} value={fim} aria-invalid={!!intervalo.erro} aria-describedby={intervalo.erro ? "cancelamento-erro-periodo" : undefined} onChange={e => setFim(e.target.value)} /></div>
          </>}
          {intervalo.erro && <p id="cancelamento-erro-periodo" role="alert" className="text-sm text-destructive md:col-span-3">{intervalo.erro}</p>}
          <div className="flex flex-wrap justify-end gap-2 md:col-span-3">
            <Button variant="outline" onClick={() => { setCliente(""); setProcedimento(""); setPeriodo("todos"); setInicio(hoje); setFim(hoje) }}>Limpar filtros</Button>
            <Button variant="outline" disabled={carregando || salvandoId !== null} onClick={() => { setMensagem(""); setTentativa(v => v + 1) }}>Atualizar lista</Button>
          </div>
        </CardContent></Card>

        {erro && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{erro}</p>
          {sessaoExpirada && <Link href="/" className="font-medium underline">Entrar novamente</Link>}
        </div>}
        {mensagem && <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">{mensagem}</p>}

        <Card><CardHeader className="gap-2 sm:flex sm:items-center sm:justify-between">
          <CardTitle>Procedimentos agendados</CardTitle>
          <Link href="/agendamentos" className="text-sm font-medium text-primary hover:underline">Ir para agendamentos</Link>
        </CardHeader><CardContent>
          <div className="consulta-scroll" tabIndex={0} role="region" aria-label="Procedimentos para cancelar ou reativar" aria-busy={carregando}>
            {carregando ? <p role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />Carregando agendamentos...</p>
              : filtrados.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">{erro ? "Os agendamentos não puderam ser carregados." : intervalo.erro ? "Ajuste o período para consultar os procedimentos." : "Nenhum procedimento encontrado para os filtros informados."}</p>
              : <ul className="divide-y divide-border">
                {filtrados.map(a => <li key={a.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                  <div className="shrink-0 text-sm"><p className="font-semibold text-primary">{formatarData(a.dataAgendadoPara)}</p>
                    <time dateTime={a.dataAgendadoPara} className="mt-1 block text-muted-foreground">{a.dataAgendadoPara.slice(11, 16)}{a.duracaoMinutos ? ` · ${a.duracaoMinutos} min` : ""}</time></div>
                  <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-medium">{a.procedimentoNome}</h3><p className="mt-1 break-words text-sm text-muted-foreground">Cliente: {a.clienteNome || "Não informada"}</p></div>
                  <Badge variant={a.cancelado === "S" ? "secondary" : "default"}>{a.cancelado === "S" ? "Cancelado" : "Não cancelado"}</Badge>
                  <Button variant="outline" className="sm:min-w-32" disabled={salvandoId !== null || sessaoExpirada || carregando}
                    aria-label={`${a.cancelado === "S" ? "Reativar" : "Cancelar"} ${a.procedimentoNome} de ${a.clienteNome || "cliente não informada"} em ${formatarData(a.dataAgendadoPara)} às ${a.dataAgendadoPara.slice(11, 16)}`}
                    onClick={() => void alterar(a)}>
                    {salvandoId === a.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      : a.cancelado === "S" ? <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> : <CalendarX2 className="mr-2 h-4 w-4" aria-hidden="true" />}
                    {a.cancelado === "S" ? "Reativar" : "Cancelar"}
                  </Button>
                </li>)}
              </ul>}
          </div>
        </CardContent></Card>
      </div>
    </DashboardShell>
  )
}
