"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { CalendarDays, CalendarPlus, Clock, List, Loader2, Pencil, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Required } from "@/components/ui/required"
import { RequiredMessage } from "@/components/ui/requiredMessage"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5139"
const INVALID_INPUT = "border-destructive ring-2 ring-destructive/20 aria-invalid:ring-2 aria-invalid:ring-destructive/20"

type Agendamento = {
  id: number
  cancelado: "S" | "N"
  dataAgendadoEm: string
  dataAgendadoPara: string
  duracaoMinutos: number | null
  dataTerminoPrevisto: string | null
  procedimentoId: number
  procedimentoNome: string
  clienteId: number | null
  clienteNome: string | null
}
type Procedimento = { procId: number; procNome: string; procAtivo: string; procDuracaoMinutos: number | null }
type Cliente = { cliId: number; cliNome: string; cliAtivo: string }
type DadosAgendamento = { dataAgendadoPara: string; procedimentoId: number; clienteId: number; atualizarDuracao: boolean }
type Erros = Partial<Record<"dataAgendadoPara" | "procedimentoId" | "clienteId", string>>

function agoraLocal() {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(new Date())
  return partes.replace(" ", "T")
}

function formatarData(value: string) {
  const [data, hora = ""] = value.split("T")
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano} ${hora.slice(0, 5)}`.trim()
}

function terminoLocal(inicio: string, minutos: number) {
  const data = new Date(`${inicio.length === 16 ? `${inicio}:00` : inicio}Z`)
  data.setUTCMinutes(data.getUTCMinutes() + minutos)
  return Number.isFinite(data.getTime()) && data.getUTCFullYear() <= 9999 ? data.toISOString().slice(0, 19) : ""
}

function periodosSobrepostos(inicio: string, fim: string, outroInicio: string, outroFim: string) {
  const normalizar = (valor: string) => valor.length === 16 ? `${valor}:00` : valor.slice(0, 19)
  return normalizar(inicio) < normalizar(outroFim) && normalizar(outroInicio) < normalizar(fim)
}

class ApiError extends Error {
  constructor(message: string, public status: number, public campo?: keyof Erros) { super(message) }
}

async function requisitar<T>(caminho: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${caminho}`, {
    ...options, credentials: "include", cache: "no-store", signal: AbortSignal.timeout(15000),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const validation = body?.errors ? Object.values(body.errors).flat().join(" ") : null
    throw new ApiError(response.status === 401
      ? "Sua sessão expirou. Entre novamente para acessar os agendamentos."
      : body?.mensagem ?? validation ?? "Não foi possível concluir a operação.", response.status, body?.campo)
  }
  return body as T
}

function ErroCampo({ erro }: { erro?: string }) {
  return erro ? <p className="mt-1 text-xs text-destructive" role="alert">{erro}</p> : null
}

