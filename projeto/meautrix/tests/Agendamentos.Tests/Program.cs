using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using Meautrix.Controllers;
using Meautrix.DTO.Agendamento;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

var checks = 0;
void Check(bool condition, string description)
{
    checks++;
    if (!condition) throw new Exception(description);
}
var repository = new FakeRepository();
var service = new AgendamentoService(repository, new FixedClock());
AgendamentoSalvarDTO Valid() => new()
{
    DataAgendadoPara = new DateTime(2026, 11, 10, 14, 30, 0),
    ProcedimentoId = 1,
    ClienteId = 3
};
async Task Reject(Func<Task> action, Type exception)
{
    var before = JsonSerializer.Serialize(repository.Items);
    var writes = repository.Writes;
    try { await action(); throw new Exception("Entrada inválida aceita."); }
    catch (Exception e) when (e.GetType() == exception) { }
    Check(before == JsonSerializer.Serialize(repository.Items) && writes == repository.Writes, "Validação deve ocorrer antes da gravação e da mutação.");
}

var created = await service.CriarAsync(Valid(), 7);
var entity = repository.Items.Single();
Check(entity.UsuarioAgendouId == 7, "Registrar o usuário recebido da sessão.");
Check(created.DataAgendadoEm == new DateTime(2026, 10, 20, 12, 0, 0), "Usar relógio da API no horário de São Paulo.");
Check(created.DataAgendadoEm.Kind == DateTimeKind.Unspecified, "Timestamp local sem conversão UTC no PostgreSQL.");
Check(created.ClienteId == 3, "Registrar o cliente obrigatório.");
Check(created.ProcedimentoNome == "Limpeza", "Retornar o nome do procedimento.");
var withClient = Valid(); withClient.DataAgendadoPara = new DateTime(2026, 11, 10, 15, 30, 0);
var createdWithClient = await service.CriarAsync(withClient, 7);
Check(createdWithClient.ClienteId == 3 && createdWithClient.ClienteNome == "Cliente", "Retornar o cliente vinculado.");
await Reject(() => service.CriarAsync(Valid(), 7), typeof(InvalidOperationException));
var outroProcedimento = Valid(); outroProcedimento.ProcedimentoId = 3;
await Reject(() => service.CriarAsync(outroProcedimento, 7), typeof(InvalidOperationException));
var mesmoMinuto = Valid(); mesmoMinuto.DataAgendadoPara = mesmoMinuto.DataAgendadoPara!.Value.AddSeconds(59);
await Reject(() => service.CriarAsync(mesmoMinuto, 7), typeof(InvalidOperationException));
await Reject(() => service.AlterarAsync(createdWithClient.Id, Valid()), typeof(InvalidOperationException));
await service.AlterarAsync(created.Id, Valid());
Check(entity.ClienteId == 3, "Desconsiderar o próprio agendamento na edição.");
var outroClienteRepo = new FakeRepository();
var outroClienteService = new AgendamentoService(outroClienteRepo, new FixedClock());
await outroClienteService.CriarAsync(Valid(), 7);
var outroCliente = Valid(); outroCliente.ClienteId = 4;
await Reject(() => outroClienteService.CriarAsync(outroCliente, 7), typeof(InvalidOperationException));
Check(outroClienteRepo.Items.Count == 1, "Bloquear clientes diferentes no mesmo horário.");
var outroDia = Valid(); outroDia.DataAgendadoPara = outroDia.DataAgendadoPara!.Value.AddDays(1);
await outroClienteService.CriarAsync(outroDia, 7);
Check(outroClienteRepo.Items.Count == 2, "Permitir o mesmo cliente em dias diferentes.");
await Reject(() => service.CriarAsync(Valid(), 0), typeof(UnauthorizedAccessException));
await Reject(() => service.CriarAsync(Valid(), 8), typeof(UnauthorizedAccessException));
var noDate = Valid(); noDate.DataAgendadoPara = null;
await Reject(() => service.CriarAsync(noDate, 7), typeof(InvalidOperationException));
var defaultDate = Valid(); defaultDate.DataAgendadoPara = default(DateTime);
await Reject(() => service.CriarAsync(defaultDate, 7), typeof(InvalidOperationException));
var utcDate = Valid(); utcDate.DataAgendadoPara = DateTime.UtcNow;
await Reject(() => service.CriarAsync(utcDate, 7), typeof(InvalidOperationException));
var noProcedure = Valid(); noProcedure.ProcedimentoId = 0;
await Reject(() => service.CriarAsync(noProcedure, 7), typeof(InvalidOperationException));
var inactiveProcedure = Valid(); inactiveProcedure.ProcedimentoId = 2;
await Reject(() => service.CriarAsync(inactiveProcedure, 7), typeof(InvalidOperationException));
var badClient = Valid(); badClient.ClienteId = 2;
await Reject(() => service.CriarAsync(badClient, 7), typeof(InvalidOperationException));
var zeroClient = Valid(); zeroClient.ClienteId = 0;
await Reject(() => service.CriarAsync(zeroClient, 7), typeof(InvalidOperationException));
await Reject(() => service.AlterarAsync(created.Id, noDate), typeof(InvalidOperationException));
foreach (var dataPassada in new[]
{
    new DateTime(2026, 10, 19, 23, 59, 0),
    new DateTime(2026, 10, 20, 11, 59, 59)
})
{
    var passado = Valid(); passado.DataAgendadoPara = dataPassada;
    await Reject(() => service.CriarAsync(passado, 7), typeof(InvalidOperationException));
    await Reject(() => service.AlterarAsync(created.Id, passado), typeof(InvalidOperationException));
}
var boundaryService = new AgendamentoService(new FakeRepository(), new FixedClock());
var agora = Valid(); agora.DataAgendadoPara = new DateTime(2026, 10, 20, 12, 0, 0);
await Reject(() => boundaryService.CriarAsync(agora, 7), typeof(InvalidOperationException));
var futuroHoje = Valid(); futuroHoje.DataAgendadoPara = new DateTime(2026, 10, 20, 12, 1, 0);
Check((await boundaryService.CriarAsync(futuroHoje, 7)).DataAgendadoPara == futuroHoje.DataAgendadoPara,
    "Permitir um horário futuro no mesmo dia.");
