"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { UserRound, UserPlus, Pencil, Power, Search, X } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RequiredMessage }  from "@/components/ui/requiredMessage"
import { Required } from "@/components/ui/required"


import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { states } from "@/lib/states"
import { spCities } from "@/lib/spCities" 

const genders = ["Feminino", "Masculino", "Outros"]

const apiUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5139"}/api/Cliente`

type Client = {
  id: number
  name: string
  cpf: string
  birthDate: string
  gender: string
  active: boolean
  /** Endereço */
  estado: string
  cidade: string
  endereco: string
  numero: string
  complemento: string
  cep: string
}

const emptyClient = {
  name: "",
  cpf: "",
  birthDate: "",
  gender: "Feminino",
  estado: "",
  cidade: "",
  endereco: "",
  numero: "",
  complemento: "",
  cep: "",
}

type ClienteApi = {
  cliId: number
  cliNome: string
  cliCpf: string
  cliDataNascimento: string
  cliGenero: string
  cliAtivo: string
  /** Campos de endereço */
  cliEstado: string
  cliCidade: string
  cliEndereco: string
  cliEnderecoNumero: string
  cliComplemento: string
  cliCep: string
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function toClient(cliente: ClienteApi): Client {
  return {
    id: cliente.cliId,
    name: cliente.cliNome,
    cpf: formatCpf(cliente.cliCpf ?? ""),
    birthDate: cliente.cliDataNascimento.slice(0, 10),
    gender: cliente.cliGenero,
    active: cliente.cliAtivo === "A",
    /** Endereço */
    estado: cliente.cliEstado ?? "",
    cidade: cliente.cliCidade ?? "",
    endereco: cliente.cliEndereco ?? "",
    numero: cliente.cliEnderecoNumero ?? "",
    complemento: cliente.cliComplemento ?? "",
    cep: cliente.cliCep ?? "",
  }
}

async function getErrorMessage(response: Response) {
  const body = await response.json().catch(() => null)
  return body?.mensagem ?? "Não foi possível concluir a operação. Tente novamente."
}

function validarCpf(cpf: string) {
  const numeros = cpf.replace(/\D/g, "")

  // CPF precisa ter 11 dígitos
  if (numeros.length !== 11) {
    return false
  }

  // Impede CPFs com todos os números iguais
  if (/^(\d)\1{10}$/.test(numeros)) {
    return false
  }

  // Calcula o primeiro dígito verificador
  let soma = 0

  for (let i = 0; i < 9; i++) {
    soma += Number(numeros[i]) * (10 - i)
  }

  let resto = soma % 11
  let digito1 = resto < 2 ? 0 : 11 - resto

  if (digito1 !== Number(numeros[9])) {
    return false
  }

  // Calcula o segundo dígito verificador
  soma = 0

  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i)
  }

  resto = soma % 11
  let digito2 = resto < 2 ? 0 : 11 - resto

  if (digito2 !== Number(numeros[10])) {
    return false
  }

  return true
}



