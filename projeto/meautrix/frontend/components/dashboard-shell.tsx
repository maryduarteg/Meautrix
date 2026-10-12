"use client"

import Link from "next/link"

import { usePathname, useRouter } from "next/navigation"

import { useState } from "react"

import {
  Package,
  ClipboardList,
  BarChart3,
  LogOut,
  Sparkles,
  Menu,
  X,
  CalendarDays,
  Users,
  UserRound,
  Tags,
  Ruler,
  ChevronDown,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"


const cadastros = [
  { href: "/produtos", label: "Gerenciar Produtos", icon: Package },
  { href: "/procedimentos", label: "Gerenciar Procedimentos", icon: Package },
  { href: "/itens", label: "Gerenciar Itens", icon: Package },
  { href: "/fornecedores", label: "Gerenciar Fornecedores", icon: Package },
  { href: "/categorias", label: "Gerenciar Categorias", icon: Tags },
  { href: "/medidas", label: "Gerenciar Medidas", icon: Ruler },
  { href: "/usuarios", label: "Gerenciar Usuários", icon: Users },
  { href: "/clientes", label: "Gerenciar Clientes", icon: UserRound },
]

const relatorios = [
  { href: "/relatorio", label: "Relatório", icon: BarChart3 }
]

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [cadastrosOpen, setCadastrosOpen] = useState(false)
  const [relatoriosOpen, setRelatoriosOpen] = useState(false)

  const cadastroAtivo = cadastros.some((item) => pathname === item.href)
  const relatorioAtivo = relatorios.some((item) => pathname === item.href)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="leading-tight">
            <p className="font-semibold tracking-wide">Meautrix</p>
            <p className="text-xs text-sidebar-foreground/70">
              Estética & Gestão
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-4 py-4">
          {/* Home*/}
          <Link
            href="/home"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/home"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Home
          </Link>

          {/* Cadastros */}
          <button
            onClick={() => setCadastrosOpen((v) => !v)}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              cadastroAtivo
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Package className="h-4 w-4" />
              Cadastros
            </span>

            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300 ease-in-out",
                cadastrosOpen && "rotate-180",
              )}
            />
          </button>

          <div
            className={cn(
              "ml-4 flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out",
              cadastrosOpen
                ? "max-h-96 translate-y-0 opacity-100"
                : "max-h-0 -translate-y-2 opacity-0",
            )}
          >
            {cadastros.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Procedimentos do Dia */}
          <Link
            href="/procedimentosCliente"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/procedimentosCliente"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Procedimentos do Dia
          </Link>

          {/* Dar Baixa */}
          <Link
            href="/baixa"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/baixa"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <ClipboardList className="h-4 w-4" />
            Dar Baixa
          </Link>

          {/* Relatórios */}
          <button
            onClick={() => setRelatoriosOpen((v) => !v)}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              relatorioAtivo
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </span>

            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300 ease-in-out",
                relatoriosOpen && "rotate-180",
              )}
            />
          </button>

          <div
            className={cn(
              "ml-4 flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out",
              relatoriosOpen
                ? "max-h-40 translate-y-0 opacity-100"
                : "max-h-0 -translate-y-2 opacity-0",
            )}
          >
            {relatorios.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="px-4 pb-6">
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-card/80 px-4 py-4 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          <div>
            <h1 className="text-balance text-xl font-semibold text-foreground md:text-2xl">
              {title}
            </h1>

            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}