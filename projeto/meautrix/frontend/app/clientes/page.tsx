"use client"

import { useMemo, useState } from "react"
import { UserRound, UserPlus, Pencil, Power, Search, X } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const genders = ["Feminino", "Masculino", "Não binário", "Agênero", "Outro"]

type Client = {
  id: string
  name: string
  cpf: string
  birthDate: string
  gender: string
  active: boolean
}

const initialClients: Client[] = [
  { id: "CLI-001", name: "Ana Paula Mendes", cpf: "***.482.***-09", birthDate: "1988-04-12", gender: "Feminino", active: true },
  { id: "CLI-002", name: "Carla Mendes", cpf: "***.721.***-44", birthDate: "1992-09-28", gender: "Feminino", active: true },
  { id: "CLI-003", name: "Rafael Oliveira", cpf: "***.115.***-70", birthDate: "1985-01-17", gender: "Masculino", active: false },
]

const emptyClient = { name: "", cpf: "", birthDate: "", gender: "Feminino" }

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export default function ClientesPage() {
  const [clients, setClients] = useState(initialClients)
  const [selectedId, setSelectedId] = useState("CLI-001")
  const [nameFilter, setNameFilter] = useState("")
  const [cpfFilter, setCpfFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Ativos" | "Inativos">("Todos")
  const [form, setForm] = useState(emptyClient)
  const [editing, setEditing] = useState(false)
  const selected = clients.find((client) => client.id === selectedId) ?? null

  const filteredClients = useMemo(() => clients.filter((client) => {
    const matchesName = client.name.toLowerCase().includes(nameFilter.toLowerCase())
    const matchesCpf = client.cpf.replace(/\D/g, "").includes(cpfFilter.replace(/\D/g, ""))
    const matchesStatus = statusFilter === "Todos" || (statusFilter === "Ativos" ? client.active : !client.active)
    return matchesName && matchesCpf && matchesStatus
  }), [clients, nameFilter, cpfFilter, statusFilter])

  function startCreate() {
    setEditing(false)
    setSelectedId("")
    setForm(emptyClient)
  }

  function startEdit(client: Client) {
    setSelectedId(client.id)
    setForm({ name: client.name, cpf: client.cpf, birthDate: client.birthDate, gender: client.gender })
    setEditing(true)
  }

  function saveClient() {
    if (!form.name.trim() || form.cpf.replace(/\D/g, "").length !== 11 || !form.birthDate || !form.gender) {
      toast.error("Preencha nome, CPF válido, data de nascimento e gênero.")
      return
    }
    if (editing && selected) {
      setClients((current) => current.map((client) => client.id === selected.id ? { ...client, ...form, name: form.name.trim(), cpf: formatCpf(form.cpf) } : client))
      toast.success("Dados da cliente atualizados.")
    } else {
      const id = `CLI-${String(clients.length + 1).padStart(3, "0")}`
      const created = { id, ...form, name: form.name.trim(), cpf: formatCpf(form.cpf), active: true }
      setClients((current) => [...current, created])
      setSelectedId(id)
      toast.success("Cliente cadastrada com sucesso.")
    }
    setEditing(false)
  }

  function toggleStatus(client: Client) {
    setClients((current) => current.map((item) => item.id === client.id ? { ...item, active: !item.active } : item))
    toast.success(`${client.name} foi ${client.active ? "inativada" : "ativada"}.`)
  }

  return (
    <DashboardShell title="Gerenciar Clientes" description="Cadastre, consulte e mantenha os registros das suas clientes atualizados.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-2xl font-semibold">{clients.length}</p><p className="text-xs text-muted-foreground">Total de clientes</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-2xl font-semibold text-primary">{clients.filter((client) => client.active).length}</p><p className="text-xs text-muted-foreground">Registros ativos</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-2xl font-semibold text-muted-foreground">{clients.filter((client) => !client.active).length}</p><p className="text-xs text-muted-foreground">Registros inativos</p></CardContent></Card>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-end">
          <div className="flex-1"><Label htmlFor="client-name-filter">Nome da cliente</Label><div className="relative mt-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="client-name-filter" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Buscar por nome" className="pl-9" /></div></div>
          <div className="flex-1"><Label htmlFor="client-cpf-filter">CPF</Label><div className="relative mt-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="client-cpf-filter" value={cpfFilter} onChange={(event) => setCpfFilter(formatCpf(event.target.value))} placeholder="Buscar por CPF" className="pl-9" inputMode="numeric" /></div></div>
          <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Filtrar clientes por status">{statusFilter !== "Todos" || nameFilter || cpfFilter ? <button type="button" onClick={() => { setNameFilter(""); setCpfFilter(""); setStatusFilter("Todos") }} className="mr-1 rounded-md px-2 text-muted-foreground" aria-label="Limpar filtros"><X className="h-4 w-4" /></button> : null}{(["Todos", "Ativos", "Inativos"] as const).map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${statusFilter === status ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`} aria-pressed={statusFilter === status}>{status}</button>)}</div>
          <Button onClick={startCreate}><UserPlus className="mr-2 h-4 w-4" />Nova cliente</Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" />Clientes cadastradas <span className="text-xs font-normal text-muted-foreground">({filteredClients.length})</span></CardTitle></CardHeader>
            <CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-3 font-medium">Cliente</th><th className="pb-3 font-medium">CPF</th><th className="pb-3 font-medium">Gênero</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Ações</th></tr></thead><tbody>{filteredClients.map((client) => <tr key={client.id} className={`border-b last:border-0 ${selectedId === client.id ? "bg-secondary/40" : ""}`}><td className="py-4"><button type="button" onClick={() => setSelectedId(client.id)} className="text-left"><p className="font-medium">{client.name}</p><p className="font-mono text-[11px] text-muted-foreground">{client.id}</p></button></td><td className="py-4 text-muted-foreground">{client.cpf}</td><td className="py-4 text-muted-foreground">{client.gender}</td><td className="py-4"><Badge variant={client.active ? "default" : "secondary"}>{client.active ? "Ativa" : "Inativa"}</Badge></td><td className="py-4 text-right"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => startEdit(client)} aria-label={`Editar ${client.name}`}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => toggleStatus(client)} aria-label={`${client.active ? "Inativar" : "Ativar"} ${client.name}`}><Power className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table>{filteredClients.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma cliente encontrada com esses filtros.</div>}</div></CardContent>
          </Card>

          <Card className="h-fit"><CardHeader><CardTitle className="text-base">{editing ? "Editar cliente" : selectedId ? "Dados da cliente" : "Cadastrar cliente"}</CardTitle><p className="text-sm text-muted-foreground">{editing || !selectedId ? "Atualize os dados abaixo." : "Selecione editar para alterar o registro."}</p></CardHeader><CardContent className="flex flex-col gap-4">{selectedId && !editing ? <><div><Label>ID do registro</Label><Input value={selected?.id ?? ""} readOnly className="mt-2 bg-muted/40 font-mono text-xs" /></div><div><Label>Nome da cliente</Label><Input value={selected?.name ?? ""} readOnly className="mt-2" /></div><div><Label>CPF</Label><Input value={selected?.cpf ?? ""} readOnly className="mt-2" /></div><div><Label>Data de nascimento</Label><Input value={selected?.birthDate ? new Date(`${selected.birthDate}T12:00:00`).toLocaleDateString("pt-BR") : ""} readOnly className="mt-2" /></div><div><Label>Gênero</Label><Input value={selected?.gender ?? ""} readOnly className="mt-2" /></div><div className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><div><p className="text-sm font-medium">Registro {selected?.active ? "ativo" : "inativo"}</p><p className="text-xs text-muted-foreground">Controle a disponibilidade do cadastro.</p></div><Button variant="outline" size="sm" onClick={() => selected && toggleStatus(selected)}><Power className="mr-2 h-3.5 w-3.5" />{selected?.active ? "Inativar" : "Ativar"}</Button></div><Button variant="outline" onClick={() => selected && startEdit(selected)}><Pencil className="mr-2 h-4 w-4" />Editar dados</Button></> : <><div><Label htmlFor="client-form-name">Nome da cliente</Label><Input id="client-form-name" className="mt-2" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome completo" /></div><div><Label htmlFor="client-form-cpf">CPF</Label><Input id="client-form-cpf" className="mt-2" value={form.cpf} onChange={(event) => setForm((current) => ({ ...current, cpf: formatCpf(event.target.value) }))} placeholder="000.000.000-00" inputMode="numeric" /></div><div><Label htmlFor="client-form-birth">Data de nascimento</Label><Input id="client-form-birth" type="date" className="mt-2" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} /></div><div><Label htmlFor="client-form-gender">Gênero</Label><select id="client-form-gender" className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}>{genders.map((gender) => <option key={gender}>{gender}</option>)}</select></div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => { setEditing(false); setSelectedId(selected?.id ?? "CLI-001") }}>Cancelar</Button><Button className="flex-1" onClick={saveClient}>{editing ? "Salvar alterações" : "Cadastrar cliente"}</Button></div></>}</CardContent></Card>
        </div>
      </div>
    </DashboardShell>
  )
}
