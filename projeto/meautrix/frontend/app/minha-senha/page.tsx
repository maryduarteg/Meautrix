"use client"

import { useState } from "react"
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function MinhaSenhaPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentPassword || !newPassword || !confirmation) {
      toast.error("Preencha todos os campos de senha.")
      return
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (newPassword !== confirmation) {
      toast.error("A confirmação não corresponde à nova senha.")
      return
    }
    toast.success("Sua senha foi alterada com sucesso.")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmation("")
  }

  return (
    <DashboardShell title="Minha senha" description="Atualize somente a senha do seu próprio acesso.">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="sm:col-span-2">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Acesso do operador</p>
                <p className="mt-1 text-sm text-muted-foreground">Juliana Alves · juliana.alves</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex h-full items-center gap-3 p-5">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <div><p className="text-xs text-muted-foreground">ID do usuário</p><p className="font-mono text-sm font-semibold">USR-002</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-primary" />Alterar senha</CardTitle>
            <CardDescription>Por segurança, informe sua senha atual antes de cadastrar uma nova.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="flex flex-col gap-5">
              <PasswordField id="current-password" label="Senha atual" value={currentPassword} onChange={setCurrentPassword} visible={showCurrent} onToggle={() => setShowCurrent((value) => !value)} />
              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordField id="new-password" label="Nova senha" hint="Mínimo de 6 caracteres" value={newPassword} onChange={setNewPassword} visible={showNew} onToggle={() => setShowNew((value) => !value)} />
                <PasswordField id="confirm-password" label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} visible={showConfirmation} onToggle={() => setShowConfirmation((value) => !value)} />
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-muted/70 p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>Apenas a sua senha será alterada. Nome, login, perfil e permissões não podem ser editados nesta tela.</p>
              </div>
              <div className="flex justify-end"><Button type="submit">Salvar nova senha</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

function PasswordField({ id, label, hint, value, onChange, visible, onToggle }: { id: string; label: string; hint?: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return <div><Label htmlFor={id}>{label}</Label><div className="relative mt-2"><Input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className="pr-10" autoComplete={id === "current-password" ? "current-password" : "new-password"} /><button type="button" onClick={onToggle} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}</div>
}
