"use client"

import { useMemo, useState } from "react"
import { Eye, EyeOff, KeyRound, Pencil, ShieldCheck, UserRound, Users, Activity, UserPlus, Power } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const users = [
  { id: "USR-001", name: "Marina Costa", login: "marina.costa", role: "Administradora", status: "Ativo", since: "12 jan 2026" },
  { id: "USR-002", name: "Juliana Alves", login: "juliana.alves", role: "Profissional", status: "Ativo", since: "03 fev 2026" },
  { id: "USR-003", name: "Renata Silva", login: "renata.silva", role: "Profissional", status: "Ativo", since: "18 mar 2026" },
]

export default function UsuariosPage() {
  const { movements } = useStore()
  const [userList, setUserList] = useState(users)
  const [selectedId, setSelectedId] = useState("USR-001")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", login: "", password: "", confirmPassword: "", role: "Profissional" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [editing, setEditing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Ativo" | "Inativo">("Todos")
  const selected = userList.find((user) => user.id === selectedId) ?? userList[0]

  const userMovements = useMemo(() => {
    if (selected.id === "USR-001") return movements.filter((item) => item.professional.includes("Marina"))
    return []
  }, [movements, selected.id])

  const filteredUsers = statusFilter === "Todos" ? userList : userList.filter((user) => user.status === statusFilter)

  function savePassword() {
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("A confirmação da senha não corresponde.")
      return
    }
    toast.success(`Senha de ${selected.name} atualizada.`)
    setPassword("")
    setConfirmPassword("")
    setEditing(false)
  }

  function toggleUserStatus(userId: string) {
    setUserList((current) => current.map((user) => user.id === userId ? { ...user, status: user.status === "Ativo" ? "Inativo" : "Ativo" } : user))
    const user = userList.find((item) => item.id === userId)
    if (user) toast.success(`${user.name} agora está ${user.status === "Ativo" ? "inativo" : "ativo"}.`)
  }

  function createUser() {
    if (!newUser.name.trim() || !newUser.login.trim() || newUser.password.length < 6) {
      toast.error("Preencha nome, login e uma senha com pelo menos 6 caracteres.")
      return
    }
    if (newUser.password !== newUser.confirmPassword) {
      toast.error("A confirmação da senha não corresponde.")
      return
    }
    if (userList.some((user) => user.login.toLowerCase() === newUser.login.trim().toLowerCase())) {
      toast.error("Este login já está em uso.")
      return
    }
    const created = {
      id: `USR-${String(userList.length + 1).padStart(3, "0")}`,
      name: newUser.name.trim(),
      login: newUser.login.trim(),
      role: newUser.role,
      status: "Ativo",
      since: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    }
    setUserList((current) => [...current, created])
    setSelectedId(created.id)
    setNewUser({ name: "", login: "", password: "", confirmPassword: "", role: "Profissional" })
    setShowCreateForm(false)
    toast.success(`${created.name} foi cadastrado com sucesso.`)
  }

  return (
    <DashboardShell title="Gerenciar Usuários" description="Consulte perfis, atualize acessos e acompanhe a atividade de cada usuário.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="flex items-center gap-3 p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Users className="h-5 w-5" /></div><div><p className="text-2xl font-semibold">{userList.length}</p><p className="text-xs text-muted-foreground">Usuários cadastrados</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-2xl font-semibold">{userList.filter((u) => u.status === "Ativo").length}</p><p className="text-xs text-muted-foreground">Acessos ativos</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Activity className="h-5 w-5" /></div><div><p className="text-2xl font-semibold">{userMovements.length}</p><p className="text-xs text-muted-foreground">Atividades do usuário</p></div></CardContent></Card>
        </div>

        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-primary" />Cadastrar novo usuário</CardTitle><p className="text-sm text-muted-foreground">Crie um acesso para um novo membro da equipe.</p></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="user-name">Nome completo</Label><Input id="user-name" className="mt-2" placeholder="Ex.: Camila Souza" value={newUser.name} onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} /></div>
              <div><Label htmlFor="user-login">Login</Label><Input id="user-login" className="mt-2" placeholder="Ex.: camila.souza" value={newUser.login} onChange={(event) => setNewUser((current) => ({ ...current, login: event.target.value }))} /></div>
              <div><Label htmlFor="user-password">Senha inicial</Label><Input id="user-password" type="password" className="mt-2" placeholder="Mínimo de 6 caracteres" value={newUser.password} onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))} /></div>
              <div><Label htmlFor="user-confirm-password">Confirmar senha</Label><Input id="user-confirm-password" type="password" className="mt-2" placeholder="Repita a senha inicial" value={newUser.confirmPassword} onChange={(event) => setNewUser((current) => ({ ...current, confirmPassword: event.target.value }))} /></div>
              <div><Label htmlFor="user-role">Perfil de acesso</Label><select id="user-role" className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value }))}><option>Profissional</option><option>Operador</option><option>Administradora</option></select></div>
              <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancelar</Button><Button type="button" onClick={createUser}>Cadastrar usuário</Button></div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-end"><Button onClick={() => setShowCreateForm(true)}><UserPlus className="mr-2 h-4 w-4" />Cadastrar usuário</Button></div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Usu��rios cadastrados</CardTitle>
              <div className="mt-4 flex rounded-lg bg-muted p-1" role="group" aria-label="Filtrar usuários por status">
                {(["Todos", "Ativo", "Inativo"] as const).map((status) => (
                  <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === status ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`} aria-pressed={statusFilter === status}>{status}</button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {filteredUsers.map((user) => (
                <div key={user.id} role="button" tabIndex={0} onClick={() => setSelectedId(user.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(user.id) }} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected.id === user.id ? "border-primary bg-secondary/70" : "border-border hover:bg-muted"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{user.name.split(" ").map((part) => part[0]).join("")}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.login}</p></div>
                  <Badge variant="secondary" className="text-[10px]">{user.status}</Badge>
                  <Button type="button" size="icon" variant="ghost" onClick={(event) => { event.stopPropagation(); toggleUserStatus(user.id) }} aria-label={`${user.status === "Ativo" ? "Inativar" : "Ativar"} ${user.name}`}><Power className="h-4 w-4" /></Button>
                </div>
              ))}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Selecione um usuário para visualizar seus dados e relatório de atividades.</p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" />Dados do usuário</CardTitle><p className="mt-1 text-sm text-muted-foreground">Informações de acesso e identificação</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant={selected.status === "Ativo" ? "default" : "secondary"}>{selected.status}</Badge><Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)}><Pencil className="mr-2 h-3.5 w-3.5" />{editing ? "Cancelar" : "Editar"}</Button></div></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div><Label>ID do usuário</Label><Input value={selected.id} readOnly className="mt-2 bg-muted/40 font-mono text-xs" /></div>
                <div><Label>Nome completo</Label><Input value={selected.name} readOnly={!editing} className="mt-2" /></div>
                <div><Label>Login</Label><Input value={selected.login} readOnly={!editing} className="mt-2" /></div>
                <div><Label>Perfil de acesso</Label><Input value={selected.role} readOnly className="mt-2 bg-muted/40" /></div>
                <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2"><div><Separator className="mb-4 sm:col-span-2" /><Label htmlFor="new-password">Senha para alterar</Label><div className="relative mt-2"><KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="new-password" type={showPassword ? "text" : "password"} placeholder="Digite uma nova senha" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9 pr-10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-muted-foreground" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div><Label htmlFor="confirm-new-password">Confirmar nova senha</Label><div className="relative mt-2"><Input id="confirm-new-password" type={showConfirmPassword ? "text" : "password"} placeholder="Repita a nova senha" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="pr-10" /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-2.5 text-muted-foreground" aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><p className="text-xs text-muted-foreground sm:col-span-2">A senha deve conter pelo menos 6 caracteres e ser repetida no campo de confirmação.</p></div>
                {editing && <div className="sm:col-span-2 flex justify-end"><Button onClick={savePassword}>Salvar alterações</Button></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" />Relatório do usuário</CardTitle><p className="text-sm text-muted-foreground">Procedimentos registrados por {selected.name}</p></CardHeader>
              <CardContent>
                {userMovements.length > 0 ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Procedimento</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead>Produtos baixados</TableHead></TableRow></TableHeader><TableBody>{userMovements.map((movement) => <TableRow key={movement.id}><TableCell className="font-medium">{movement.procedureName}</TableCell><TableCell>{movement.client || "Não informado"}</TableCell><TableCell>{new Date(movement.date).toLocaleDateString("pt-BR")}</TableCell><TableCell><Badge variant="outline">{movement.consumption.length} itens</Badge></TableCell></TableRow>)}</TableBody></Table></div> : <div className="rounded-xl border border-dashed p-8 text-center"><p className="text-sm font-medium">Nenhuma atividade registrada</p><p className="mt-1 text-xs text-muted-foreground">O relatório deste usuário aparecerá aqui após o primeiro procedimento.</p></div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
