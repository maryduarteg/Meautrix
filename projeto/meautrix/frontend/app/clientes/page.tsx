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
import { RequiredMessage } from "@/components/ui/requiredMessage"
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

function formatCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2")
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
    cep: formatCep(cliente.cliCep ?? ""),
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
  const digito1 = resto < 2 ? 0 : 11 - resto

  if (digito1 !== Number(numeros[9])) {
    return false
  }

  // Calcula o segundo dígito verificador
  soma = 0

  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i)
  }

  resto = soma % 11
  const digito2 = resto < 2 ? 0 : 11 - resto

  if (digito2 !== Number(numeros[10])) {
    return false
  }

  return true
}

type FieldErrors = Partial<Record<string, string>>

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="mt-1 text-xs text-destructive">{error}</p>
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [nameFilter, setNameFilter] = useState("")
  const [cpfFilter, setCpfFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Ativos" | "Inativos">(
    "Todos"
  )
  const [form, setForm] = useState(emptyClient)
  const [editing, setEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const selected = clients.find((client) => client.id === selectedId) ?? null

  /** Abre o formulário para cadastrar um novo cliente */
  function startCreate() {
    setSelectedId(null)
    setEditing(false)
    setFieldErrors({})
    setForm(emptyClient)
    setShowForm(true)
  }

  /** Abre o formulário preenchido para editar um cliente */
  function startEdit(client: Client) {
    setShowForm(true)
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
    setFieldErrors({})
  }

  /** Fecha o formulário / visualização e limpa o estado */
  function closeForm() {
    setShowForm(false)
    setEditing(false)
    setSelectedId(null)
    setForm(emptyClient)
    setFieldErrors({})
  }

  /** Abre apenas a visualização dos dados do cliente */
  function viewClient(client: Client) {
    setSelectedId(client.id)
    setShowForm(false)
    setEditing(false)
    setFieldErrors({})
  }

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

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function verificarIdade(dataNascimento: string) {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)

    let idade = hoje.getFullYear() - nascimento.getFullYear()

    const mes = hoje.getMonth() - nascimento.getMonth()

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }

    return idade <= 10
  }

  function validateForm(): boolean {
    const errors: FieldErrors = {}

    if (!form.name.trim()) {
      errors.name = "Informe o nome do cliente."
    }
    if (!validarCpf(form.cpf)) {
      errors.cpf = form.cpf.replace(/\D/g, "").length === 0
        ? "Informe o CPF."
        : "CPF inválido."
    }
    if (!form.birthDate) {
      errors.birthDate = "Informe a data de nascimento."
    } else if (verificarIdade(form.birthDate)) {
      errors.birthDate = "Cliente deve ter mais de 10 anos."
    }
    if (!form.cep) {
      errors.cep = "Informe o CEP."
    } else if (!/^\d{5}-\d{3}$/.test(form.cep)) {
      errors.cep = "Informe um CEP com 8 dígitos."
    }
    if (!form.estado) {
      errors.estado = "Selecione o estado."
    }
    if (!form.cidade) {
      errors.cidade = "Selecione a cidade."
    }
    if (!form.endereco) {
      errors.endereco = "Informe o endereço."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveClient() {
    if (!validateForm()) {
      return
    }
    const wasEditing = editing
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
        cliCep: form.cep.replace(/\D/g, ""),
        ...(wasEditing
          ? { cliAtivo: selected?.active ? "A" : "I" }
          : { cliAtivo: "A", cliCpf: form.cpf.replace(/\D/g, "") }),
      }
      const response = await fetch(wasEditing && selected ? `${apiUrl}/${selected.id}` : apiUrl, {
        method: wasEditing && selected ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response))
      await loadClients()
      closeForm()
      toast.success(wasEditing ? "Dados da cliente atualizados." : "Cliente cadastrada com sucesso.")
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
    <DashboardShell title="Gerenciar Clientes" description="Cadastre, consulte e mantenha os registros dos seus clientes atualizados.">
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

        {/* Filtros e botão de novo cliente */}
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
        <div className="flex flex-col gap-6">
          {/* Formulário de criação/edição/visualização: só aparece quando necessário */}
          {(showForm || selectedId !== null) && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">
                  {editing ? "Editar cliente" : selectedId !== null ? "Dados da cliente" : "Cadastrar cliente"}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {editing ? <RequiredMessage /> : selectedId !== null ? "" : <RequiredMessage />}
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-12 gap-4">
                {/* VISUALIZAÇÃO (quando só selecionou) */}
                {selectedId !== null && !editing ? (
                  <>
                    <div className="col-span-12 md:col-span-3">
                      <Label>ID do registro</Label>
                      <Input value={selected?.id ?? ""} readOnly className="mt-2 bg-muted/40 font-mono text-xs" />
                    </div>
                    <div className="col-span-12 md:col-span-9">
                      <Label>Nome do cliente</Label>
                      <Input value={selected?.name ?? ""} readOnly className="mt-2" />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <Label>CPF</Label>
                      <Input value={selected?.cpf ?? ""} readOnly className="mt-2" />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <Label>Data de nascimento</Label>
                      <Input
                        value={selected?.birthDate ? new Date(`${selected.birthDate}T12:00:00`).toLocaleDateString("pt-BR") : ""}
                        readOnly
                        className="mt-2"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <Label>Gênero</Label>
                      <Input value={selected?.gender ?? ""} readOnly className="mt-2" />
                    </div>

                    {/* Endereço (visualização) */}
                    <div className="col-span-12 md:col-span-3">
                      <Label>CEP</Label>
                      <Input value={selected?.cep ?? ""} readOnly className="mt-2" />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <Label>Estado</Label>
                      <Input value={selected?.estado ?? ""} readOnly className="mt-2" />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <Label>Cidade</Label>
                      <Input value={selected?.cidade ?? ""} readOnly className="mt-2" />
                    </div>
                    <div className="col-span-12 md:col-span-7">
                      <Label>Endereço</Label>
                      <Input value={selected?.endereco ?? ""} readOnly className="mt-2" />
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <Label>Número</Label>
                      <Input value={selected?.numero ?? ""} readOnly className="mt-2" />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <Label>Complemento</Label>
                      <Input value={selected?.complemento ?? ""} readOnly className="mt-2" />
                    </div>

                    <div className="col-span-12 flex items-center justify-between rounded-lg bg-muted/50 p-3">
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

                    <div className="col-span-12 flex flex-col gap-2 md:flex-row md:justify-end">
                      <Button variant="ghost" disabled={isSaving} onClick={closeForm}>
                        Fechar
                      </Button>
                      <Button variant="outline" disabled={isSaving} onClick={() => selected && startEdit(selected)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar dados
                      </Button>
                    </div>
                  </>
                ) : (
                  /* FORMULÁRIO DE CADASTRO/EDIÇÃO */
                  <>
                    {/* Nome */}
                    <div className="col-span-12">
                      <Label htmlFor="client-form-name">Nome do cliente<Required /></Label>
                      <Input
                        id="client-form-name"
                        className={`mt-2 ${fieldErrors.name ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        value={form.name}
                        onChange={(e) => {
                          setForm((c) => ({ ...c, name: e.target.value }))
                          clearFieldError("name")
                        }}
                        placeholder="Nome completo"
                      />
                      <FieldError error={fieldErrors.name} />
                    </div>

                    {/* CPF + Data de nascimento + Gênero na mesma linha */}
                    <div className="col-span-12 md:col-span-4">
                      <Label htmlFor="client-form-cpf">CPF <Required /></Label>
                      <Input
                        id="client-form-cpf"
                        className={`mt-2 ${fieldErrors.cpf ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        value={form.cpf}
                        onChange={(e) => {
                          setForm((c) => ({ ...c, cpf: formatCpf(e.target.value) }))
                          clearFieldError("cpf")
                        }}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                      <FieldError error={fieldErrors.cpf} />
                    </div>

                    <div className="col-span-12 md:col-span-4">
                      <Label htmlFor="client-form-birth">Data de nascimento <Required /></Label>
                      <Input
                        id="client-form-birth"
                        type="date"
                        className={`mt-2 ${fieldErrors.birthDate ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        value={form.birthDate}
                        onChange={(e) => {
                          setForm((c) => ({ ...c, birthDate: e.target.value }))
                          clearFieldError("birthDate")
                        }}
                      />
                      <FieldError error={fieldErrors.birthDate} />
                    </div>

                    <div className="col-span-12 md:col-span-4">
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
                    {/* CEP + Estado + Cidade na mesma linha */}
                    <div className="col-span-12 md:col-span-3">
                      <Label htmlFor="client-form-cep">CEP <Required /></Label>
                      <Input
                        id="client-form-cep"
                        inputMode="numeric"
                        maxLength={9}
                        autoComplete="postal-code"
                        className={`mt-2 ${fieldErrors.cep ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        value={form.cep}
                        onChange={(e) => {
                          setForm((c) => ({ ...c, cep: formatCep(e.target.value) }))
                          clearFieldError("cep")
                        }}
                        placeholder="00000-000"
                      />
                      <FieldError error={fieldErrors.cep} />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <Label htmlFor="client-form-estado">Estado <Required /></Label>
                      <Select
                        value={form.estado}
                        onValueChange={(value) => {
                          setForm((c) => ({ ...c, estado: value }))
                          clearFieldError("estado")
                        }}
                      >
                        <SelectTrigger className={`mt-2 w-full ${fieldErrors.estado ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
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
                      <FieldError error={fieldErrors.estado} />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <Label htmlFor="client-form-cidade">Cidade <Required /></Label>
                      <Select
                        value={form.cidade}
                        onValueChange={(value) => {
                          setForm((c) => ({ ...c, cidade: value }))
                          clearFieldError("cidade")
                        }}
                        disabled={!form.estado}
                      >
                        <SelectTrigger className={`mt-2 w-full ${fieldErrors.cidade ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
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
                      <FieldError error={fieldErrors.cidade} />
                    </div>

                    {/* Endereço + Número + Complemento na mesma linha */}
                    <div className="col-span-12 md:col-span-7">
                      <Label htmlFor="client-form-endereco">Endereço <Required /></Label>
                      <Input
                        id="client-form-endereco"
                        className={`mt-2 ${fieldErrors.endereco ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        value={form.endereco}
                        onChange={(e) => {
                          setForm((c) => ({ ...c, endereco: e.target.value }))
                          clearFieldError("endereco")
                        }}
                        placeholder="Rua Duquesa Swan..."
                      />
                      <FieldError error={fieldErrors.endereco} />
                    </div>

                    <div className="col-span-12 md:col-span-2">
                      <Label htmlFor="client-form-numero">Número</Label>
                      <Input
                        id="client-form-numero"
                        className="mt-2"
                        value={form.numero}
                        onChange={(e) => setForm((c) => ({ ...c, numero: e.target.value }))}
                        placeholder="0000"
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <Label htmlFor="client-form-complemento">Complemento</Label>
                      <Input
                        id="client-form-complemento"
                        className="mt-2"
                        value={form.complemento}
                        onChange={(e) => setForm((c) => ({ ...c, complemento: e.target.value }))}
                        placeholder="Apto, bloco..."
                      />
                    </div>

                    {/* Botões */}
                    <div className="col-span-12 flex gap-2 md:justify-end">
                      <Button
                        variant="outline"
                        className="flex-1 md:flex-none"
                        disabled={isSaving}
                        onClick={closeForm}
                      >
                        Cancelar
                      </Button>
                      <Button className="flex-1 md:flex-none" disabled={isSaving} onClick={saveClient}>
                        {isSaving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar cliente"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

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
                        className={`border-b last:border-0 ${selectedId === client.id ? "bg-secondary/40" : ""}`}
                      >
                        <td className="py-4">
                          <button
                            type="button"
                            onClick={() => viewClient(client)}
                            className="text-left"
                          >
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
        </div>
      </div>
    </DashboardShell>
  )
}
