using Meautrix.DTO.Promocao;
using Meautrix.Repository;
using Meautrix.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;

static class PostgresChecks
{
    // Executar apenas contra um banco descartável criado especificamente para testes.
    public static async Task Run(string connectionString, string migration, Action<bool, string> check)
    {
        var config = new NpgsqlConnectionStringBuilder(connectionString);
        if (config.Database?.StartsWith("promocoes_test_", StringComparison.Ordinal) != true)
            throw new InvalidOperationException("O teste exige um banco descartável com prefixo promocoes_test_.");
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        var script = await File.ReadAllTextAsync(migration);
        for (var i = 0; i < 2; i++)
        {
            await using var command = new NpgsqlCommand(script, connection);
            await command.ExecuteNonQueryAsync();
        }
        check(true, "Migração pode ser aplicada duas vezes.");
        await using var todayCommand = new NpgsqlCommand("SELECT CURRENT_DATE::text", connection);
        var today = DateOnly.ParseExact((string)(await todayCommand.ExecuteScalarAsync())!, "yyyy-MM-dd");
        var options = new DbContextOptionsBuilder<MeautrixDbContext>().UseNpgsql(connectionString).Options;
        await using var context = new MeautrixDbContext(options);
        var repository = new PromocaoRepository(context);
        var service = new PromocaoService(repository);
        check(!await context.Promocoes.AnyAsync(), "Usar banco descartável vazio.");

        async Task<int> Add(string title, string message, DateOnly start, DateOnly end) =>
            (await service.CriarAsync(new PromocaoSalvarDTO {
                PromTitulo = title, PromMensagem = message, PromDataMinima = start, PromDataMaxima = end,
            })).PromId;
        var active = await Add("Beleza 100%_especial", "Oferta Verão", today, today);
        var expired = await Add("Beleza antiga", "Oferta Verão", today.AddDays(-10), today.AddDays(-1));
        var future = await Add("Beleza futura", "Outra mensagem", today.AddDays(1), today.AddDays(10));
        var spanning = await Add("Campanha geral", "Oferta Verão", today.AddDays(-10), today.AddDays(10));
        var literal = await Add("Beleza 100XXespecial", "Outra mensagem", today, today);
        async Task<int[]> Ids(PromocaoFiltroDTO filters) => (await service.BuscarTodosAsync(filters)).Select(p => p.PromId).Order().ToArray();
        check((await Ids(new())).Length == 5, "GET sem filtros retorna todas as vigências.");
        check((await Ids(new() { ApenasAtivas = true })).SequenceEqual(new[] { active, spanning, literal }.Order()), "CURRENT_DATE inclui os dois extremos e exclui passado/futuro.");
        check((await Ids(new() { ApenasAtivas = false })).Length == 5, "false não restringe a vigência.");
        check((await Ids(new() { Titulo = "bELEZA", Mensagem = "oFERTA", ApenasAtivas = true })).SequenceEqual([active]), "ILIKE combina os filtros sem diferenciar caixa.");
        check((await Ids(new() { Titulo = "%_" })).SequenceEqual([active]), "Curingas são tratados literalmente.");
        check((await Ids(new() { DataInicio = today, DataFim = today })).SequenceEqual(new[] { active, spanning, literal }.Order()), "Interseção inclui promoção que cobre todo o período.");
        check((await Ids(new() { DataInicio = today })).SequenceEqual(new[] { active, future, spanning, literal }.Order()), "Aceitar somente data inicial.");
        check((await Ids(new() { DataFim = today })).SequenceEqual(new[] { active, expired, spanning, literal }.Order()), "Aceitar somente data final.");
        check((await Ids(new() { Titulo = "' OR 1=1 --" })).Length == 0, "Busca de texto usa parâmetros.");
        var original = await service.BuscarPorIdAsync(active);
        check(original.CreatedAt.HasValue && original.CreatedAt.Value.Kind == DateTimeKind.Utc, "Banco gera created_at em timestamptz.");
        await service.AlterarAsync(active, new() { PromTitulo = "Editada", PromMensagem = "Nova mensagem", PromDataMinima = today, PromDataMaxima = today.AddDays(2) });
        context.ChangeTracker.Clear();
        var edited = await service.BuscarPorIdAsync(active);
        check(edited.PromTitulo == "Editada" && edited.CreatedAt == original.CreatedAt, "PUT persiste e preserva created_at.");
        await service.ExcluirAsync(active);
        check(!await context.Promocoes.AnyAsync(p => p.PromId == active), "DELETE persiste a exclusão.");
        try
        {
            await context.Database.ExecuteSqlRawAsync("INSERT INTO public.promocoes (prom_titulo, prom_mensagem, prom_data_minima, prom_data_maxima) VALUES ('Inválida', 'Teste', CURRENT_DATE, CURRENT_DATE - 1)");
            check(false, "Banco deve recusar datas invertidas.");
        }
        catch (PostgresException ex) when (ex.SqlState == "23514") { check(true, "Banco recusa datas invertidas."); }

        // Exercita também a atualização de tabelas anteriores, preservando seus registros.
        async Task Execute(string sql)
        {
            await using var command = new NpgsqlCommand(sql, connection);
            await command.ExecuteNonQueryAsync();
        }
        await Execute("""
            CREATE SCHEMA teste_original;
            ALTER TABLE public.promocoes SET SCHEMA teste_original;
            CREATE TABLE public.promocoes (
                prom_id SERIAL, prom_titulo TEXT, prom_mensagem TEXT,
                prom_data_minima DATE, prom_data_maxima DATE, created_at TIMESTAMPTZ
            );
            INSERT INTO public.promocoes VALUES (42, 'Legado', 'Preservar', CURRENT_DATE, CURRENT_DATE, '2026-01-01T12:00:00Z');
            SELECT setval(pg_get_serial_sequence('public.promocoes', 'prom_id'), 100, true);
            """);
        await Execute(script);
        await Execute(script);
        context.ChangeTracker.Clear();
        var legacy = await context.Promocoes.SingleAsync();
        check(legacy.PromId == 42 && legacy.PromTitulo == "Legado" && legacy.CreatedAt == new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc), "Migração preserva registros existentes.");
        var next = await Add("Próxima", "Teste", today, today);
        check(next > 100, "Conversão de SERIAL preserva o avanço da sequência.");

        await Execute("CREATE SCHEMA teste_legado; ALTER TABLE public.promocoes SET SCHEMA teste_legado; CREATE TABLE public.promocoes (prom_titulo TEXT);");
        await Execute(script);
        await Execute(script);
        context.ChangeTracker.Clear();
        check(await Add("Tabela ajustada", "Teste", today, today) > 0, "Migração adiciona colunas e identidade ausentes.");

        await Execute("ALTER TABLE public.promocoes ALTER COLUMN prom_titulo TYPE TEXT; UPDATE public.promocoes SET prom_titulo = repeat('x', 61);");
        try { await Execute(script); check(false, "Migração deve recusar texto longo."); }
        catch (PostgresException ex) when (ex.SqlState == "P0001")
        {
            await Execute("ROLLBACK");
            context.ChangeTracker.Clear();
            check((await context.Promocoes.SingleAsync()).PromTitulo.Length == 61, "Migração inválida reverte sem truncar os dados.");
        }
        Console.WriteLine("Verificações de integração PostgreSQL passaram.");
    }
}