await Reject(() => service.AlterarAsync(999, Valid()), typeof(KeyNotFoundException));

var originalDate = entity.DataAgendadoEm;
var changed = Valid(); changed.DataAgendadoPara = new DateTime(2026, 11, 11, 15, 0, 0);
await service.AlterarAsync(created.Id, changed);
Check(entity.DataAgendadoEm == originalDate && entity.UsuarioAgendouId == 7, "Edição deve preservar data de registro e autor.");
Check(entity.DataAgendadoPara == changed.DataAgendadoPara, "Atualizar data do procedimento.");
var semCliente = Valid(); semCliente.ClienteId = null;
await Reject(() => service.CriarAsync(semCliente, 7), typeof(InvalidOperationException));
await Reject(() => service.AlterarAsync(createdWithClient.Id, semCliente), typeof(InvalidOperationException));
await service.AlterarAsync(createdWithClient.Id, Valid());
Check(repository.Items[1].ClienteId == 3, "Manter cliente obrigatório na edição.");
repository.ActiveProcedure = false;
await service.AlterarAsync(created.Id, changed);
Check(entity.ProcedimentoId == 1, "Permitir manter procedimento previamente vinculado após inativação.");
await Reject(() => service.CriarAsync(Valid(), 7), typeof(InvalidOperationException));
Check((await service.BuscarTodosAsync()).Count() == 2, "Listar os agendamentos.");
await Reject(() => service.BuscarPorIdAsync(999), typeof(KeyNotFoundException));

