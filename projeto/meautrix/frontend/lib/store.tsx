"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Product = {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  minStock: number
}

export type ProcedureItem = {
  productId: string
  amount: number
}

export type Procedure = {
  id: string
  name: string
  items: ProcedureItem[]
}

export type Movement = {
  id: string
  procedureName: string
  professional: string
  client: string
  times: number
  date: string
  consumption: { productName: string; amount: number; unit: string }[]
}

type StoreContextType = {
  products: Product[]
  procedures: Procedure[]
  movements: Movement[]
  addProduct: (p: Omit<Product, "id">) => void
  removeProduct: (id: string) => void
  addProcedure: (p: Omit<Procedure, "id">) => void
  removeProcedure: (id: string) => void
  registerBaixa: (input: {
    procedureId: string
    professional: string
    client: string
    times: number
  }) => { ok: boolean; message: string }
  registerProcedureDay: (input: {
    procedureId: string
    client: string
    items: ProcedureItem[]
  }) => { ok: boolean; message: string }
}

const StoreContext = createContext<StoreContextType | null>(null)

const seedProducts: Product[] = [
  { id: "p1", name: "Ácido Hialurônico 1ml", category: "Preenchedor", unit: "ml", quantity: 24, minStock: 5 },
  { id: "p2", name: "Toxina Botulínica 100U", category: "Botox", unit: "frasco", quantity: 8, minStock: 3 },
  { id: "p3", name: "Agulha 30G", category: "Descartável", unit: "un", quantity: 120, minStock: 30 },
  { id: "p4", name: "Luva Nitrílica", category: "Descartável", unit: "par", quantity: 60, minStock: 20 },
  { id: "p5", name: "Anestésico Tópico", category: "Anestésico", unit: "g", quantity: 4, minStock: 5 },
  { id: "p6", name: "Sérum Vitamina C", category: "Skincare", unit: "ml", quantity: 90, minStock: 15 },
]

const seedProcedures: Procedure[] = [
  {
    id: "proc1",
    name: "Preenchimento Labial",
    items: [
      { productId: "p1", amount: 1 },
      { productId: "p3", amount: 2 },
      { productId: "p4", amount: 1 },
      { productId: "p5", amount: 0.5 },
    ],
  },
  {
    id: "proc2",
    name: "Aplicação de Botox (Testa)",
    items: [
      { productId: "p2", amount: 1 },
      { productId: "p3", amount: 4 },
      { productId: "p4", amount: 1 },
    ],
  },
  {
    id: "proc3",
    name: "Limpeza de Pele Profunda",
    items: [
      { productId: "p6", amount: 10 },
      { productId: "p4", amount: 1 },
    ],
  },
]

const seedMovements: Movement[] = [
  {
    id: "m1",
    procedureName: "Preenchimento Labial",
    professional: "Dra. Marina Costa",
    client: "Ana Paula",
    times: 1,
    date: "2026-06-20T14:30:00",
    consumption: [
      { productName: "Ácido Hialurônico 1ml", amount: 1, unit: "ml" },
      { productName: "Agulha 30G", amount: 2, unit: "un" },
      { productName: "Luva Nitrílica", amount: 1, unit: "par" },
      { productName: "Anestésico Tópico", amount: 0.5, unit: "g" },
    ],
  },
  {
    id: "m2",
    procedureName: "Aplicação de Botox (Testa)",
    professional: "Dra. Marina Costa",
    client: "Carla Mendes",
    times: 1,
    date: "2026-06-21T10:00:00",
    consumption: [
      { productName: "Toxina Botulínica 100U", amount: 1, unit: "frasco" },
      { productName: "Agulha 30G", amount: 4, unit: "un" },
      { productName: "Luva Nitrílica", amount: 1, unit: "par" },
    ],
  },
]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [procedures, setProcedures] = useState<Procedure[]>(seedProcedures)
  const [movements, setMovements] = useState<Movement[]>(seedMovements)

  function addProduct(p: Omit<Product, "id">) {
    setProducts((prev) => [...prev, { ...p, id: `p${Date.now()}` }])
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function addProcedure(p: Omit<Procedure, "id">) {
    setProcedures((prev) => [...prev, { ...p, id: `proc${Date.now()}` }])
  }

  function removeProcedure(id: string) {
    setProcedures((prev) => prev.filter((p) => p.id !== id))
  }

  function registerBaixa(input: {
    procedureId: string
    professional: string
    client: string
    times: number
  }) {
    const procedure = procedures.find((p) => p.id === input.procedureId)
    if (!procedure) return { ok: false, message: "Procedimento não encontrado." }

    // Verifica estoque suficiente
    for (const item of procedure.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue
      const needed = item.amount * input.times
      if (product.quantity < needed) {
        return {
          ok: false,
          message: `Estoque insuficiente de ${product.name}. Necessário: ${needed} ${product.unit}, disponível: ${product.quantity} ${product.unit}.`,
        }
      }
    }

    const consumption: Movement["consumption"] = []
    setProducts((prev) =>
      prev.map((p) => {
        const item = procedure.items.find((i) => i.productId === p.id)
        if (!item) return p
        const used = item.amount * input.times
        consumption.push({ productName: p.name, amount: used, unit: p.unit })
        return { ...p, quantity: Math.round((p.quantity - used) * 100) / 100 }
      }),
    )

    setMovements((prev) => [
      {
        id: `m${Date.now()}`,
        procedureName: procedure.name,
        professional: input.professional,
        client: input.client,
        times: input.times,
        date: new Date().toISOString(),
        consumption,
      },
      ...prev,
    ])

    return { ok: true, message: `Baixa registrada para "${procedure.name}".` }
  }

  function registerProcedureDay(input: {
    procedureId: string
    client: string
    items: ProcedureItem[]
  }) {
    const procedure = procedures.find((p) => p.id === input.procedureId)
    if (!procedure) return { ok: false, message: "Procedimento não encontrado." }

    // Considera apenas itens com quantidade maior que zero
    const usedItems = input.items.filter((i) => i.amount > 0)

    // Verifica estoque suficiente
    for (const item of usedItems) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue
      if (product.quantity < item.amount) {
        return {
          ok: false,
          message: `Estoque insuficiente de ${product.name}. Necessário: ${item.amount} ${product.unit}, disponível: ${product.quantity} ${product.unit}.`,
        }
      }
    }

    const consumption: Movement["consumption"] = []
    setProducts((prev) =>
      prev.map((p) => {
        const item = usedItems.find((i) => i.productId === p.id)
        if (!item) return p
        consumption.push({ productName: p.name, amount: item.amount, unit: p.unit })
        return { ...p, quantity: Math.round((p.quantity - item.amount) * 100) / 100 }
      }),
    )

    setMovements((prev) => [
      {
        id: `m${Date.now()}`,
        procedureName: procedure.name,
        professional: "—",
        client: input.client.trim() || "Não informado",
        times: 1,
        date: new Date().toISOString(),
        consumption,
      },
      ...prev,
    ])

    return { ok: true, message: `Procedimento "${procedure.name}" registrado e estoque atualizado.` }
  }

  return (
    <StoreContext.Provider
      value={{
        products,
        procedures,
        movements,
        addProduct,
        removeProduct,
        addProcedure,
        removeProcedure,
        registerBaixa,
        registerProcedureDay,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider")
  return ctx
}
