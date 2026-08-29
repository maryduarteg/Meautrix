# 💅 Meautrix — Gestão de Insumos & Procedimentos Estéticos

O **Meautrix** é uma solução web desenvolvida sob medida para a clínica **Bianka Lima Beauty Space**. O sistema substitui controles manuais e planilhas por uma plataforma centralizada para acompanhamento de estoque, controle de validade por lotes e baixa automática de insumos conforme os serviços são executados.

---

## 🚀 Funcionalidades Principais

* **Gestão de Insumos e Lotes:** Controle individualizado de produtos e itens físicos, com monitoramento de lote, data de vencimento e quantidade.
* **Baixa Automática:** Abatimento automatizado no estoque de insumos vinculados à conclusão de cada procedimento estético.
* **Controle de Procedimentos:** Registro detalhado de serviços (previstos, concluídos e cancelados).
* **Níveis de Acesso (Perfis):** Permissões separadas entre perfil **Administrador** (gestão completa e relatórios) e **Operador** (rotina operacional).
* **Alertas de Estoque:** Notificações automáticas para itens com estoque mínimo ou com data de validade próxima do vencimento.
* **Relatórios Operacionais:** Emissão de dados consultivos sobre consumo de insumos, histórico de procedimentos e clientes.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
| :--- | :--- |
| **Back-end** | C# / ASP.NET Core Web API |
| **Front-end** | JavaScript / React |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Entity Framework Core |
| **Arquitetura** | Monolito Organizado em Camadas (Pastas) |

---

## 📁 Estrutura do Projeto (Back-end)

```text
Meautrix/
├── Controllers/           # Endpoints da API RESTful
├── DTOs/                  # Objetos de Transferência de Dados (Criar, Alterar, Response)
│   └── Usuario/
├── Entidades/             # Mapeamento de tabelas do banco de dados (Domain)
├── Interfaces/            # Contratos de abstração
│   ├── Repositories/      # Interfaces de acesso ao banco (ex: IUsuarioRepository)
│   └── Services/          # Interfaces de regras de negócio (ex: IUsuarioService)
├── Repository/            # Implementação do EF Core e queries PostgreSQL
└── Services/              # Implementação das regras de negócio
