# Agendamento de Procedimentos

Para o módulo de promoções, consulte [Gestão de Promoções](PROMOCOES.md) e aplique `20261027_promocoes.sql` seguido de `20261027_promocoes_procedimentos.sql`.

Antes de utilizar a tela, executar `20261020_agendamento_usuario_cancelou_opcional.sql` no banco PostgreSQL do sistema. O script permite NULL em `usuarios_usu_cancelou_id`, pois um agendamento novo não possui usuário de cancelamento. Os registros existentes são preservados.

A implementação utiliza a tabela `public.procedimentos_previstos` informada, com ID gerado por identidade. Cliente é obrigatório no cadastro e na edição pela API e pela tela; registros antigos sem cliente podem ser consultados, mas precisam receber um cliente para serem editados. Não cria nem recria a tabela. Os scripts não são executados automaticamente pela aplicação.

Para utilizar a duração e o bloqueio de sobreposições:

1. Aplicar `20261021_01_procedimentos_duracao.sql` para adicionar as colunas, antes de iniciar a nova versão.
2. Reiniciar a API/frontend e informar a duração real, em minutos inteiros positivos, no cadastro dos procedimentos existentes. Não é presumida uma duração para registros antigos.
3. Aplicar `20261021_02_agendamentos_intervalos.sql`. Esse script inicializa uma única vez a duração dos agendamentos antigos com a duração configurada e adiciona a restrição de períodos sobrepostos, inclusive para requisições simultâneas. Se houver sobreposições antigas ou durações pendentes, ele interrompe a alteração e preserva os dados; os registros devem ser revisados antes de executar novamente.

A regra considera o intervalo do início até o término, permitindo que o próximo procedimento comece exatamente no término do anterior, inclusive na passagem de um dia para outro. Os scripts antigos de unicidade apenas do horário inicial foram substituídos pela restrição de intervalos; não são necessários para uma instalação nova.

Cada agendamento guarda a própria duração reservada. Alterar a duração do procedimento não altera automaticamente os agendamentos existentes. A API retorna um aviso quando houver agendamentos futuros com duração anterior, e a tela exibe esse aviso. Na edição do agendamento é possível optar por usar a nova duração; a alteração só é salva após nova verificação de conflitos. Durante a configuração inicial, agendamentos sem duração conhecida impedem novas reservas, para evitar conflitos não detectáveis.

Reiniciar a API e o frontend após atualizar o código e realizar o login novamente. O login agora mantém uma sessão por cookie HTTP-only. A tela está no menu **Agendamento de Procedimentos**, em `/agendamentos`.

O horário de registro é obtido na API no fuso `America/Sao_Paulo`. A data e a hora do procedimento são enviadas como horário local, sem sufixo de fuso, para as colunas `timestamp without time zone`. São aceitos horários no dia atual que sejam estritamente posteriores ao momento do envio; datas e horários anteriores ou iguais ao atual são recusados. O usuário responsável é capturado da sessão no cadastro; a edição preserva o responsável e o horário de registro.

Rotas autenticadas:

- `GET /api/agendamentos`
- `GET /api/agendamentos/{id}`
- `POST /api/agendamentos`
- `PUT /api/agendamentos/{id}`

Os pedidos de cadastro/edição contêm `dataAgendadoPara`, `procedimentoId` e `clienteId`, todos obrigatórios, e a opção `atualizarDuracao` (false por padrão). A duração é obtida do procedimento pela API, e nunca aceita arbitrariamente do cliente. A tela de agendamentos não exclui registros. O cancelamento e a reativação ficam na tela específica descrita abaixo.

## Valor dos procedimentos

Aplicar `20261021_03_procedimentos_valor.sql` antes de iniciar a API atualizada. O script é transacional e pode ser executado novamente. A coluna `proc_valor` usa `numeric(10,2)` e preserva os registros existentes como `NULL` (valor não informado).

Cadastro e edição completa exigem `procValor`, entre 0 e 99999999.99, com até duas casas decimais. A alteração parcial permite omitir o valor e mantém o preço anterior. As consultas retornam `procValor`; o frontend exibe valores em reais e aceita vírgula ou ponto decimal, sem separador de milhares.

## Cancelamento e reativação de agendamentos

A tela `/cancelamentos`, no menu **Cancelamento de Procedimentos**, consulta hoje e dias futuros no fuso de Brasília. Os filtros de 7 e 15 dias incluem hoje; o período personalizado tem datas inicial e final inclusivas, sem dias passados. Os filtros de cliente e procedimento podem ser combinados.

Aplicar `20261021_04_agendamentos_cancelamento.sql` antes de iniciar a API atualizada. O script altera a estrutura e a restrição de horários, sem padronizar ou atualizar os registros existentes. Após o acerto da base, validar a restrição `ck_agendamento_cancelado` como indicado no script. Novos registros recebem `proc_prev_cancelado = 'N'`.

- `GET /api/agendamentos/cancelamentos`: apenas agendamentos de hoje em diante, incluindo cancelados.
- `PATCH /api/agendamentos/{id}/cancelamento`: corpo `{ "cancelado": "S" }` ou `{ "cancelado": "N" }`.

As rotas exigem sessão autenticada. O servidor obtém o usuário da sessão e registra `usuarios_usu_cancelou_id` tanto ao cancelar quanto ao reativar; o cliente não informa esse id. A alteração preserva os demais campos. Repetir a mesma situação não regrava a auditoria. Cancelados liberam o horário e ficam fora da agenda da home; reativar exige disponibilidade. A restrição de intervalos do banco protege também contra reativações simultâneas conflitantes.
