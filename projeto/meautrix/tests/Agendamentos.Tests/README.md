# Verificações de Agendamento de Procedimentos

Executar a partir da raiz do repositório:

```powershell
dotnet run --project projeto/meautrix/tests/Agendamentos.Tests/Agendamentos.Tests.csproj
```

O projeto usa o runtime do .NET, sem dependências de teste adicionais. Compila os arquivos reais do agendamento e usa um repositório em memória e um relógio fixo para verificar as regras, a preservação da autoria/data original, o cliente obrigatório, os conflitos de horário e a obtenção do usuário pela sessão. Não acessa nem altera o banco de dados.

Também verifica o bloqueio de datas e horários passados no cadastro e na edição, incluindo a comparação com o horário de São Paulo e a identificação do campo inválido na resposta da API.

Os cenários de duração cobrem sobreposição parcial, início exatamente no término, virada do dia, manutenção da duração reservada, aplicação explícita de nova duração com revalidação e o aviso sobre agendamentos futuros com duração anterior.

Para verificar a validação do formulário, executar na pasta `projeto/meautrix/frontend`:

```powershell
node --test tests/agendamento-validation.test.cjs tests/procedimento-duration.test.cjs
```
