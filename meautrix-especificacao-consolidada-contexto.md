# Meautrix — Sistema de Controle de Estoque para Clínica de Beleza

Documento de consolidação das informações levantadas para a Especificação de Requisitos de Software (ERS).

---

## 1. Visão Geral

O **Meautrix** é um sistema para controle de estoque de produtos utilizados em procedimentos de uma clínica de beleza. O operador informa o andamento dos atendimentos (concluído, previsto ou cancelado) e o sistema controla automaticamente a baixa de produtos no estoque com base nisso.

- **Plataforma:** Web, com responsividade total (acesso via desktop, tablet e smartphone).
- **Cliente de referência do projeto:** Bianka Lima Beauty Space, espaço de beleza focado em extensão de cílios, design de sobrancelhas e lash lifting.
- **O sistema NÃO cobre:** controle financeiro/faturamento, agenda administrativa completa (o "procedimento previsto" serve ao controle de estoque, não é uma agenda de compromissos), folha de pagamento ou gestão de RH.

## 2. Perfis de Usuário

Dois níveis de acesso:
- **Administrador** — acesso à gestão de cadastros e definição de permissões dos demais usuários.
- **Operador** — registra procedimentos (concluídos/previstos/cancelados) e movimentações de estoque.

Autenticação/login **não** foi formalizada como função (RF) — considerada requisito de infraestrutura, não de negócio.

## 3. Requisitos Funcionais Básicos (RF_B)

| Código | Função |
|---|---|
| RF_B1 | Gerenciar Procedimentos |
| RF_B2 | Gerenciar Produtos |
| RF_B3 | Gerenciar Medidas |
| RF_B4 | Gerenciar Lote |
| RF_B5 | Gerenciar Categorias |
| RF_B6 | Gerenciar Fornecedor |
| RF_B7 | Gerenciar Cliente |
| RF_B8 | Gerenciar Usuário |
| RF_B9 | Gerenciar Item (unidades etiquetadas de um produto) |

Parâmetros do sistema (razão social, cores, logo, favicon) são inseridos **manualmente** — não geram RF próprio.

## 4. Requisitos Funcionais Fundamentais (RF_F)

| Código | Função |
|---|---|
| RF_F1 | Informar procedimentos concluídos |
| RF_F2 | Informar procedimentos previstos |
| RF_F3 | Informar procedimentos cancelados |
| RF_F4 | Informar produtos de procedimento |
| RF_F5 | Atualizar medidas de produtos de procedimento |
| RF_F6 | Atualizar quantidade de produtos (baixa efetiva no estoque) |
| RF_F7 | Emitir alertas de quantidade mínima de estoque |
| RF_F8 | Emitir alertas de lote próximo do vencimento |
| RF_F9 | Atualizar permissão de acesso de usuário |
| RF_F10 | Selecionar item(ns) de produto na baixa de procedimento concluído |
| RF_F11 | Inativar item automaticamente (quando quantidade chega a zero) |

## 5. Requisitos Funcionais de Saída (RF_S)

| Código | Relatório | Filtros |
|---|---|---|
| RF_S1 | Clientes | Nome, data de nascimento |
| RF_S2 | Produtos | Nome, categoria, lote, fornecedor |
| RF_S3 | Procedimentos concluídos | Nome, descrição, produtos, cliente, período, usuário |
| RF_S4 | Procedimentos previstos | Nome, descrição, produtos, cliente, período, usuário |
| RF_S5 | Procedimentos cancelados | Nome, descrição, produtos, cliente, período, usuário |
| RF_S6 | Medidas | — |
| RF_S7 | Fornecedor | Nome, produtos, CNPJ |
| RF_S8 | Produtos em procedimento | Procedimento, período, fornecedor |
| RF_S9 | Usuários | Nome, status (ativo/inativo) |
| RF_S10 | Itens | Produto, lote, status (ativo/inativo) |

## 6. Requisitos Não Funcionais (RNF)

- **Segurança, usabilidade, portabilidade, tolerância a falhas** aplicados às RF_F1–RF_F9, via HTTPS, layout dinâmico/responsivo, suporte a múltiplos navegadores e transação em banco de dados — todos obrigatórios.
- **Tempo de resposta** de relatórios (RF_S1–RF_S9): até 5 segundos — desejável.

## 7. Regras de Negócio

### 7.1 Ciclo de vida do procedimento
- Um procedimento previsto pode ser: **concluído** (atendimento realizado) ou **cancelado** (sai da lista de previstos, sem baixa de estoque).
- Segundo a modelagem de banco mais recente, tanto a conclusão quanto o cancelamento **exigem** que o procedimento tenha sido previsto antes (FK obrigatória `PROC_PREV_ID` em `PROCEDIMENTOS_CONCLUIDOS` e `PROCEDIMENTOS_CANCELADOS`).
- Um procedimento já concluído pode ser excluído posteriormente (ex: lançamento errôneo), gerando **estorno automático** do estoque.
- A baixa de estoque só ocorre na **conclusão** do procedimento — um procedimento previsto não reserva estoque.

### 7.2 Baixa de estoque — produtos sem item (etiquetagem)
- Cada procedimento tem uma quantidade padrão cadastrada por produto (a "receita").
- Ao concluir o procedimento, o sistema sugere essa quantidade padrão, mas o **operador pode alterá-la** (ex: uso a mais por causa do clima do dia).
- A baixa é descontada **direto do total do produto**, sem vínculo com lote específico — lote não participa mais da baixa (não tem controle de quantidade própria).
- Produto pode ser reabastecido em uma unidade (ex: litro) e ter a baixa registrada em outra (ex: ml), com fator de conversão.