function Formulario({
  agendamento, agendamentos, procedimentos, clientes, salvando, onSalvar, onFechar,
}: {
  agendamento?: Agendamento
  agendamentos: Agendamento[]
  procedimentos: Procedimento[]
  clientes: Cliente[]
  salvando: boolean
  onSalvar: (dados: DadosAgendamento) => Promise<void>
  onFechar: () => void
}) {
  const [dataRegistro] = useState(() => agendamento?.dataAgendadoEm ?? agoraLocal())
  const [data, setData] = useState(agendamento?.dataAgendadoPara.slice(0, 16) ?? "")
  const [procedimentoId, setProcedimentoId] = useState(agendamento ? String(agendamento.procedimentoId) : "")
  const [clienteId, setClienteId] = useState(agendamento?.clienteId ? String(agendamento.clienteId) : "")
  const [erros, setErros] = useState<Erros>({})
  const [usarNovaDuracao, setUsarNovaDuracao] = useState(false)
  const opcoesProcedimentos = procedimentos.filter(p => p.procAtivo === "A" || p.procId === agendamento?.procedimentoId)
  const opcoesClientes = clientes.filter(c => c.cliAtivo === "A" || c.cliId === agendamento?.clienteId)
  const procedimentoSelecionado = opcoesProcedimentos.find(p => String(p.procId) === procedimentoId)
  const duracaoAtual = procedimentoSelecionado?.procDuracaoMinutos
  const manterDuracao = agendamento?.procedimentoId === Number(procedimentoId) && !usarNovaDuracao
  const duracao = (manterDuracao ? agendamento?.duracaoMinutos : null) ?? duracaoAtual
  const fim = data && duracao && duracao > 0 ? terminoLocal(data, duracao) : ""
  const duracaoAlterada = agendamento?.procedimentoId === Number(procedimentoId) &&
    !!agendamento?.duracaoMinutos && !!duracaoAtual && agendamento.duracaoMinutos !== duracaoAtual

  async function enviar(event: FormEvent) {
    event.preventDefault()
    if (salvando) return
    const novosErros: Erros = {}
    if (!data || !Number.isFinite(new Date(data).getTime())) novosErros.dataAgendadoPara = "Informe a data e a hora do procedimento."
    else if ((data.length === 16 ? `${data}:00` : data) <= agoraLocal())
      novosErros.dataAgendadoPara = "Selecione uma data e um horário posteriores ao momento atual."
    if (!procedimentoId || !opcoesProcedimentos.some(p => String(p.procId) === procedimentoId))
      novosErros.procedimentoId = "Selecione um procedimento."
    else if (!duracao || duracao <= 0)
      novosErros.procedimentoId = "Informe a duração no cadastro deste procedimento antes de agendar."
    if (!clienteId || !opcoesClientes.some(c => String(c.cliId) === clienteId))
      novosErros.clienteId = "Selecione um cliente."
    if (!novosErros.dataAgendadoPara && data && duracao && !fim)
      novosErros.dataAgendadoPara = "A duração excede o limite da data informada."
    if (!novosErros.dataAgendadoPara && fim && agendamento?.cancelado !== "S" && agendamentos.some(a => a.cancelado !== "S" && a.id !== agendamento?.id &&
      a.dataTerminoPrevisto && periodosSobrepostos(data, fim, a.dataAgendadoPara, a.dataTerminoPrevisto)))
      novosErros.dataAgendadoPara = "O período selecionado coincide com outro agendamento. Escolha um horário após o término do procedimento anterior."
    setErros(novosErros)
    if (Object.keys(novosErros).length) return
    try {
      await onSalvar({ dataAgendadoPara: data, procedimentoId: Number(procedimentoId), clienteId: Number(clienteId), atualizarDuracao: usarNovaDuracao })
    } catch (error) {
      if (error instanceof ApiError && error.campo) {
        const campo = error.campo
        setErros(p => ({ ...p, [campo]: error.message }))
      }
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><RequiredMessage /></div>
      <div>
        <Label htmlFor="agendamento-registro">Agendado em</Label>
        <Input id="agendamento-registro" className="mt-2 bg-muted/40" value={formatarData(dataRegistro)} readOnly />
      </div>
      <div>
        <Label htmlFor="agendamento-data">Agendado para <Required /></Label>
        <Input id="agendamento-data" type="datetime-local" min={agoraLocal().slice(0, 16)} className={`mt-2 ${erros.dataAgendadoPara ? INVALID_INPUT : ""}`}
          value={data} aria-invalid={!!erros.dataAgendadoPara} disabled={salvando}
          onChange={e => { setData(e.target.value); setErros(p => ({ ...p, dataAgendadoPara: undefined })) }} />
        <ErroCampo erro={erros.dataAgendadoPara} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="agendamento-procedimento">Procedimento <Required /></Label>
        <Select value={procedimentoId} onValueChange={v => { setProcedimentoId(v ?? ""); setErros(p => ({ ...p, procedimentoId: undefined })) }} disabled={salvando}>
          <SelectTrigger id="agendamento-procedimento" className={`mt-2 h-auto min-h-9 w-full whitespace-normal text-left [&>span]:line-clamp-none ${erros.procedimentoId ? INVALID_INPUT : ""}`} aria-invalid={!!erros.procedimentoId}>
            <SelectValue placeholder="Selecione o procedimento">{opcoesProcedimentos.find(p => String(p.procId) === procedimentoId)?.procNome}</SelectValue>
          </SelectTrigger>
          <SelectContent>{opcoesProcedimentos.map(p => <SelectItem key={p.procId} value={String(p.procId)}>{p.procNome}</SelectItem>)}</SelectContent>
        </Select>
        <ErroCampo erro={erros.procedimentoId} />
        {!opcoesProcedimentos.length && <p className="mt-1 text-xs text-muted-foreground">Cadastre um procedimento ativo para agendar.</p>}
        {duracaoAlterada && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>Este agendamento reservou {agendamento?.duracaoMinutos} minutos. A duração atual do procedimento é {duracaoAtual} minutos.</p>
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" className="accent-primary" checked={usarNovaDuracao} disabled={salvando}
              onChange={e => { setUsarNovaDuracao(e.target.checked); setErros(p => ({ ...p, dataAgendadoPara: undefined })) }} />
            Usar a nova duração de {duracaoAtual} minutos
          </label>
          <p className="mt-1 text-xs">Ao salvar, o sistema verificará os conflitos antes de alterar o período reservado.</p>
        </div>}
      </div>
      <div><Label>Duração reservada</Label><Input className="mt-2 bg-muted/40" value={duracao ? `${duracao} minutos` : "Selecione um procedimento com duração"} readOnly /></div>
      <div><Label>Término previsto</Label><Input className="mt-2 bg-muted/40" value={fim ? formatarData(fim) : ""} readOnly /></div>
      <div className="sm:col-span-2">
        <Label htmlFor="agendamento-cliente">Cliente <Required /></Label>
        <Select value={clienteId} onValueChange={v => { setClienteId(v ?? ""); setErros(p => ({ ...p, clienteId: undefined })) }} disabled={salvando}>
          <SelectTrigger id="agendamento-cliente" className={`mt-2 w-full ${erros.clienteId ? INVALID_INPUT : ""}`} aria-invalid={!!erros.clienteId}>
            <SelectValue placeholder="Selecione o cliente">{opcoesClientes.find(c => String(c.cliId) === clienteId)?.cliNome}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {opcoesClientes.map(c => <SelectItem key={c.cliId} value={String(c.cliId)}>{c.cliNome}</SelectItem>)}
          </SelectContent>
        </Select>
        <ErroCampo erro={erros.clienteId} />
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onFechar} disabled={salvando}>Fechar</Button>
        <Button type="submit" disabled={salvando || !opcoesProcedimentos.length}>
          {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {agendamento ? "Salvar alterações" : "Agendar procedimento"}
        </Button>
      </div>
    </form>
  )
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState("")
  const [sessaoExpirada, setSessaoExpirada] = useState(false)
  const [busca, setBusca] = useState("")
  const [dataFiltro, setDataFiltro] = useState("")
  const [agora, setAgora] = useState("")

  function mostrarErro(error: unknown) {
    setErro(error instanceof ApiError ? error.message : "Não foi possível conectar à API. Verifique a conexão e tente novamente.")
    if (error instanceof ApiError && error.status === 401) setSessaoExpirada(true)
  }

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro("")
    try {
      const [lista, opcoesProcedimentos, opcoesClientes] = await Promise.all([
        requisitar<Agendamento[]>("/api/agendamentos"),
        requisitar<Procedimento[]>("/api/procedimento"),
        requisitar<Cliente[]>("/api/Cliente"),
      ])
      setAgendamentos(lista)
      setProcedimentos(opcoesProcedimentos)
      setClientes(opcoesClientes)
      setSessaoExpirada(false)
      setAgora(agoraLocal())
      setSelecionadoId(id => lista.some(a => a.id === id) ? id : lista[0]?.id ?? null)
    } catch (error) { mostrarErro(error) }
    finally { setCarregando(false) }
  }, [])

  useEffect(() => { void carregar() }, [carregar])

  const selecionado = agendamentos.find(a => a.id === selecionadoId)
  const filtrados = useMemo(() => agendamentos.filter(a =>
    (!dataFiltro || a.dataAgendadoPara.slice(0, 10) === dataFiltro) &&
    `${a.procedimentoNome} ${a.clienteNome ?? ""}`.toLocaleLowerCase().includes(busca.trim().toLocaleLowerCase())
  ).sort((a, b) => a.dataAgendadoPara.localeCompare(b.dataAgendadoPara) || a.id - b.id), [agendamentos, busca, dataFiltro])
  const hoje = agora.slice(0, 10)

  async function salvar(dados: DadosAgendamento, id?: number) {
    setSalvando(true)
    setErro("")
    try {
      const salvo = await requisitar<Agendamento>(`/api/agendamentos${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      })
      setAgendamentos(lista => [...lista.filter(a => a.id !== salvo.id), salvo])
      setSelecionadoId(salvo.id)
      setCriando(false)
      setEditando(false)
      setAgora(agoraLocal())
      toast.success(id ? "Agendamento atualizado com sucesso!" : "Procedimento agendado com sucesso!")
    } catch (error) {
      if (error instanceof ApiError && error.campo) throw error
      mostrarErro(error)
    } finally { setSalvando(false) }
  }

  return (
    <DashboardShell title="Agendamento de Procedimentos" description="Organize as datas dos procedimentos e acompanhe os próximos agendamentos.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Agendamentos", valor: agendamentos.length, icone: CalendarDays },
            { label: "Agendados para hoje", valor: agendamentos.filter(a => a.cancelado !== "S" && a.dataAgendadoPara.slice(0, 10) === hoje).length, icone: CalendarPlus },
            { label: "Próximos agendamentos", valor: agendamentos.filter(a => a.cancelado !== "S" && agora && a.dataAgendadoPara >= agora).length, icone: Clock },
          ].map(({ label, valor, icone: Icone }) => (
            <Card key={label}><CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icone className="h-5 w-5" /></div>
              <div><p className="text-2xl font-semibold">{valor}</p><p className="text-xs text-muted-foreground">{label}</p></div>
            </CardContent></Card>
          ))}
        </div>

        {erro && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{erro}</p>
          {sessaoExpirada ? <Button variant="outline" render={<Link href="/" />}>Entrar novamente</Button>
            : <Button variant="outline" onClick={() => void carregar()} disabled={carregando || salvando}>Tentar novamente</Button>}
        </div>}

        {criando && <Card className="border-primary/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarPlus className="h-4 w-4 text-primary" />Novo agendamento</CardTitle></CardHeader>
          <CardContent><Formulario agendamentos={agendamentos} procedimentos={procedimentos} clientes={clientes} salvando={salvando} onSalvar={dados => salvar(dados)} onFechar={() => setCriando(false)} /></CardContent>
        </Card>}

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-end">
          <div className="flex-1"><Label htmlFor="agendamento-busca">Buscar procedimento ou cliente</Label>
            <div className="relative mt-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="agendamento-busca" className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." /></div>
          </div>
          <div><Label htmlFor="agendamento-filtro-data">Data do procedimento</Label><Input id="agendamento-filtro-data" className="mt-2" type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} /></div>
          {(busca || dataFiltro) && <Button variant="outline" onClick={() => { setBusca(""); setDataFiltro("") }}>Limpar filtros</Button>}
          <Button disabled={carregando || salvando || sessaoExpirada || criando} onClick={() => { setCriando(true); setEditando(false) }}><Plus className="mr-2 h-4 w-4" />Novo agendamento</Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[600px_1fr]">
          <Card className="min-w-0 self-start"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><List className="h-4 w-4 text-primary" />Agendamentos cadastrados</CardTitle></CardHeader>
            <CardContent className="consulta-scroll flex flex-col gap-2" tabIndex={0} role="region" aria-label="Agendamentos cadastrados">
              {carregando ? <p role="status" className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando agendamentos...</p>
                : filtrados.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{agendamentos.length ? "Nenhum agendamento para os filtros informados." : "Nenhum agendamento cadastrado."}</p>
                : filtrados.map(a => <button type="button" key={a.id} disabled={salvando} aria-pressed={a.id === selecionadoId}
                  onClick={() => { setSelecionadoId(a.id); setEditando(false) }}
                  className={`rounded-xl border p-3 text-left transition-colors hover:bg-muted ${a.id === selecionadoId ? "border-primary bg-secondary/70" : "border-border"}`}>
                  <p className="font-medium">{a.procedimentoNome}</p>{a.cancelado === "S" && <p className="mt-1 text-xs font-medium text-destructive">Cancelado</p>}<p className="mt-1 text-xs text-primary">{formatarData(a.dataAgendadoPara)}</p><p className="mt-1 text-xs text-muted-foreground">{a.duracaoMinutos ? `${a.duracaoMinutos} minutos · Término: ${a.dataTerminoPrevisto ? formatarData(a.dataTerminoPrevisto) : "Não definido"}` : "Duração pendente"}</p><p className="mt-1 text-xs text-muted-foreground">{a.clienteNome ?? "Sem cliente"}</p>
                </button>)}
            </CardContent>
          </Card>

          {selecionado ? <Card><CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" />Dados do agendamento</CardTitle>
            {!criando && <Button variant="outline" size="sm" disabled={salvando || sessaoExpirada} onClick={() => setEditando(v => !v)}><Pencil className="mr-2 h-3.5 w-3.5" />{editando ? "Fechar edição" : "Editar"}</Button>}
          </CardHeader><CardContent>
            {editando ? <Formulario key={selecionado.id} agendamento={selecionado} agendamentos={agendamentos} procedimentos={procedimentos} clientes={clientes} salvando={salvando} onSalvar={dados => salvar(dados, selecionado.id)} onFechar={() => setEditando(false)} />
              : <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Situação</Label><Input className="mt-2 bg-muted/40" value={selecionado.cancelado === "S" ? "Cancelado" : "Não cancelado"} readOnly /></div>
                <div><Label>Agendado em</Label><Input className="mt-2 bg-muted/40" value={formatarData(selecionado.dataAgendadoEm)} readOnly /></div>
                <div><Label>Agendado para</Label><Input className="mt-2 bg-muted/40" value={formatarData(selecionado.dataAgendadoPara)} readOnly /></div>
                <div><Label>Duração reservada</Label><Input className="mt-2 bg-muted/40" value={selecionado.duracaoMinutos ? `${selecionado.duracaoMinutos} minutos` : "Não informada"} readOnly /></div>
                <div><Label>Término previsto</Label><Input className="mt-2 bg-muted/40" value={selecionado.dataTerminoPrevisto ? formatarData(selecionado.dataTerminoPrevisto) : "Não definido"} readOnly /></div>
                <div className="sm:col-span-2"><Label>Procedimento</Label><Input className="mt-2 bg-muted/40" value={selecionado.procedimentoNome} readOnly /></div>
                <div className="sm:col-span-2"><Label>Cliente</Label><Input className="mt-2 bg-muted/40" value={selecionado.clienteNome ?? "Sem cliente"} readOnly /></div>
              </div>}
          </CardContent></Card>
            : <Card><CardContent className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">Selecione um agendamento para ver os detalhes.</CardContent></Card>}
        </div>
      </div>
    </DashboardShell>
  )
}
