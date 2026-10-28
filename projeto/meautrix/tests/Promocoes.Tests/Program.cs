using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Meautrix.Controllers;
using Meautrix.DTO.Promocao;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

var checks = 0;
void Check(bool condition, string description)
{
    checks++;
    if (!condition) throw new Exception(description);
}
var repository = new FakeRepository();
var service = new PromocaoService(repository);
PromocaoSalvarDTO Valid() => new()
{
    PromTitulo = "  Promoção de verão  ", PromMensagem = "  Aproveite!  ",
    PromDataMinima = new DateOnly(2026, 12, 1), PromDataMaxima = new DateOnly(2026, 12, 31),
};
async Task Reject(Func<Task> action, Type exception)
{
    var before = JsonSerializer.Serialize(repository.Items);
    var writes = repository.Writes;
    var rejected = false;
    try { await action(); }
    catch (Exception e) when (e.GetType() == exception) { rejected = true; }
    Check(rejected, $"Esperava {exception.Name}.");
    Check(before == JsonSerializer.Serialize(repository.Items) && writes == repository.Writes,
        "Entrada inválida não pode alterar os dados.");
}

var created = await service.CriarAsync(Valid());
Check(created.PromId == 1 && repository.Items.Count == 1, "Cadastro deve persistir e retornar o ID.");
Check(created.PromTitulo == "Promoção de verão" && created.PromMensagem == "Aproveite!", "Remover espaços nas extremidades.");
var entity = repository.Items.Single();
var originalCreation = new DateTime(2026, 10, 27, 12, 0, 0, DateTimeKind.Utc);
entity.CreatedAt = originalCreation;

Action<PromocaoSalvarDTO>[] invalid = [
    d => d.PromTitulo = null, d => d.PromTitulo = "", d => d.PromTitulo = "   ", d => d.PromTitulo = new string('a', 61),
    d => d.PromMensagem = null, d => d.PromMensagem = "", d => d.PromMensagem = "\t", d => d.PromMensagem = new string('b', 101),
    d => d.PromDataMinima = null, d => d.PromDataMaxima = null,
    d => d.PromDataMaxima = d.PromDataMinima!.Value.AddDays(-1),
];
foreach (var change in invalid)
{
    var dto = Valid(); change(dto);
    await Reject(() => service.CriarAsync(dto), typeof(InvalidOperationException));
    await Reject(() => service.AlterarAsync(created.PromId, dto), typeof(InvalidOperationException));
}
var boundary = Valid(); boundary.PromTitulo = new string('a', 60); boundary.PromMensagem = new string('b', 100);
boundary.PromDataMaxima = boundary.PromDataMinima;
await service.AlterarAsync(created.PromId, boundary);
Check(entity.PromTitulo.Length == 60 && entity.PromMensagem.Length == 100, "Aceitar limites de caracteres.");
Check(entity.PromDataMaxima == entity.PromDataMinima, "Aceitar promoção de um único dia.");
Check(entity.CreatedAt == originalCreation, "Edição preserva data de criação.");
var found = await service.BuscarPorIdAsync(created.PromId);
Check(found.PromId == created.PromId, "Consultar promoção por ID.");
var json = JsonSerializer.Serialize(found);
Check(json.Contains("\"prom_id\"") && json.Contains("\"prom_data_minima\":\"2026-12-01\"") && json.Contains("\"created_at\""), "Contrato JSON usa nomes e datas solicitados.");
var filters = new PromocaoFiltroDTO { Titulo = "verão", Mensagem = "oferta", DataInicio = new(2026, 1, 1), DataFim = new(2026, 12, 31), ApenasAtivas = true };
await service.BuscarTodosAsync(filters);
Check(ReferenceEquals(filters, repository.LastFilter), "Encaminhar todos os filtros combinados ao repositório.");
await Reject(() => service.BuscarTodosAsync(new PromocaoFiltroDTO { DataInicio = new(2026, 12, 1), DataFim = new(2026, 11, 30) }), typeof(InvalidOperationException));
foreach (var filter in new[] { new PromocaoFiltroDTO(), new PromocaoFiltroDTO { DataInicio = new(2026, 1, 1) }, new PromocaoFiltroDTO { DataFim = new(2026, 1, 1) } })
    Check(Validator.TryValidateObject(filter, new ValidationContext(filter), [], true), "Filtros e extremos são opcionais.");
await Reject(() => service.BuscarPorIdAsync(999), typeof(KeyNotFoundException));
await Reject(() => service.AlterarAsync(999, Valid()), typeof(KeyNotFoundException));
await Reject(() => service.ExcluirAsync(999), typeof(KeyNotFoundException));

var controller = new PromocoesController(service);
Check(typeof(PromocoesController).IsDefined(typeof(AuthorizeAttribute), true), "Rotas devem exigir sessão autenticada.");
Check((await controller.Criar(Valid())) is CreatedResult { StatusCode: 201, Location: "/api/promocoes/2" }, "POST deve retornar 201 com localização.");
Check(await controller.BuscarPorId(999) is NotFoundObjectResult, "GET inexistente retorna 404.");
Check(await controller.Alterar(999, Valid()) is NotFoundObjectResult, "PUT inexistente retorna 404.");
Check(await controller.Excluir(999) is NotFoundObjectResult, "DELETE inexistente retorna 404.");
Check(await controller.Criar(new PromocaoSalvarDTO()) is BadRequestObjectResult, "POST inválido retorna 400.");
Check(await controller.Alterar(created.PromId, new PromocaoSalvarDTO()) is BadRequestObjectResult, "PUT incompleto retorna 400.");
Check(await controller.Excluir(created.PromId) is NoContentResult, "DELETE retorna 204.");
Check(repository.Items.All(p => p.PromId != created.PromId), "Exclusão remove o registro.");
if (Environment.GetEnvironmentVariable("PROMOCOES_TEST_CONNECTION") is { Length: > 0 } connectionString)
{
    var migration = args.FirstOrDefault() ?? throw new ArgumentException("Informe o caminho do script SQL para o teste PostgreSQL.");
    await PostgresChecks.Run(connectionString, migration, Check);
}
Console.WriteLine($"{checks} verificações de promoções passaram.");

sealed class FakeRepository : IPromocaoRepository
{
    public List<Promocao> Items { get; } = [];
    public int Writes { get; private set; }
    public PromocaoFiltroDTO? LastFilter { get; private set; }
    public Task<IEnumerable<Promocao>> BuscarTodosAsync(PromocaoFiltroDTO filtro)
    {
        LastFilter = filtro;
        return Task.FromResult<IEnumerable<Promocao>>(Items);
    }
    public Task<Promocao?> BuscarPorIdAsync(int id) => Task.FromResult(Items.Find(p => p.PromId == id));
    public Task InserirAsync(Promocao promocao)
    {
        promocao.PromId = Items.Count == 0 ? 1 : Items.Max(p => p.PromId) + 1;
        Items.Add(promocao); Writes++;
        return Task.CompletedTask;
    }
    public Task AlterarAsync(Promocao promocao) { Writes++; return Task.CompletedTask; }
    public Task ExcluirAsync(Promocao promocao) { Items.Remove(promocao); Writes++; return Task.CompletedTask; }
}