var injected = JsonSerializer.Deserialize<AgendamentoSalvarDTO>(
    """{"DataAgendadoPara":"2026-11-12T10:00:00","ProcedimentoId":1,"ClienteId":3,"UsuarioAgendouId":999,"DataAgendadoEm":"2000-01-01T00:00:00"}""")!;
repository.ActiveProcedure = true;
var controller = new AgendamentosController(service)
{
    ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
};
Check(await controller.Criar(injected) is UnauthorizedObjectResult, "Sem sessão não é possível criar.");
controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
    new[] { new Claim(ClaimTypes.NameIdentifier, "7") }, "test"));
Check(await controller.Criar(injected) is CreatedAtActionResult, "Criar com usuário autenticado.");
var passadoController = Valid(); passadoController.DataAgendadoPara = new DateTime(2026, 10, 19, 12, 0, 0);
var erroData = await controller.Criar(passadoController) as BadRequestObjectResult;
Check(erroData != null && JsonSerializer.Serialize(erroData.Value).Contains("dataAgendadoPara"),
    "Retornar o campo da data para exibir o erro junto ao input.");
Check(repository.Items.Last().UsuarioAgendouId == 7 && repository.Items.Last().DataAgendadoEm == originalDate,
    "Ignorar tentativas de injetar autor e data de registro no corpo.");
Check(typeof(AgendamentosController).IsDefined(typeof(AuthorizeAttribute), true), "Proteger todos os endpoints do agendamento.");
Check(!JsonSerializer.Serialize(created).Contains("UsuarioAgendouId"), "Resposta não deve expor o ID do usuário.");
var emptyDto = new AgendamentoSalvarDTO();
Check(!Validator.TryValidateObject(emptyDto, new ValidationContext(emptyDto), new List<ValidationResult>(), true),
    "DTO deve exigir procedimento e data.");
var intervalRepo = new FakeRepository();
var intervalService = new AgendamentoService(intervalRepo, new FixedClock());
var sobrancelha = Valid(); sobrancelha.DataAgendadoPara = new DateTime(2026, 11, 10, 19, 0, 0);
var reservado = await intervalService.CriarAsync(sobrancelha, 7);
Check(reservado.DuracaoMinutos == 60 && reservado.DataTerminoPrevisto == new DateTime(2026, 11, 10, 20, 0, 0), "Calcular término pela duração reservada.");
foreach (var hora in new[] { new DateTime(2026, 11, 10, 19, 30, 0), new DateTime(2026, 11, 10, 18, 30, 0) })
{
    var conflito = Valid(); conflito.DataAgendadoPara = hora;
    await Reject(() => intervalService.CriarAsync(conflito, 7), typeof(InvalidOperationException));
}
var limite = Valid(); limite.DataAgendadoPara = new DateTime(2026, 11, 10, 20, 0, 0);
await intervalService.CriarAsync(limite, 7);
Check(intervalRepo.Items.Count == 2, "Permitir começar no término exato do anterior.");
intervalRepo.CurrentDuration = 90;
await intervalService.AlterarAsync(reservado.Id, sobrancelha);
Check(intervalRepo.Items[0].DuracaoMinutos == 60, "Manter duração original ao editar após mudança no procedimento.");
var aplicarNovaDuracao = Valid(); aplicarNovaDuracao.DataAgendadoPara = sobrancelha.DataAgendadoPara; aplicarNovaDuracao.AtualizarDuracao = true;
await Reject(() => intervalService.AlterarAsync(reservado.Id, aplicarNovaDuracao), typeof(InvalidOperationException));
Check(intervalRepo.Items[0].DuracaoMinutos == 60, "Impedir que nova duração afete outro cliente.");
aplicarNovaDuracao.DataAgendadoPara = new DateTime(2026, 11, 10, 17, 0, 0);
await intervalService.AlterarAsync(reservado.Id, aplicarNovaDuracao);
Check(intervalRepo.Items[0].DuracaoMinutos == 90, "Permitir aplicar nova duração explicitamente em horário livre.");
var madrugadaRepo = new FakeRepository();
var madrugadaService = new AgendamentoService(madrugadaRepo, new FixedClock());
var noite = Valid(); noite.DataAgendadoPara = new DateTime(2026, 11, 10, 23, 30, 0);
await madrugadaService.CriarAsync(noite, 7);
var madrugada = Valid(); madrugada.DataAgendadoPara = new DateTime(2026, 11, 11, 0, 15, 0);
await Reject(() => madrugadaService.CriarAsync(madrugada, 7), typeof(InvalidOperationException));
var semDuracaoRepo = new FakeRepository { CurrentDuration = null };
await Reject(() => new AgendamentoService(semDuracaoRepo, new FixedClock()).CriarAsync(Valid(), 7), typeof(InvalidOperationException));
var pendenteRepo = new FakeRepository { MissingDurations = true };
await Reject(() => new AgendamentoService(pendenteRepo, new FixedClock()).CriarAsync(Valid(), 7), typeof(InvalidOperationException));

