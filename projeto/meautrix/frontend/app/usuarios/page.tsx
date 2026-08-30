"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
import { Eye, EyeOff, KeyRound, Pencil, ShieldCheck, UserRound, Users, Activity, UserPlus, Power, Loader2 } from "lucide-react"
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

export interface User {
  usuId: number
  usuNome: string
  usuLogin: string
  usuEAdmin: string // 'S' (Admin) ou 'N' (Operador)
  usuAtivo: string  // 'A' (Ativo) ou 'I' (Inativo)
}

export default function UsuariosPage() {
  const { movements } = useStore()
  const API_URL = "http://localhost:5139/api/usuarios"

  const [userList, setUserList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")

  // Form de edição
  const [editData, setEditData] = useState({
    usuNome: "",
    usuLogin: "",
    usuEAdmin: "N",
    usuAtivo: "A",
    usuSenha: "",
  })

  // Form de criação
  const [newUser, setNewUser] = useState({
    usuNome: "",
    usuLogin: "",
    usuSenha: "",
    confirmarSenha: "",
    usuEAdmin: "N",
  })
  
  const [showPassword, setShowPassword] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error("Falha ao carregar usuários.")

      const rawData = await response.json()
      const normalizedData: User[] = rawData.map((u: any) => ({
        usuId: u.usuId ?? u.UsuId,
        usuNome: u.usuNome ?? u.UsuNome ?? "",
        usuLogin: u.usuLogin ?? u.UsuLogin ?? "",
        usuEAdmin: String(u.usuEAdmin ?? u.UsuEAdmin ?? "N").toUpperCase(),
        usuAtivo: String(u.usuAtivo ?? u.UsuAtivo ?? "A").toUpperCase(),
      }))

      setUserList(normalizedData)
      if (normalizedData.length > 0 && selectedId === null) {
        setSelectedId(normalizedData[0].usuId)
      }
    } catch {
      toast.error("Não foi possível conectar com a API de usuários.")
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const selected = useMemo(() => {
    return userList.find((u) => u.usuId === selectedId) || userList[0] || null
  }, [userList, selectedId])

  // Preenche o formulário de edição ao selecionar/editar usuário
  useEffect(() => {
    if (selected) {
      setEditData({
        usuNome: selected.usuNome,
        usuLogin: selected.usuLogin,
        usuEAdmin: selected.usuEAdmin,
        usuAtivo: selected.usuAtivo,
        usuSenha: "",
      })
    }
  }, [selected, editing])

  const userMovements = useMemo(() => {
    if (!selected?.usuNome) return []
    return movements.filter((item) =>
      item.professional ? item.professional.toLowerCase().includes(selected.usuNome.toLowerCase()) : false
    )
  }, [movements, selected])

  // Filtro correto usando 'A' (Ativo) e 'I' (Inativo)
  const filteredUsers = useMemo(() => {
    if (statusFilter === "Todos") return userList
    return userList.filter((u) => u.usuAtivo === statusFilter)
  }, [userList, statusFilter])

  const getInitials = (nome: string) => {
    if (!nome) return "U"
    return nome
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  // Alterar usuário via PUT /api/usuarios/{id}
async function updateUser() {
  if (!selected) return
  if (!editData.usuNome.trim() || !editData.usuLogin.trim()) {
    return toast.error("Nome e login são obrigatórios.")
  }

  try {
    setSubmitting(true)

    const payload = {
      usuId: selected.usuId,
      usuNome: editData.usuNome.trim(),
      usuLogin: editData.usuLogin.trim(),
      usuEAdmin: editData.usuEAdmin || selected.usuEAdmin || "N",
      usuAtivo: editData.usuAtivo || selected.usuAtivo || "A",
      usuSenha: editData.usuSenha.trim() || undefined
    }

    const response = await fetch(`${API_URL}/${selected.usuId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error()

    toast.success("Usuário atualizado com sucesso!")
    setEditing(false)
    fetchUsers()
  } catch {
    toast.error("Erro ao atualizar usuário.")
  } finally {
    setSubmitting(false)
  }
}

  // Inativar / Ativar via DELETE ou PUT
  async function toggleUserStatus(usuId: number) {
    const user = userList.find((u) => u.usuId === usuId)
    if (!user) return

    try {
      if (user.usuAtivo === "A") {
        const response = await fetch(`${API_URL}/${usuId}`, { method: "DELETE" })
        if (!response.ok) throw new Error()
      } else {
        const response = await fetch(`${API_URL}/${usuId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...user,
            usuAtivo: "A",
          }),
        })
        if (!response.ok) throw new Error()
      }

      toast.success("Status alterado com sucesso!")
      fetchUsers()
    } catch {
      toast.error("Não foi possível alterar o status.")
    }
  }

  // Criar Usuário via POST /api/usuarios
  async function createUser() {
    if (!newUser.usuNome.trim() || !newUser.usuLogin.trim() || newUser.usuSenha.length < 6) {
      return toast.error("Preencha todos os campos corretamente (senha mín. 6 caracteres).")
    }
    if (newUser.usuSenha !== newUser.confirmarSenha) {
      return toast.error("As senhas não coincidem.")
    }

    try {
      setSubmitting(true)
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuNome: newUser.usuNome.trim(),
          usuLogin: newUser.usuLogin.trim(),
          usuSenha: newUser.usuSenha,
          usuEAdmin: newUser.usuEAdmin,
          usuAtivo: "A",
        }),
      })

      if (!response.ok) throw new Error()

      toast.success("Usuário cadastrado com sucesso!")
      setNewUser({ usuNome: "", usuLogin: "", usuSenha: "", confirmarSenha: "", usuEAdmin: "N" })
      setShowCreateForm(false)
      fetchUsers()
    } catch {
      toast.error("Erro ao cadastrar usuário.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell title="Gerenciar Usuários" description="Consulte perfis, atualize acessos e acompanhe a atividade de cada usuário.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{userList.length}</p>
                <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{userList.filter((u) => u.usuAtivo === "A").length}</p>
                <p className="text-xs text-muted-foreground">Acessos ativos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{userMovements.length}</p>
                <p className="text-xs text-muted-foreground">Atividades do usuário</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4 text-primary" />Cadastrar novo usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="user-nome">Nome completo</Label>
                <Input id="user-nome" className="mt-2" placeholder="Ex.: Camila Souza" value={newUser.usuNome} onChange={(e) => setNewUser((p) => ({ ...p, usuNome: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="user-login">Login</Label>
                <Input id="user-login" className="mt-2" placeholder="Ex.: camila.souza" value={newUser.usuLogin} onChange={(e) => setNewUser((p) => ({ ...p, usuLogin: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="user-senha">Senha inicial</Label>
                <Input id="user-senha" type="password" className="mt-2" placeholder="Mínimo de 6 caracteres" value={newUser.usuSenha} onChange={(e) => setNewUser((p) => ({ ...p, usuSenha: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="user-confirmar-senha">Confirmar senha</Label>
                <Input id="user-confirmar-senha" type="password" className="mt-2" placeholder="Repita a senha inicial" value={newUser.confirmarSenha} onChange={(e) => setNewUser((p) => ({ ...p, confirmarSenha: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="user-admin">Perfil de acesso</Label>
                <select id="user-admin" className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={newUser.usuEAdmin} onChange={(e) => setNewUser((p) => ({ ...p, usuEAdmin: e.target.value }))}>
                  <option value="N">Operador</option>
                  <option value="S">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={submitting}>Cancelar</Button>
                <Button type="button" onClick={createUser} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar usuário
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateForm(true)}>
              <UserPlus className="mr-2 h-4 w-4" />Cadastrar usuário
            </Button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />Usuários cadastrados
              </CardTitle>
              <div className="mt-4 flex rounded-lg bg-muted p-1">
                {[
                  { label: "Todos", value: "Todos" },
                  { label: "Ativo", value: "A" },
                  { label: "Inativo", value: "I" },
                ].map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setStatusFilter(st.value as any)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === st.value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {loading ? (
                <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filteredUsers.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Nenhum usuário encontrado.</p>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.usuId}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedId(u.usuId); setEditing(false); }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${selected?.usuId === u.usuId ? "border-primary bg-secondary/70" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(u.usuNome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.usuNome}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.usuLogin}</p>
                    </div>
                    <Badge variant={u.usuAtivo === "A" ? "default" : "secondary"} className="text-[10px]">
                      {u.usuAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); toggleUserStatus(u.usuId) }}>
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {selected && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" />Dados do usuário</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selected.usuAtivo === "A" ? "default" : "secondary"}>
                      {selected.usuAtivo === "A" ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditing((p) => !p)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />{editing ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>ID do usuário</Label>
                    <Input value={selected.usuId} readOnly className="mt-2 bg-muted/40 font-mono text-xs" />
                  </div>
                  <div>
                    <Label>Nome completo</Label>
                    <Input
                      value={editing ? editData.usuNome : selected.usuNome}
                      onChange={(e) => setEditData((p) => ({ ...p, usuNome: e.target.value }))}
                      readOnly={!editing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Login</Label>
                    <Input
                      value={editing ? editData.usuLogin : selected.usuLogin}
                      onChange={(e) => setEditData((p) => ({ ...p, usuLogin: e.target.value }))}
                      readOnly={!editing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Perfil de acesso</Label>
                    {editing ? (
                      <select
                        className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={editData.usuEAdmin}
                        onChange={(e) => setEditData((p) => ({ ...p, usuEAdmin: e.target.value }))}
                      >
                        <option value="N">Operador</option>
                        <option value="S">Administrador</option>
                      </select>
                    ) : (
                      <Input value={selected.usuEAdmin === "S" ? "Administrador" : "Operador"} readOnly className="mt-2 bg-muted/40" />
                    )}
                  </div>

                  {editing && (
                    <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                      <Separator className="mb-2 sm:col-span-2" />
                      <div className="sm:col-span-2">
                        <Label htmlFor="edit-password">Nova Senha (deixe em branco para não alterar)</Label>
                        <div className="relative mt-2">
                          <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="edit-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Digite uma nova senha se quiser alterar"
                            value={editData.usuSenha}
                            onChange={(e) => setEditData((p) => ({ ...p, usuSenha: e.target.value }))}
                            className="pl-9 pr-10"
                          />
                          <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-2.5 text-muted-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {editing && (
                    <div className="sm:col-span-2 flex justify-end">
                      <Button onClick={updateUser} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar alterações
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" />Relatório do usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  {userMovements.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Procedimento</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Produtos baixados</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userMovements.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">{m.procedureName}</TableCell>
                              <TableCell>{m.client || "Não informado"}</TableCell>
                              <TableCell>{new Date(m.date).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell><Badge variant="outline">{m.consumption.length} itens</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-8 text-center">
                      <p className="text-sm font-medium">Nenhuma atividade registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}