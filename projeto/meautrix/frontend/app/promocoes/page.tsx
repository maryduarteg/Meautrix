"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { List, ListPlus, Loader2, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Required } from "@/components/ui/required"
import { RequiredMessage } from "@/components/ui/requiredMessage"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5139"}/api/promocoes`
const INVALID_INPUT = "border-destructive ring-2 ring-destructive/20"
type Dados = { prom_titulo: string; prom_mensagem: string; prom_data_minima: string; prom_data_maxima: string }
type Promocao = Dados & { prom_id: number; created_at: string | null }
type Filtros = { titulo: string; mensagem: string; data_inicio: string; data_fim: string; apenas_ativas: boolean }
const FILTROS_VAZIOS: Filtros = { titulo: "", mensagem: "", data_inicio: "", data_fim: "", apenas_ativas: false }
type Erros = Partial<Record<keyof Dados, string>>

class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

async function requisitar<T>(caminho = "", options: RequestInit = {}): Promise<T> {
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

function Formulario({ promocao, salvando, onSalvar, onFechar }: {
  promocao?: Promocao; salvando: boolean; onSalvar: (dados: Dados) => Promise<void>; onFechar: () => void
}) {
  const [dados, setDados] = useState<Dados>({
    prom_titulo: promocao?.prom_titulo ?? "", prom_mensagem: promocao?.prom_mensagem ?? "",
    prom_data_minima: promocao?.prom_data_minima ?? "", prom_data_maxima: promocao?.prom_data_maxima ?? "",
  })
  const [erros, setErros] = useState<Erros>({})
  async function enviar(event: FormEvent) {
    event.preventDefault()
    if (salvando) return
    const novos: Erros = {}
    if (!dados.prom_titulo.trim()) novos.prom_titulo = "Informe o título."
    else if (dados.prom_titulo.length > 60) novos.prom_titulo = "Use até 60 caracteres."
    if (!dados.prom_mensagem.trim()) novos.prom_mensagem = "Informe a mensagem."
    else if (dados.prom_mensagem.length > 100) novos.prom_mensagem = "Use até 100 caracteres."
    if (!dados.prom_data_minima) novos.prom_data_minima = "Informe a data inicial."
    if (!dados.prom_data_maxima) novos.prom_data_maxima = "Informe a data final."
    else if (dados.prom_data_minima && dados.prom_data_maxima < dados.prom_data_minima)
      novos.prom_data_maxima = "A data final não pode ser anterior à data inicial."
    setErros(novos)
    if (!Object.keys(novos).length) await onSalvar({ ...dados, prom_titulo: dados.prom_titulo.trim(), prom_mensagem: dados.prom_mensagem.trim() })
  }
  const campos: { nome: keyof Dados; label: string; tipo: string; limite?: number }[] = [
    { nome: "prom_titulo", label: "Título", tipo: "text", limite: 60 },
    { nome: "prom_mensagem", label: "Mensagem", tipo: "text", limite: 100 },
    { nome: "prom_data_minima", label: "Data inicial", tipo: "date" },
    { nome: "prom_data_maxima", label: "Data final", tipo: "date" },
  ]
  return <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
    <div className="sm:col-span-2"><RequiredMessage /></div>
    {campos.map(campo => <div key={campo.nome}>
      <Label htmlFor={campo.nome}>{campo.label} <Required /></Label>
      <Input id={campo.nome} type={campo.tipo} maxLength={campo.limite} required disabled={salvando}
        min={campo.nome === "prom_data_maxima" ? dados.prom_data_minima || undefined : undefined}
        max={campo.tipo === "date" ? "9999-12-31" : undefined}
        value={dados[campo.nome]} className={`mt-2 ${erros[campo.nome] ? INVALID_INPUT : ""}`}
        aria-invalid={!!erros[campo.nome]} aria-describedby={erros[campo.nome] ? `${campo.nome}-erro` : undefined}
        onChange={e => { setDados(p => ({ ...p, [campo.nome]: e.target.value })); setErros({}) }} />
      {erros[campo.nome] && <p id={`${campo.nome}-erro`} className="mt-1 text-xs text-destructive" role="alert">{erros[campo.nome]}</p>}
    </div>)}
    <div className="flex justify-end gap-2 sm:col-span-2">
      <Button type="button" variant="outline" disabled={salvando} onClick={onFechar}>Cancelar</Button>
      <Button type="submit" disabled={salvando}>{salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar{promocao ? " alterações" : " promoção"}</Button>
    </div>
  </form>
}

export default function PromocoesPage() {
  const [lista, setLista] = useState<Promocao[]>([])
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS)
  const [erroFiltro, setErroFiltro] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sessaoExpirada, setSessaoExpirada] = useState(false)
  const [formulario, setFormulario] = useState<Promocao | "novo" | null>(null)
  const [excluir, setExcluir] = useState<Promocao | null>(null)
  const [versao, setVersao] = useState(0)
  const operacao = useRef(false)

  function mostrarErro(error: unknown) {
    setErro(error instanceof Error ? error.message : "Não foi possível concluir a operação.")
    if (error instanceof ApiError && error.status === 401) { setSessaoExpirada(true); setLista([]) }
  }

  useEffect(() => {
    const controller = new AbortController()
    async function carregar() {
      setCarregando(true)
      setErro("")
      const params = new URLSearchParams()
      if (aplicados.titulo.trim()) params.set("titulo", aplicados.titulo.trim())
      if (aplicados.mensagem.trim()) params.set("mensagem", aplicados.mensagem.trim())
      if (aplicados.data_inicio) params.set("data_inicio", aplicados.data_inicio)
      if (aplicados.data_fim) params.set("data_fim", aplicados.data_fim)
      if (aplicados.apenas_ativas) params.set("apenas_ativas", "true")
      try {
        const dados = await requisitar<Promocao[]>(`?${params}`, { signal: controller.signal })
        if (!controller.signal.aborted) { setLista(dados); setSessaoExpirada(false) }
      } catch (error) {
        if (!controller.signal.aborted) { setLista([]); mostrarErro(error) }
      } finally { if (!controller.signal.aborted) setCarregando(false) }
    }
    void carregar()
    return () => controller.abort()
  }, [aplicados, versao])

  function buscar(event: FormEvent) {
    event.preventDefault()
    if (filtros.data_inicio && filtros.data_fim && filtros.data_fim < filtros.data_inicio) {
      setErroFiltro("O fim do filtro não pode ser anterior ao início.")
      return
    }
    setErroFiltro(""); setAplicados({ ...filtros }); setExcluir(null)
  }

  async function salvar(dados: Dados) {
    if (operacao.current) return
    operacao.current = true
    setSalvando(true); setErro("")
    const id = formulario && formulario !== "novo" ? formulario.prom_id : null
    try {
      await requisitar(id === null ? "" : `/${id}`, {
        method: id === null ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados),
      })
      setFormulario(null); setVersao(v => v + 1)
      toast.success(id === null ? "Promoção cadastrada com sucesso!" : "Promoção atualizada com sucesso!")
    } catch (error) { mostrarErro(error) }
    finally { setSalvando(false); operacao.current = false }
  }

  async function confirmarExclusao() {
    if (!excluir || operacao.current) return
    operacao.current = true
    setSalvando(true); setErro("")
    try {
      await requisitar(`/${excluir.prom_id}`, { method: "DELETE" })
      if (formulario && formulario !== "novo" && formulario.prom_id === excluir.prom_id) setFormulario(null)
      setExcluir(null); setVersao(v => v + 1); toast.success("Promoção excluída com sucesso!")
    } catch (error) { mostrarErro(error) }
    finally { setSalvando(false); operacao.current = false }
  }

  return <DashboardShell title="Consulta de Promoções" description="Cadastre, consulte e gerencie as promoções e seus períodos de vigência.">
    <div className="flex flex-col gap-6">
      {erro && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <p>{erro}</p>{sessaoExpirada ? <Button variant="outline" render={<Link href="/" />}>Entrar novamente</Button>
          : <Button variant="outline" disabled={salvando || carregando} onClick={() => setVersao(v => v + 1)}>Atualizar consulta</Button>}
      </div>}

      {formulario && <Card className="border-primary/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base">
        <Tags className="h-4 w-4 text-primary" />{formulario === "novo" ? "Nova promoção" : "Editar promoção"}
      </CardTitle></CardHeader><CardContent><Formulario key={formulario === "novo" ? "novo" : formulario.prom_id}
        promocao={formulario === "novo" ? undefined : formulario} salvando={salvando || sessaoExpirada}
        onSalvar={salvar} onFechar={() => setFormulario(null)} /></CardContent></Card>}

      <form onSubmit={buscar} className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><Label htmlFor="filtro-titulo">Título</Label><Input id="filtro-titulo" className="mt-2" value={filtros.titulo} onChange={e => setFiltros(p => ({ ...p, titulo: e.target.value }))} placeholder="Buscar por título..." /></div>
        <div><Label htmlFor="filtro-mensagem">Mensagem</Label><Input id="filtro-mensagem" className="mt-2" value={filtros.mensagem} onChange={e => setFiltros(p => ({ ...p, mensagem: e.target.value }))} placeholder="Buscar por mensagem..." /></div>
        <div><Label htmlFor="filtro-inicio">Início do período</Label><Input id="filtro-inicio" className="mt-2" type="date" max="9999-12-31" value={filtros.data_inicio} onChange={e => { setFiltros(p => ({ ...p, data_inicio: e.target.value })); setErroFiltro("") }} /></div>
        <div><Label htmlFor="filtro-fim">Fim do período</Label><Input id="filtro-fim" className="mt-2" type="date" max="9999-12-31" value={filtros.data_fim} onChange={e => { setFiltros(p => ({ ...p, data_fim: e.target.value })); setErroFiltro("") }} /></div>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">Inclui promoções com vigência em qualquer dia do período informado.</p>
        {erroFiltro && <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-4">{erroFiltro}</p>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={filtros.apenas_ativas} onChange={e => setFiltros(p => ({ ...p, apenas_ativas: e.target.checked }))} />Apenas ativas</label>
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="button" variant="outline" disabled={salvando} onClick={() => { setFiltros(FILTROS_VAZIOS); setAplicados({ ...FILTROS_VAZIOS }); setErroFiltro(""); setExcluir(null) }}>Limpar filtros</Button>
          <Button type="submit" variant="outline" disabled={carregando || salvando}><Search className="mr-2 h-4 w-4" />Buscar</Button>
          <Button type="button" disabled={salvando || sessaoExpirada} onClick={() => { setFormulario("novo"); setExcluir(null) }}><Plus className="mr-2 h-4 w-4" />Nova promoção</Button>
        </div>
      </form>

      {excluir && <Card className="border-destructive/30" role="region" aria-label="Confirmar exclusão"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <p className="text-sm">Excluir a promoção <strong>{excluir.prom_titulo}</strong>? A exclusão é permanente.</p>
        <div className="flex gap-2"><Button variant="outline" disabled={salvando} onClick={() => setExcluir(null)}>Cancelar</Button>
          <Button variant="destructive" disabled={salvando || sessaoExpirada} onClick={() => void confirmarExclusao()}>{salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar exclusão</Button></div>
      </CardContent></Card>}

      <Card className="min-w-0"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><List className="h-4 w-4 text-primary" />Promoções cadastradas{!carregando && !erro && ` (${lista.length})`}</CardTitle></CardHeader>
        <CardContent>{carregando ? <p role="status" className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando promoções...</p>
          : <Table aria-label="Promoções cadastradas"><TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Mensagem</TableHead><TableHead>Data inicial</TableHead><TableHead>Data final</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>{lista.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{erro ? "Consulta indisponível. Atualize para tentar novamente." : "Nenhuma promoção encontrada."}</TableCell></TableRow>
              : lista.map(p => <TableRow key={p.prom_id}>
                <TableCell className="min-w-40 max-w-64 whitespace-normal break-words font-medium">{p.prom_titulo}</TableCell>
                <TableCell className="min-w-48 max-w-96 whitespace-normal break-words">{p.prom_mensagem}</TableCell>
                <TableCell>{p.prom_data_minima.split("-").reverse().join("/")}</TableCell><TableCell>{p.prom_data_maxima.split("-").reverse().join("/")}</TableCell>
                <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" render={<Link href={`/promocoes/${p.prom_id}/procedimentos`} />}><ListPlus className="mr-2 h-3.5 w-3.5" />Procedimentos</Button><Button size="sm" variant="outline" disabled={salvando || sessaoExpirada} aria-label={`Editar ${p.prom_titulo}`} onClick={() => { setFormulario(p); setExcluir(null) }}><Pencil className="mr-2 h-3.5 w-3.5" />Editar</Button>
                  <Button size="sm" variant="outline" className="text-destructive" disabled={salvando || sessaoExpirada} aria-label={`Excluir ${p.prom_titulo}`} onClick={() => setExcluir(p)}><Trash2 className="mr-2 h-3.5 w-3.5" />Excluir</Button></div></TableCell>
              </TableRow>)}</TableBody>
          </Table>}</CardContent>
      </Card>
    </div>
  </DashboardShell>
}