var procRepo = new FakeProcedimentoRepository();
var procService = new ProcedimentoService(procRepo);
await procService.CriarAsync(new() { ProcNome = "Sobrancelha", ProcDescricao = "Design", ProcDuracaoMinutos = 60, ProcValor = 150.50m });
Check(procRepo.Item!.ProcDuracaoMinutos == 60, "Salvar duração no cadastro de procedimento.");
Check((await procService.BuscarTodosAsync()).Single().ProcDuracaoMinutos == 60, "Retornar duração do procedimento.");
await Reject(() => procService.CriarAsync(new() { ProcDuracaoMinutos = 0 }), typeof(InvalidOperationException));
await Reject(() => procService.AlterarParcialAsync(1, new() { ProcDuracaoMinutos = -1 }), typeof(InvalidOperationException));
procRepo.AgendamentosAnteriores = true;
var aviso = await procService.AlterarAsync(1, new() { ProcNome = "Sobrancelha", ProcDescricao = "Design", ProcDuracaoMinutos = 90, ProcValor = 200m });
Check(aviso?.Contains("duração anterior") == true && procRepo.Item.ProcDuracaoMinutos == 90, "Avisar sobre agendamentos com duração antiga.");
Check(await procService.AlterarParcialAsync(1, new() { ProcDuracaoMinutos = 90 }) == null, "Não avisar quando a duração não mudou.");
Check(await procService.AlterarParcialAsync(1, new() { ProcDuracaoMinutos = 120 }) != null, "Avisar também na alteração parcial.");
Check(procRepo.Item!.ProcValor == 200m, "Salvar valor na edição e preservar em PATCH de duração.");
Check((await procService.BuscarTodosAsync()).Single().ProcValor == 200m, "Retornar valor na consulta.");
Check((await procService.BuscarPorIdAsync(1))!.ProcValor == 200m, "Retornar valor por id.");
await procService.AlterarParcialAsync(1, new() { ProcValor = 0m });
Check(procRepo.Item.ProcValor == 0m, "Permitir valor zero explícito.");
await procService.AlterarParcialAsync(1, new() { ProcNome = "Novo nome" });
Check(procRepo.Item.ProcValor == 0m, "PATCH sem valor preserva o preço anterior.");
foreach (decimal? valor in new decimal?[] { null, -0.01m, 1.234m, 100000000m })
{
    await Reject(() => procService.CriarAsync(new() { ProcDuracaoMinutos = 60, ProcValor = valor }), typeof(InvalidOperationException));
    await Reject(() => procService.AlterarAsync(1, new() { ProcDuracaoMinutos = 60, ProcValor = valor }), typeof(InvalidOperationException));
    if (valor.HasValue)
        await Reject(() => procService.AlterarParcialAsync(1, new() { ProcValor = valor }), typeof(InvalidOperationException));
}
await procService.CriarAsync(new() { ProcNome = "Limite", ProcDescricao = "Limite", ProcDuracaoMinutos = 60, ProcValor = 99999999.99m });
Check(procRepo.Item.ProcValor == 99999999.99m, "Preservar centavos no limite máximo.");
procRepo.Item!.ProcAtivo = "I";
procRepo.Item.ProcValor = null;
await procService.AlterarParcialAsync(1, new() { ProcAtivo = "A" });
Check(procRepo.Item.ProcAtivo == "A" && procRepo.Item.ProcValor == null, "Reativar registro antigo sem atribuir preço fictício.");
procRepo.Item.ProcAtivo = "I";
await Reject(() => procService.AlterarParcialAsync(1, new() { ProcValor = 100m }), typeof(KeyNotFoundException));
// Cancelamento altera somente a situação e o usuário responsável.
var cancelRepo = new FakeRepository();
var cancelService = new AgendamentoService(cancelRepo, new FixedClock());
var original = await cancelService.CriarAsync(Valid(), 7);
var cancelEntity = cancelRepo.Items.Single();
Check(original.Cancelado == "N" && cancelEntity.Cancelado == "N" && original.UsuarioCancelouId == null, "Novo agendamento grava N e não possui responsável de cancelamento.");
var inicioOriginal = cancelEntity.DataAgendadoPara;
var registroOriginal = cancelEntity.DataAgendadoEm;
var cancelado = await cancelService.AlterarCancelamentoAsync(original.Id, "S", 7);
Check(cancelado.Cancelado == "S" && cancelado.UsuarioCancelouId == 7, "Cancelar registra flag S e usuário da sessão.");
Check(cancelEntity.DataAgendadoPara == inicioOriginal && cancelEntity.DataAgendadoEm == registroOriginal && cancelEntity.UsuarioAgendouId == 7 && cancelEntity.ProcedimentoId == original.ProcedimentoId && cancelEntity.ClienteId == original.ClienteId && cancelEntity.DuracaoMinutos == original.DuracaoMinutos, "Cancelamento preserva os demais dados.");
Check(!await cancelRepo.HorarioOcupadoAsync(inicioOriginal, inicioOriginal.AddHours(1)), "Cancelamento libera o horário.");
var reservaSubstituta = await cancelService.CriarAsync(Valid(), 7);
try { await cancelService.AlterarCancelamentoAsync(original.Id, "N", 7); throw new Exception("Reativou horário ocupado."); }
catch (InvalidOperationException) { Check(cancelEntity.Cancelado == "S", "Conflito de reativação mantém cancelamento."); }
await cancelService.AlterarCancelamentoAsync(reservaSubstituta.Id, "S", 7);
var reativado = await cancelService.AlterarCancelamentoAsync(original.Id, "N", 7);
Check(reativado.Cancelado == "N" && reativado.UsuarioCancelouId == 7, "Reativar registra N e usuário responsável.");
var writesCancel = cancelRepo.Writes;
await cancelService.AlterarCancelamentoAsync(original.Id, "N", 7);
Check(cancelRepo.Writes == writesCancel, "Pedido repetido não regrava auditoria.");
foreach (var usuarioInvalido in new[] { 0, 8 })
{
    try { await cancelService.AlterarCancelamentoAsync(original.Id, "S", usuarioInvalido); throw new Exception("Usuário inválido aceito."); }
    catch (UnauthorizedAccessException) { Check(cancelEntity.Cancelado == "N", "Usuário inválido não altera flag."); }
}
try { await cancelService.AlterarCancelamentoAsync(original.Id, "X", 7); throw new Exception("Flag inválida aceita."); }
catch (InvalidOperationException) { Check(cancelEntity.Cancelado == "N", "Recusar flag diferente de S ou N."); }
try { await cancelService.AlterarCancelamentoAsync(999, "S", 7); throw new Exception("Registro inexistente aceito."); }
catch (KeyNotFoundException) { Check(true, "Retornar não encontrado."); }
cancelEntity.DataAgendadoPara = new DateTime(2026, 10, 19, 23, 59, 59);
try { await cancelService.AlterarCancelamentoAsync(original.Id, "S", 7); throw new Exception("Cancelou passado."); }
catch (InvalidOperationException) { Check(cancelEntity.Cancelado == "N", "Recusar datas anteriores a hoje."); }
Check(!(await cancelService.BuscarParaCancelamentoAsync()).Any(a => a.Id == original.Id), "Consulta não retorna dias passados.");
cancelEntity.DataAgendadoPara = new DateTime(2026, 10, 20, 0, 0, 0);
await cancelService.AlterarCancelamentoAsync(original.Id, "S", 7);
Check((await cancelService.BuscarParaCancelamentoAsync()).Any(a => a.Id == original.Id), "Incluir todo o dia atual, mesmo horário anterior ao agora.");
// O usuário enviado no corpo nunca substitui o da sessão.
var cancelController = new AgendamentosController(cancelService) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
var pedidoCancel = new AgendamentoCancelamentoDTO { Cancelado = "N" };
Check(await cancelController.AlterarCancelamento(original.Id, pedidoCancel) is UnauthorizedObjectResult, "Cancelamento exige identidade da sessão.");
cancelRepo.ValidUsers.Add(9);
cancelController.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "9") }, "test"));
Check(await cancelController.AlterarCancelamento(original.Id, pedidoCancel) is OkObjectResult && cancelEntity.UsuarioCancelouId == 9, "Reativação grava o usuário atual, preservando quem agendou.");
foreach (var flag in new[] { "", "s", "X" })
{
    var errors = new List<ValidationResult>();
    var dto = new AgendamentoCancelamentoDTO { Cancelado = flag };
    Check(!Validator.TryValidateObject(dto, new ValidationContext(dto), errors, true), "DTO recusa flag inválida.");
}

