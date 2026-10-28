"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, Clock, Loader2 } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5139"

type Usuario = { usuNome: string }
type Agendamento = {
  id: number
  dataAgendadoPara: string
  procedimentoNome: string
  clienteNome: string | null
  duracaoMinutos: number | null
  cancelado: "S" | "N"
}

function dataAtual() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())
}

function procedimentosDoDia(agendamentos: Agendamento[], dia: string) {
  // A API retorna os horários locais da clínica sem indicação de fuso.
  return agendamentos
    .filter(a => a.cancelado !== "S" && a.dataAgendadoPara.slice(0, 10) === dia)
    .sort((a, b) => a.dataAgendadoPara.localeCompare(b.dataAgendadoPara) || a.id - b.id)
}

async function carregarDadosHome(signal: AbortSignal) {
  async function buscar<T>(caminho: string): Promise<T> {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      credentials: "include", cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    })
    if (!resposta.ok) {
      throw new Error(resposta.status === 401 ? "sessao-expirada" : "falha-carregamento")
    }
    return resposta.json()
  }
  return Promise.allSettled([
    buscar<Usuario>("/api/Usuarios/me"),
    buscar<Agendamento[]>("/api/agendamentos"),
  ])
}

export default function HomePage() {
  const [nome, setNome] = useState("")
  const [dia, setDia] = useState("")
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [erroNome, setErroNome] = useState("")
  const [sessaoExpirada, setSessaoExpirada] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const tentarNovamente = useCallback(() => setTentativa(valor => valor + 1), [])

  useEffect(() => {
    const atualizarDia = () => setDia(dataAtual())
    atualizarDia()
    const intervalo = window.setInterval(atualizarDia, 60000)
    window.addEventListener("focus", tentarNovamente)
    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener("focus", tentarNovamente)
    }
  }, [tentarNovamente])

  useEffect(() => {
    if (!dia) return
    const controller = new AbortController()
    async function carregar() {
      setCarregando(true)
      setErro("")
      setSessaoExpirada(false)
      setErroNome("")
      const [usuario, lista] = await carregarDadosHome(controller.signal)
      if (controller.signal.aborted) return
      const expirou = [usuario, lista].some(resultado =>
        resultado.status === "rejected" && resultado.reason instanceof Error && resultado.reason.message === "sessao-expirada")
      setSessaoExpirada(expirou)
      if (expirou) {
        setNome("")
        setAgendamentos([])
        setErro("Sua sessão expirou. Entre novamente para consultar os procedimentos do dia.")
      } else {
        if (usuario.status === "fulfilled") setNome(usuario.value.usuNome)
        else setErroNome("Não foi possível carregar seu nome.")
        if (lista.status === "fulfilled") setAgendamentos(lista.value)
        else setErro("Não foi possível carregar os procedimentos do dia. Tente novamente.")
      }
      setCarregando(false)
    }
    void carregar()
    return () => controller.abort()
  }, [dia, tentativa])

  const procedimentos = procedimentosDoDia(agendamentos, dia)
  const dataFormatada = dia ? dia.split("-").reverse().join("/") : ""

  return (
    <DashboardShell title="Home">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-primary/10 bg-primary/5 p-6 md:p-8">
          <p className="mb-2 text-sm font-medium text-primary">Boas-vindas ao Meautrix</p>
          <h2 className="break-words text-2xl font-semibold text-foreground md:text-3xl">
            {nome ? `Olá, ${nome}!` : "Olá!"}
          </h2>
          {erroNome && <div className="mt-3 flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-destructive">{erroNome}</p>
            <Button variant="outline" size="sm" onClick={tentarNovamente}>Tentar novamente</Button>
          </div>}
        </section>

        <Card>
          <CardHeader className="gap-3 border-b sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Estes são os procedimentos do dia:</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {dataFormatada || "Hoje"}
              </p>
            </div>
            <Link href="/agendamentos" className="text-sm font-medium text-primary hover:underline">
              Ver agendamentos
            </Link>
          </CardHeader>
          <CardContent aria-busy={carregando} aria-live="polite">
            {carregando ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground" role="status">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Carregando procedimentos do dia...
              </div>
            ) : erro ? (
              <div className="space-y-4 py-8 text-center">
                <p role="alert" className="text-sm text-destructive">{erro}</p>
                {sessaoExpirada ? (
                  <Link href="/" className="text-sm font-medium text-primary hover:underline">Entrar novamente</Link>
                ) : (
                  <Button variant="outline" onClick={tentarNovamente}>Tentar novamente</Button>
                )}
              </div>
            ) : procedimentos.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="font-medium">Nenhum procedimento agendado para hoje.</p>
                <p className="mt-1 text-sm text-muted-foreground">Os agendamentos deste dia aparecerão aqui.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {procedimentos.map(procedimento => (
                  <li key={procedimento.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex shrink-0 items-center gap-2 font-semibold text-primary">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <time dateTime={procedimento.dataAgendadoPara}>{procedimento.dataAgendadoPara.slice(11, 16)}</time>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-medium">{procedimento.procedimentoNome}</h3>
                      <p className="mt-1 break-words text-sm text-muted-foreground">
                        Cliente: {procedimento.clienteNome || "Não informado"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {procedimento.duracaoMinutos ? `${procedimento.duracaoMinutos} min` : "Duração não informada"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
