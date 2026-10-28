# Gestão de Promoções

Aplicar `20261027_promocoes.sql` e, em seguida, `20261027_promocoes_procedimentos.sql` no PostgreSQL antes de iniciar a API atualizada.
O script cria ou ajusta `public.promocoes`, preserva os registros e pode ser executado novamente.
Se houver campos obrigatórios nulos, textos acima dos limites ou datas invertidas, a transação falha:
revise os dados antes de executar novamente. Nenhuma correção de dados é presumida.
Reiniciar a API e o frontend após a atualização.

O menu **Consulta de Promoções**, em `/promocoes`, permite consultar, cadastrar, editar e excluir.
Somente este item foi incluído, conforme o escopo definido. A exclusão é física e pede confirmação na tela.
O formulário reutiliza os componentes e o tema dos demais cadastros.

## API

Todas as rotas exigem a sessão por cookie já utilizada pelo sistema.

- `GET /api/promocoes`: listagem e filtros combináveis.
- `GET /api/promocoes/{id}`: consulta individual.
- `POST /api/promocoes`: cadastro; retorna 201, registro e localização.
- `PUT /api/promocoes/{id}`: edição completa; retorna 200 e registro.
- `DELETE /api/promocoes/{id}`: exclusão; retorna 204.

Também são aceitas as mesmas rotas sem o prefixo `/api`, atendendo a `/promocoes`.

## Procedimentos com desconto

Aplique `20261027_promocoes_procedimentos.sql` após a migração de promoções. O script cria ou ajusta a tabela `public.promocoes_procedimentos`, incluindo a chave única por promoção e procedimento e o desconto fixo em reais (`prom_proc_desconto`).

- `GET /api/promocoes/{prom_id}/procedimentos`: lista os procedimentos vinculados.
- `POST /api/promocoes/{prom_id}/procedimentos`: recebe uma lista de procedimentos e descontos fixos em reais.
- `PUT /api/promocoes/{prom_id}/procedimentos/{prom_proc_id}`: altera o desconto em reais.
- `DELETE /api/promocoes/{prom_id}/procedimentos/{prom_proc_id}`: remove o vínculo.

Somente procedimentos ativos podem ser vinculados. Inclusão, edição e remoção são bloqueadas quando `prom_data_maxima` já passou; a consulta permanece disponível para auditoria.
Registros inexistentes retornam 404; campos ou filtros inválidos retornam 400.

Corpo obrigatório de POST e PUT:

```json
{
  "prom_titulo": "Semana da beleza",
  "prom_mensagem": "Confira nossas condições especiais!",
  "prom_data_minima": "2026-11-01",
  "prom_data_maxima": "2026-11-07"
}
```

Título aceita até 60 caracteres e mensagem até 100. Textos vazios ou apenas com espaços são recusados.
As datas são obrigatórias e aceitam o formato `YYYY-MM-DD`. A data final deve ser igual ou posterior à inicial.
`prom_id` e `created_at` são gerados pelo banco e retornados pela API; a edição preserva `created_at`.

Parâmetros opcionais de consulta:

| Parâmetro | Comportamento |
| --- | --- |
| `titulo` | Contém o texto, sem diferenciar maiúsculas e minúsculas; `%` e `_` são literais. |
| `mensagem` | Mesma regra de título. |
| `data_inicio` | Vigência termina nesta data ou depois. |
| `data_fim` | Vigência começa nesta data ou antes. |
| `apenas_ativas` | Quando `true`, usa `CURRENT_DATE BETWEEN prom_data_minima AND prom_data_maxima` no PostgreSQL. |

O período filtra por interseção inclusiva da vigência, com suporte a somente uma das datas.
Quando ambas são fornecidas, `data_fim` deve ser igual ou posterior a `data_inicio`.
`apenas_ativas=false` não restringe a vigência. A data atual segue o fuso da sessão PostgreSQL.

Exemplo: `/api/promocoes?titulo=beleza&data_inicio=2026-11-01&data_fim=2026-11-30&apenas_ativas=true`.

## Verificação

Executar na raiz do repositório:

```powershell
dotnet run --project projeto/meautrix/tests/Promocoes.Tests
```

Os testes cobrem campos obrigatórios em criação/edição, limites, intervalos, edição sem alteração da
data de criação, exclusão, contrato JSON, propagação dos filtros e respostas do controller.

Para validar também a migração e o repositório real, criar um banco PostgreSQL descartável vazio
com nome iniciado por `promocoes_test_`, definir `PROMOCOES_TEST_CONNECTION` com sua conexão e
passar o caminho absoluto de `20261027_promocoes.sql` após `--` no comando dos testes.
Essa verificação executa o script duas vezes, testa filtros combinados, limites de vigência,
textos literais, geração dos campos pelo banco, atualização, exclusão e restrição de datas.