var culturaOriginal = System.Globalization.CultureInfo.CurrentCulture;
var culturaUiOriginal = System.Globalization.CultureInfo.CurrentUICulture;
try
{
    foreach (var cultura in new[] { "pt-BR", "en-US" })
    {
        System.Globalization.CultureInfo.CurrentCulture = new(cultura);
        System.Globalization.CultureInfo.CurrentUICulture = new(cultura);
        foreach (var tipo in new[]
        {
            typeof(Meautrix.DTO.Procedimento.ProcedimentoCriarDTO),
            typeof(Meautrix.DTO.Procedimento.ProcedimentoAlterarDTO),
            typeof(Meautrix.DTO.Procedimento.ProcedimentoAlterarParcialDTO)
        })
        {
            foreach (decimal? valor in new decimal?[] { null, -0.01m, 0m, 150.50m, 99999999.99m, 100000000m })
            {
                var dto = Activator.CreateInstance(tipo)!;
                tipo.GetProperty("ProcDuracaoMinutos")!.SetValue(dto, 60);
                tipo.GetProperty("ProcValor")!.SetValue(dto, valor);
                var resultados = new List<ValidationResult>();
                var valido = Validator.TryValidateObject(dto, new ValidationContext(dto), resultados, true);
                var esperado = valor.HasValue ? valor >= 0m && valor <= 99999999.99m
                    : tipo == typeof(Meautrix.DTO.Procedimento.ProcedimentoAlterarParcialDTO);
                Check(valido == esperado, $"Validar {tipo.Name} em {cultura} sem falha de conversão decimal.");
            }
        }
    }
}
finally
{
    System.Globalization.CultureInfo.CurrentCulture = culturaOriginal;
    System.Globalization.CultureInfo.CurrentUICulture = culturaUiOriginal;
}
Console.WriteLine(checks + " verificações de procedimentos e agendamentos aprovadas.");