### 7.3 Lote
- Lote **não tem controle de quantidade própria** — serve apenas para rastreio de compra (RF_B4) e alerta de vencimento (RF_F8), que passa a ser baseado só na data, não em estoque restante.

### 7.4 Item (etiquetagem de produto)
- Permite tratar unidades físicas individuais do mesmo produto separadamente (ex: "Cola 1", "Cola 2").
- Um item é vinculado a um produto **de um lote específico** e **não é reabastecido** — quando esgota, não recebe nova quantidade.
- Item tem sua própria **quantidade** e sua própria **medida** (unidade), sempre igual à unidade de consumo do produto-pai (replicada na linha do item).
- Só pode existir **um item ativo por etiqueta** por vez; a etiqueta pode ser reutilizada num novo item quando o anterior for inativado.
- Ao concluir procedimento de um produto com item(ns): a seleção do item é **obrigatória**; se houver só um item ativo, não pode ser trocado; se não houver item algum, a baixa cai direto no produto.
- O sistema **sugere automaticamente** o item ativo com **menor quantidade restante** (evita desperdício de sobras), mas o operador pode escolher outro item e editar a quantidade usada.
- A baixa pode ser **combinada entre múltiplos itens** do mesmo produto, quando um único item não for suficiente.
- Um item é **inativado automaticamente** quando sua quantidade chega a zero, ou **manualmente** pelo operador (ex: sobra residual inutilizável).
- Alerta de quantidade mínima de estoque (RF_F7) é calculado **apenas sobre o total do produto**, nunca por item individual.

## 8. Stack Tecnológica

- **Back-end:** C# com ASP.NET Core (multiplataforma, compatível com contêiner Linux)
- **Front-end:** JavaScript / React
- **Banco de dados:** modelagem física atual em Oracle Database 11g (Oracle SQL Developer Data Modeler); stack de produção planejada em PostgreSQL
- **Deploy:** Docker

## 9. Modelo de Dados (última versão validada, 0 erros)

Principais tabelas e relacionamentos:

- **CLIENTES**, **FORNECEDORES**, **USUARIOS**, **CATEGORIAS_PRODUTOS**, **MEDIDAS**, **PARAMETROS**, **PROCEDIMENTOS** — entidades base.
- **PRODUTOS** — referencia `MEDIDAS` duas vezes (unidade de entrada/reabastecimento e de baixa/consumo), tem fator de conversão, quantidade total e quantidade mínima.
- **LOTES** — sem quantidade própria; ligado a `PRODUTOS` via `LOTES_PRODUTOS`.
- **ITENS** — ligado a `PRODUTOS` e `MEDIDAS`; tem quantidade e status ativo/inativo.
- **PROCEDIMENTOS_PREVISTOS** — ligado a `PROCEDIMENTOS`, `CLIENTES` (via `CLI_PROC_PREV`) e `USUARIOS` (operador que agendou).
- **PROCEDIMENTOS_CONCLUIDOS** — ligado obrigatoriamente a `PROCEDIMENTOS_PREVISTOS`, e a `USUARIOS` (operador que concluiu); tem flag de alteração da quantidade padrão.
- **PROCEDIMENTOS_CANCELADOS** — ligado obrigatoriamente a `PROCEDIMENTOS_PREVISTOS`.
- **ITENS_PROCEDIMENTOS_CONCLUIDOS** — baixa de itens etiquetados por procedimento concluído, com quantidade usada.
- **PROD_ALTERADOS_PROC_CONC** — baixa de produtos **sem** item por procedimento concluído, com quantidade usada.
- **PRODUTOS_PROCEDIMENTOS** — vínculo produto × procedimento (a "receita" do procedimento).
- **CATEGORIAS_PRODUTOS_PRODUTOS**, **FORNECEDORES_PRODUTOS** — associações N:N auxiliares.

## 10. Glossário

| Termo | Definição |
|---|---|
| **Administrador** | Usuário com acesso à gestão de cadastros e definição de permissões |
| **ASP.NET Core** | Framework multiplataforma da Microsoft para desenvolvimento web |
| **Baixa de estoque** | Subtração de quantidade de produto/item em decorrência da conclusão de um procedimento |
| **C#** | Linguagem de programação usada no back-end |
| **CNPJ** | Cadastro Nacional da Pessoa Jurídica, usado para fornecedores |
| **Docker** | Plataforma de contêineres para portabilidade de ambiente |
| **ERS** | Especificação de Requisitos de Software |
| **Estorno** | Devolução de quantidade ao estoque por exclusão de procedimento concluído |
| **Etiqueta** | Identificação de um item (ex: "Cola 1") |
| **Fornecedor** | Pessoa jurídica que fornece produtos à clínica |
| **HTTPS** | Protocolo de comunicação segura |
| **Item** | Unidade individual etiquetada de um produto, vinculada a um lote específico |
| **JavaScript** | Linguagem usada no front-end |
| **Lote** | Conjunto de produtos adquiridos numa mesma compra, com validade |
| **Operador** | Usuário responsável por registrar procedimentos e baixas |
| **Procedimento** | Serviço realizado na clínica, associado a produtos consumidos |
| **Produto** | Item de estoque consumido em procedimentos |
| **PostgreSQL** | SGBD relacional planejado para produção |
| **React** | Biblioteca usada na interface web |
| **RF / RF_B / RF_F / RF_S** | Requisito Funcional / Básico / Fundamental / de Saída |
| **RNF** | Requisito Não Funcional |

## 11. Pontos em Aberto

- `PRODUTOS_PROCEDIMENTOS` ainda **não tem coluna de quantidade padrão** — pendente de adicionar ao modelo de banco.
- Nome do sistema (Meautrix), stack e regras de negócio validados; template de ERS a ser preenchido segue o modelo fornecido pelo professor/disciplina.