export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [nameFilter, setNameFilter] = useState("")
  const [cpfFilter, setCpfFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Ativos" | "Inativos">(
    "Todos"
  )
  const [form, setForm] = useState(emptyClient)
  const [editing, setEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const selected = clients.find((client) => client.id === selectedId) ?? null

  const loadClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error(await getErrorMessage(response))
      const data: ClienteApi[] = await response.json()
      setClients(data.map(toClient))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as clientes.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadClients()
  }, [loadClients])

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const matchesName = client.name.toLowerCase().includes(nameFilter.toLowerCase())
        const matchesCpf = client.cpf.replace(/\D/g, "").includes(cpfFilter.replace(/\D/g, ""))
        const matchesStatus =
          statusFilter === "Todos" ||
          (statusFilter === "Ativos" ? client.active : !client.active)
        return matchesName && matchesCpf && matchesStatus
      }),
    [clients, nameFilter, cpfFilter, statusFilter]
  )

  function startCreate() {
    setEditing(false)
    setSelectedId(null)
    setForm(emptyClient)
  }

  function startEdit(client: Client) {
    setSelectedId(client.id)
    setForm({
      name: client.name,
      cpf: client.cpf,
      birthDate: client.birthDate,
      gender: client.gender,
      estado: client.estado ?? "",
      cidade: client.cidade ?? "",
      endereco: client.endereco ?? "",
      numero: client.numero ?? "",
      complemento: client.complemento ?? "",
      cep: client.cep ?? "",
    })
    setEditing(true)
  }

  function verificarIdade(dataNascimento: string) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const mes = hoje.getMonth() - nascimento.getMonth();

    if (
        mes < 0 ||
        (mes === 0 && hoje.getDate() < nascimento.getDate())
    ) {
        idade--;
    }

    return idade <= 10;
}

  async function saveClient() {
    if (
      !form.name.trim() ||
      !validarCpf(form.cpf) ||
      !form.birthDate ||
      !form.gender
    ) {
      toast.error("Preencha nome, CPF válido, data de nascimento e gênero.")
      return
    }
    if (verificarIdade(form.birthDate)) {
      toast.error("Cliente possui menos que 10 anos ou menos.")
      return
    }

    if (
      !form.cep || !form.endereco || !form.estado || !form.cidade
    ) {
      toast.error("Preencha CEP, endereço, estado e cidade.")
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        cliNome: form.name.trim(),
        cliGenero: form.gender,
        cliDataNascimento: form.birthDate,
        // Endereço fields
        cliEstado: form.estado,
        cliCidade: form.cidade,
        cliEndereco: form.endereco,
        cliEnderecoNumero: form.numero,
        cliComplemento: form.complemento,
        cliCep: form.cep,
        ...(editing
          ? { cliAtivo: selected?.active ? "A" : "I" }
          : { cliAtivo: "A", cliCpf: form.cpf.replace(/\D/g, "") }),
      }
      const response = await fetch(editing && selected ? `${apiUrl}/${selected.id}` : apiUrl, {
        method: editing && selected ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))
      await loadClients()
      setEditing(false)
      toast.success(editing ? "Dados da cliente atualizados." : "Cliente cadastrada com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a cliente.")
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus(client: Client) {
    setIsSaving(true)
    try {
      const response = client.active
        ? await fetch(`${apiUrl}/${client.id}`, { method: "DELETE" })
        : await fetch(`${apiUrl}/${client.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliAtivo: "A" }),
        })
      if (!response.ok) throw new Error(await getErrorMessage(response))
      await loadClients()
      toast.success(`${client.name} foi ${client.active ? "inativada" : "ativada"}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o status da cliente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardShell title="Gerenciar Clientes" description="Cadastre, consulte e mantenha os registros dos seuss clientes atualizados.">
      <div className="flex flex-col gap-6">
        {/* Resumo de contagens */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-semibold">{clients.length}</p>
              <p className="text-xs text-muted-foreground">Total de clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-semibold text-primary">{clients.filter((c) => c.active).length}</p>
              <p className="text-xs text-muted-foreground">Registros ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-semibold text-muted-foreground">{clients.filter((c) => !c.active).length}</p>
              <p className="text-xs text-muted-foreground">Registros inativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e botão de nova cliente */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-end">
          <div className="flex-1">
            <Label htmlFor="client-name-filter">Nome do cliente</Label> 
            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-name-filter"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Buscar por nome"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1">
            <Label htmlFor="client-cpf-filter">CPF</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="client-cpf-filter"
                value={cpfFilter}
                onChange={(e) => setCpfFilter(formatCpf(e.target.value))}
                placeholder="Buscar por CPF"
                className="pl-9"
                inputMode="numeric"
              />
            </div>
          </div>
          <div
            className="flex rounded-lg bg-muted p-1"
            role="group"
            aria-label="Filtrar clientes por status"
          >
            {statusFilter !== "Todos" || nameFilter || cpfFilter ? (
              <button
                type="button"
                onClick={() => {
                  setNameFilter("")
                  setCpfFilter("")
                  setStatusFilter("Todos")
                }}
                className="mr-1 rounded-md px-2 text-muted-foreground"
                aria-label="Limpar filtros"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            {(["Todos", "Ativos", "Inativos"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  statusFilter === status
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground"
                }`}
                aria-pressed={statusFilter === status}
              >
                {status}
              </button>
            ))}
          </div>
          <Button onClick={startCreate} disabled={isSaving}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        </div>

        {/* Tabela + Formulário */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_600px]">
          {/* Lista de clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4 text-primary" />
                Clientes cadastradas <span className="text-xs font-normal text-muted-foreground">({filteredClients.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">CPF</th>
                      <th className="pb-3 font-medium">Gênero</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className={`border-b last:border-0 ${selectedId === client.id ? "bg-secondary/40" : ""
                          }`}
                      >
                        <td className="py-4">
                          <button type="button" onClick={() => setSelectedId(client.id)} className="text-left">
                            <p className="font-medium">{client.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{client.id}</p>
                          </button>
                        </td>
                        <td className="py-4 text-muted-foreground">{client.cpf}</td>
                        <td className="py-4 text-muted-foreground">{client.gender}</td>
                        <td className="py-4">
                          <Badge variant={client.active ? "default" : "secondary"}>
                            {client.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isSaving}
                              onClick={() => startEdit(client)}
                              aria-label={`Editar ${client.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isSaving}
                              onClick={() => toggleStatus(client)}
                              aria-label={`${client.active ? "Inativar" : "Ativar"} ${client.name}`}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isLoading ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Carregando clientes...
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado com esses filtros.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Formulário de criação/edição */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">
                {editing ? "Editar cliente" : selectedId !== null ? "Dados da cliente" : "Cadastrar cliente"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {editing ? <RequiredMessage/> : selectedId !== null ? "" : <RequiredMessage/>}

              </p>
              
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {/* VISUALIZAÇÃO (quando só selecionou) */}
              {selectedId !== null && !editing ? (
                <>
                  <div>
                    <Label>ID do registro</Label>
                    <Input value={selected?.id ?? ""} readOnly className="mt-2 bg-muted/40 font-mono text-xs" />
                  </div>
                  <div>
                    <Label>Nome do cliente</Label>
                    <Input value={selected?.name ?? ""} readOnly className="mt-2" />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input value={selected?.cpf ?? ""} readOnly className="mt-2" />
                  </div>
                  <div>
                    <Label>Data de nascimento </Label> 
                    <Input
                      value={selected?.birthDate ? new Date(`${selected.birthDate}T12:00:00`).toLocaleDateString("pt-BR") : ""}
                      readOnly
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Gênero</Label>
                    <Input value={selected?.gender ?? ""} readOnly className="mt-2" />
                  </div>
                  {/* Endereço (visualização) */}
                  <div>
                    <Label>CEP</Label>
                    <Input value={selected?.cep ?? ""} readOnly className="mt-2" />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input value={selected?.estado ?? ""} readOnly className="mt-2" />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input value={selected?.cidade ?? ""} readOnly className="mt-2" />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input value={selected?.endereco ?? ""} readOnly className="mt-2" />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input value={selected?.numero ?? ""} readOnly className="mt-2" />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input value={selected?.complemento ?? ""} readOnly className="mt-2" />
                  </div>
                  

                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium">
                        Registro {selected?.active ? "ativo" : "inativo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Controle a disponibilidade do cadastro.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => selected && toggleStatus(selected)}
                    >
                      <Power className="mr-2 h-3.5 w-3.5" />
                      {selected?.active ? "Inativar" : "Ativar"}
                    </Button>
                  </div>

                  <Button variant="outline" disabled={isSaving} onClick={() => selected && startEdit(selected)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar dados
                  </Button>
                </>
              ) : (
                /* FORMULÁRIO DE CADASTRO/EDIÇÃO */
                <>
                  <div>
                    <Label htmlFor="client-form-name">Nome do cliente<Required/></Label> 
                    <Input
                      id="client-form-name"
                      className="mt-2"
                      value={form.name}
                      onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="client-form-cpf">CPF <Required/></Label>
                    <Input
                      id="client-form-cpf"
                      className="mt-2"
                      value={form.cpf}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, cpf: formatCpf(e.target.value) }))
                      }
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <Label htmlFor="client-form-birth">Data de nascimento <Required/></Label>
                    <Input
                      id="client-form-birth"
                      type="date"
                      className="mt-2"
                      value={form.birthDate}
                      onChange={(e) => setForm((c) => ({ ...c, birthDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="client-form-gender">Gênero</Label>
                    <select
                      id="client-form-gender"
                      className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={form.gender}
                      onChange={(e) => setForm((c) => ({ ...c, gender: e.target.value }))}
                    >
                      {genders.map((gender) => (
                        <option key={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>

                  {/* ==== ENDEREÇO ==== */}
                  {/* CEP */}
                  <div>
                    <Label htmlFor="client-form-cep">CEP <Required/></Label>
                    <Input
                      id="client-form-cep"
                      className="mt-2"
                      value={form.cep}
                      onChange={(e) => setForm((c) => ({ ...c, cep: e.target.value }))}
                      placeholder="00000-000"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <Label htmlFor="client-form-estado">Estado <Required/></Label>
                    <Select
                      value={form.estado}
                      onValueChange={(value) => setForm((c) => ({ ...c, estado: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cidade – só São Paulo */}
                  <div>
                    <Label htmlFor="client-form-cidade">Cidade <Required/></Label>
                    <Select
                      value={form.cidade}
                      onValueChange={(value) => setForm((c) => ({ ...c, cidade: value }))}
                      disabled={!form.estado}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {spCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Endereço */}
                  <div>
                    <Label htmlFor="client-form-endereco">Endereço <Required/></Label>
                    <Input
                      id="client-form-endereco"
                      className="mt-2"
                      value={form.endereco}
                      onChange={(e) => setForm((c) => ({ ...c, endereco: e.target.value }))}
                      placeholder="Rua Duquesa Swan..."
                    />
                  </div>

                   {/* Número */}
                  <div>
                    <Label htmlFor="client-form-numero">Número</Label>
                    <Input
                      id="client-form-numero"
                      className="mt-2"
                      value={form.numero}
                      onChange={(e) => setForm((c) => ({ ...c, numero: e.target.value }))}
                      placeholder="0000"
                    />
                  </div>


                  {/* Complemento */}
                  <div>
                    <Label htmlFor="client-form-complemento">Complemento</Label>
                    <Input
                      id="client-form-complemento"
                      className="mt-2"
                      value={form.complemento}
                      onChange={(e) => setForm((c) => ({ ...c, complemento: e.target.value }))}
                      placeholder="Apto, bloco..."
                    />
                  </div>

                  

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={isSaving}
                      onClick={() => {
                        setEditing(false)
                        setSelectedId(selected?.id ?? null)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button className="flex-1" disabled={isSaving} onClick={saveClient}>
                      {isSaving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar cliente"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}