sealed class FixedClock : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => new(2026, 10, 20, 15, 0, 0, TimeSpan.Zero);
}
sealed class FakeRepository : IAgendamentoRepository
{
    public List<Agendamento> Items { get; } = [];
    public int Writes { get; private set; }
    public bool ActiveProcedure { get; set; } = true;
    public Task<IEnumerable<Agendamento>> BuscarTodosAsync() => Task.FromResult<IEnumerable<Agendamento>>(Items);
    public Task<IEnumerable<Agendamento>> BuscarAPartirDeAsync(DateTime data) => Task.FromResult<IEnumerable<Agendamento>>(Items.Where(a => a.DataAgendadoPara >= data).OrderBy(a => a.DataAgendadoPara).ThenBy(a => a.Id).ToList());
    public Task<Agendamento?> BuscarPorIdAsync(int id)
    {
        var item = Items.FirstOrDefault(a => a.Id == id);
        if (item != null)
        {
            item.Procedimento = new Procedimento { ProcId = item.ProcedimentoId, ProcNome = "Limpeza", ProcAtivo = "A" };
            item.Cliente = item.ClienteId.HasValue ? new Cliente { CliId = item.ClienteId.Value, CliNome = "Cliente", CliAtivo = "A" } : null;
        }
        return Task.FromResult(item);
    }
    public Task<bool> ProcedimentoAtivoAsync(int id) => Task.FromResult((id == 1 || id == 3) && ActiveProcedure);
    public Task<bool> ClienteAtivoAsync(int id) => Task.FromResult(id == 3 || id == 4);
    public int? CurrentDuration { get; set; } = 60;
    public bool MissingDurations { get; set; }
    public Task<int?> BuscarDuracaoProcedimentoAsync(int id) => Task.FromResult(CurrentDuration);
    public Task<bool> HaAgendamentosSemDuracaoAsync() => Task.FromResult(MissingDurations);
    public Task<bool> HorarioOcupadoAsync(DateTime inicio, DateTime fim, int? idIgnorado = null) =>
        Task.FromResult(Items.Any(a => a.Cancelado != "S" && a.Id != idIgnorado &&
            a.DataAgendadoPara < fim && a.DataAgendadoPara.AddMinutes(a.DuracaoMinutos ?? CurrentDuration ?? 0) > inicio));
    public HashSet<int> ValidUsers { get; } = [7];
    public Task<bool> UsuarioAtivoAsync(int id) => Task.FromResult(ValidUsers.Contains(id));
    public Task InserirAsync(Agendamento item) { item.Id = Items.Count + 1; Items.Add(item); Writes++; return Task.CompletedTask; }
    public Task AlterarAsync(Agendamento item) { Writes++; return Task.CompletedTask; }
    public Task AlterarCancelamentoAsync(Agendamento item) { Writes++; return Task.CompletedTask; }
}

sealed class FakeProcedimentoRepository : IProcedimentoRepository
{
    public Procedimento? Item;
    public bool AgendamentosAnteriores;
    public Task<IEnumerable<Procedimento>> BuscarTodosAtivosAsync() => Task.FromResult<IEnumerable<Procedimento>>(Item == null ? [] : new[] { Item });
    public Task<Procedimento?> BuscarPorIdAsync(int id) => Task.FromResult(Item);
    public Task<Procedimento?> BuscarPorNomeAsync(string nome) => Task.FromResult(Item);
    public Task<Procedimento?> BuscarPorDescricaoAsync(string descricao) => Task.FromResult(Item);
    public Task<bool> ExisteDescricaoAsync(string descricao, int? idIgnorado = null) => Task.FromResult(false);
    public Task<bool> TemAgendamentosComDuracaoAnteriorAsync(int id, int novaDuracao, DateTime agora) => Task.FromResult(AgendamentosAnteriores);
    public Task InserirAsync(Procedimento p) { p.ProcId = 1; Item = p; return Task.CompletedTask; }
    public Task AlterarAsync(Procedimento p) { Item = p; return Task.CompletedTask; }
}

