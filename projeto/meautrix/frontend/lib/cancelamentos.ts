export type AgendamentoCancelamento = {
  id: number
  dataAgendadoPara: string
  procedimentoNome: string
  clienteNome: string | null
  duracaoMinutos: number | null
  cancelado: "S" | "N"
  usuarioCancelouId: number | null
}

export type FiltroPeriodo = "todos" | "hoje" | "amanha" | "7" | "15" | "periodo"

export function hojeLocal(data = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(data)
}

export function somarDias(dia: string, dias: number) {
  const data = new Date(`${dia}T12:00:00Z`)
  data.setUTCDate(data.getUTCDate() + dias)
  return data.toISOString().slice(0, 10)
}

export function intervaloFiltro(hoje: string, periodo: FiltroPeriodo, inicio: string, fim: string) {
  if (periodo === "hoje") return { inicio: hoje, fim: hoje, erro: "" }
  if (periodo === "amanha") {
    const amanha = somarDias(hoje, 1)
    return { inicio: amanha, fim: amanha, erro: "" }
  }
  if (periodo === "7" || periodo === "15")
    return { inicio: hoje, fim: somarDias(hoje, Number(periodo) - 1), erro: "" }
  if (periodo === "periodo") {
    const dataValida = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
      Number.isFinite(new Date(`${valor}T12:00:00Z`).getTime()) && somarDias(valor, 0) === valor
    const erro = !dataValida(inicio) || !dataValida(fim) ? "Informe as datas inicial e final."
      : inicio < hoje ? "A data inicial deve ser hoje ou uma data futura."
      : fim < inicio ? "A data final deve ser igual ou posterior à data inicial." : ""
    return { inicio, fim, erro }
  }
  return { inicio: hoje, fim: "", erro: "" }
}

export function normalizarBusca(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR")
}

export function filtrarCancelamentos(
  lista: AgendamentoCancelamento[], hoje: string,
  intervalo: { inicio: string; fim: string; erro: string }, cliente: string, procedimento: string,
) {
  if (!hoje || intervalo.erro) return []
  return lista.filter(a => {
    const dia = a.dataAgendadoPara.slice(0, 10)
    return dia >= hoje && dia >= intervalo.inicio && (!intervalo.fim || dia <= intervalo.fim) &&
      normalizarBusca(a.clienteNome ?? "").includes(normalizarBusca(cliente)) &&
      normalizarBusca(a.procedimentoNome).includes(normalizarBusca(procedimento))
  }).sort((a, b) => a.dataAgendadoPara.localeCompare(b.dataAgendadoPara) || a.id - b.id)
}
