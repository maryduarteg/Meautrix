"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("recepcao@lumiere.com")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push("/cadastro")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Painel ilustrativo */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/login-estetica.png"
          alt="Sala de procedimentos estéticos elegante"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#5e1029]/55" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-secondary">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-balance text-3xl font-semibold leading-tight">
            Gestão inteligente para sua clínica de estética
          </h2>
          <p className="mt-3 max-w-md text-pretty text-secondary/90">
            Cadastre produtos, registre procedimentos e dê baixa automática no estoque conforme o consumo real.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-foreground">Lumière</p>
              <p className="text-xs text-muted-foreground">Estética & Gestão</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-foreground">Bem-vinda de volta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse o painel para gerenciar seu estoque.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="voce@clinica.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-9"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="accent-primary" defaultChecked />
                Lembrar de mim
              </label>
              <a href="#" className="font-medium text-primary hover:underline">
                Esqueci a senha
              </a>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Entrar no painel
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem acesso?{" "}
            <a href="#" className="font-medium text-primary hover:underline">
              Solicitar cadastro
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
