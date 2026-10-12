"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Power, Boxes, Search, X, Pencil, Loader2, List, ShieldCheck, CalendarClock } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ITEM_API_URL = "http://localhost:5139/api/item"
const PRODUTO_API_URL = "http://localhost:5139/api/produto"

// Classe usada em todo SelectTrigger para impedir que o shadcn/ui trunque
// (line-clamp-1) o texto do valor selecionado quando a descrição é longa.
const SELECT_TRIGGER_NO_CLAMP = "h-auto min-h-9 whitespace-normal text-left [&>span]:line-clamp-none"

export interface Item {
  iteId: number
  iteNome: string
  prodId: number
  iteAtivo: string // 'A' (Ativo) ou 'I' (Inativo)
  iteQuantidadeAtual: number
  iteQuantidadeSaidaAlterada: number
  iteLoteNome: string
  iteLoteDataAquisicao: string // ISO date
  iteLoteDataVencimento: string // ISO date
}

export interface Produto {
  prodId: number
  prodDescricao: string
  prodAtivo: string
}

export default function CadastroItemPage() {
  const [itens, setItens] = useState<Item[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editing, setEditing] = useState(false)

  const [statusFilter, setStatusFilter] = useState<"Todos" | "A" | "I">("Todos")
  const [nomeFilter, setNomeFilter] = useState("")
  const [produtoFilter, setProdutoFilter] = useState("Todos")

  // Form de edição
  const [editData, setEditData] = useState({
    nome: "",
    prodId: "",
    quantidadeAtual: "",
    quantidadeSaidaAlterada: "",
    loteNome: "",
    loteDataAquisicao: "",
    loteDataVencimento: "",
  })

  // Form de criação
  const [novoItem, setNovoItem] = useState({
    nome: "",
    prodId: "",
    quantidadeAtual: "",
    quantidadeSaidaAlterada: "",
    loteNome: "",
    loteDataAquisicao: "",
    loteDataVencimento: "",
  })

  const produtosAtivos = useMemo(() => produtos.filter((p) => p.prodAtivo === "A"), [produtos])

  function getProdutoDescricao(id: number) {
    return produtos.find((p) => p.prodId === id)?.prodDescricao ?? "—"
  }

  function formatDate(iso: string) {
    if (!iso) return "—"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("pt-BR")
  }

  async function fetchItens() {
    try {
      const res = await fetch(ITEM_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar itens.")
      const data: Item[] = await res.json()
      setItens(data)
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].iteId)
      }
    } catch (err) {
      toast.error("Erro ao carregar itens.")
      console.error(err)
    }
  }

  async function fetchProdutos() {
    try {
      const res = await fetch(PRODUTO_API_URL)
      if (!res.ok) throw new Error("Falha ao buscar produtos.")
      const data: Produto[] = await res.json()
      setProdutos(data)
    } catch (err) {
      toast.error("Erro ao carregar produtos.")
      console.error(err)
    }
  }

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchItens(), fetchProdutos()])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => {
    return itens.find((i) => i.iteId === selectedId) || null
  }, [itens, selectedId])

  // Preenche o formulário de edição ao selecionar/editar item
  useEffect(() => {
    if (selected) {
      setEditData({
        nome: selected.iteNome,
        prodId: String(selected.prodId),
        quantidadeAtual: String(selected.iteQuantidadeAtual),
        quantidadeSaidaAlterada: String(selected.iteQuantidadeSaidaAlterada),
        loteNome: selected.iteLoteNome,
        loteDataAquisicao: selected.iteLoteDataAquisicao?.substring(0, 10) ?? "",
        loteDataVencimento: selected.iteLoteDataVencimento?.substring(0, 10) ?? "",
      })
    }
  }, [selected, editing])

  const filteredItens = useMemo(() => {
    return itens.filter((i) => {
      const matchesNome = i.iteNome.toLowerCase().includes(nomeFilter.toLowerCase())
      const matchesStatus = statusFilter === "Todos" || i.iteAtivo === statusFilter
      const matchesProduto = produtoFilter === "Todos" || String(i.prodId) === produtoFilter
      return matchesNome && matchesStatus && matchesProduto
    })
  }, [itens, statusFilter, nomeFilter, produtoFilter])

  const getInitials = (nome: string) => {
    if (!nome) return "I"
    return nome.trim().substring(0, 2).toUpperCase()
  }

  // Alterar item (PUT /api/item/{id})
  async function updateItem() {
    if (!selected) return
    if (!editData.nome.trim() || !editData.prodId || !editData.loteNome.trim()) {
      return toast.error("Nome, produto e nome do lote são obrigatórios.")
    }
    if (!editData.loteDataAquisicao || !editData.loteDataVencimento) {
      return toast.error("Data de aquisição e data de vencimento são obrigatórias.")
    }
    if (!editData.prodId) {
      return toast.error("O produto é obrigatório")
    }
    if (!editData.quantidadeAtual || !editData.quantidadeSaidaAlterada) {
      return toast.error("Nenhuma quantidade pode estar vazia")
    }
    const data1 = new Date(editData.loteDataAquisicao);
    const data2 = new Date(editData.loteDataVencimento);
    if (data2.getTime()<=data1.getTime()) {
      return toast.error("A data de vencimento deve ser maior que a data de aquisição")
    }
    if (Number(editData.quantidadeAtual) < 0 || Number(editData.quantidadeSaidaAlterada) < 0) {
      return toast.error("Nenhuma quantidade pode ser menor que zero")
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${ITEM_API_URL}/${selected.iteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iteNome: editData.nome.trim(),
          prodId: Number(editData.prodId),
          iteAtivo: selected.iteAtivo,
          iteQuantidadeAtual: Number(editData.quantidadeAtual) || 0,
          iteQuantidadeSaidaAlterada: Number(editData.quantidadeSaidaAlterada) || 0,
          iteLoteNome: editData.loteNome.trim(),
          iteLoteDataAquisicao: editData.loteDataAquisicao,
          iteLoteDataVencimento: editData.loteDataVencimento,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao atualizar item.")
      }

      const updatedList = itens.map((i) =>
        i.iteId === selected.iteId
          ? {
              ...i,
              iteNome: editData.nome.trim(),
              prodId: Number(editData.prodId),
              iteQuantidadeAtual: Number(editData.quantidadeAtual) || 0,
              iteQuantidadeSaidaAlterada: Number(editData.quantidadeSaidaAlterada) || 0,
              iteLoteNome: editData.loteNome.trim(),
              iteLoteDataAquisicao: editData.loteDataAquisicao,
              iteLoteDataVencimento: editData.loteDataVencimento,
            }
          : i
      )
      setItens(updatedList)

      toast.success("Item atualizado com sucesso!")
      setEditing(false)
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar item.")
    } finally {
      setSubmitting(false)
    }
  }

  // Inativar / Ativar (PATCH /api/item/{id})
  async function toggleItemStatus(id: number) {
    const item = itens.find((i) => i.iteId === id)
    if (!item) return

    const newStatus = item.iteAtivo === "A" ? "I" : "A"

    try {
      const res = await fetch(`${ITEM_API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iteAtivo: newStatus }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Não foi possível alterar o status.")
      }

      const updatedList = itens.map((i) => (i.iteId === id ? { ...i, iteAtivo: newStatus } : i))
      setItens(updatedList)
      toast.success(`Item ${newStatus === "A" ? "reativado" : "inativado"} com sucesso!`)
    } catch (err: any) {
      toast.error(err.message || "Não foi possível alterar o status.")
    }
  }

  // Criar item (POST /api/item)
  async function createItem() {
    const dataAquisicao = new Date(novoItem.loteDataAquisicao);
    const dataVencimento = new Date(novoItem.loteDataVencimento);

    if (dataVencimento.getTime() < dataAquisicao.getTime()) {
      return toast.error("A data de vencimento deve ser maior que a data de aquisição")
    }
    if (!novoItem.nome.trim() || !novoItem.prodId || !novoItem.loteNome.trim()) {
      return toast.error("Preencha nome, produto e nome do lote do item.")
    }
    if (!novoItem.loteDataAquisicao || !novoItem.loteDataVencimento) {
      return toast.error("Preencha a data de aquisição e a data de vencimento.")
    }
    if (!novoItem.quantidadeAtual || !novoItem.quantidadeSaidaAlterada) {
      return toast.error("Nenhuma quantidade deve ser estar vazia.")
    }
    if (Number(novoItem.quantidadeAtual) < 0 || Number(novoItem.quantidadeSaidaAlterada) < 0) {
      return toast.error("Nenhuma quantidade deve ser menor que 0.")
    }

    try {
      setSubmitting(true)
      const res = await fetch(ITEM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iteNome: novoItem.nome.trim(),
          prodId: Number(novoItem.prodId),
          iteQuantidadeAtual: Number(novoItem.quantidadeAtual) || 0,
          iteQuantidadeSaidaAlterada: Number(novoItem.quantidadeSaidaAlterada) || 0,
          iteLoteNome: novoItem.loteNome.trim(),
          iteLoteDataAquisicao: novoItem.loteDataAquisicao,
          iteLoteDataVencimento: novoItem.loteDataVencimento,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => null)
        throw new Error(erro?.mensagem || "Erro ao cadastrar item.")
      }

      toast.success("Item cadastrado com sucesso!")
      setNovoItem({
        nome: "",
        prodId: "",
        quantidadeAtual: "",
        quantidadeSaidaAlterada: "",
        loteNome: "",
        loteDataAquisicao: "",
        loteDataVencimento: "",
      })
      setShowCreateForm(false)
      await fetchItens() // recarrega para pegar o novo iteId gerado pelo banco
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar item.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell title="Meautrix" description="Sua plataforma de gerenciamento de estoque de clínica estética.">
      
    </DashboardShell>
  )
}
