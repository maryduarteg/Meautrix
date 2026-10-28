using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Meautrix.Repository;

public class AgendamentoRepository(MeautrixDbContext context) : IAgendamentoRepository
{
    public async Task<IEnumerable<Agendamento>> BuscarTodosAsync() =>
        await context.Agendamentos.AsNoTracking()
            .Include(a => a.Procedimento).Include(a => a.Cliente)
            .OrderBy(a => a.DataAgendadoPara).ThenBy(a => a.Id).ToListAsync();

    public async Task<IEnumerable<Agendamento>> BuscarAPartirDeAsync(DateTime data) =>
        await context.Agendamentos.AsNoTracking()
            .Include(a => a.Procedimento).Include(a => a.Cliente)
            .Where(a => a.DataAgendadoPara >= data)
            .OrderBy(a => a.DataAgendadoPara).ThenBy(a => a.Id).ToListAsync();

    public Task<Agendamento?> BuscarPorIdAsync(int id) =>
        context.Agendamentos.Include(a => a.Procedimento).Include(a => a.Cliente)
            .FirstOrDefaultAsync(a => a.Id == id);

    public Task<bool> ProcedimentoAtivoAsync(int id) =>
        context.Procedimento.AnyAsync(p => p.ProcId == id && p.ProcAtivo == "A");

    public Task<bool> ClienteAtivoAsync(int id) =>
        context.Clientes.AnyAsync(c => c.CliId == id && c.CliAtivo == "A");

    public Task<bool> UsuarioAtivoAsync(int id) =>
        context.Usuarios.AnyAsync(u => u.UsuId == id && u.UsuAtivo == 'A');

    public Task<int?> BuscarDuracaoProcedimentoAsync(int id) =>
        context.Procedimento.Where(p => p.ProcId == id).Select(p => p.ProcDuracaoMinutos).FirstOrDefaultAsync();

    public Task<bool> HaAgendamentosSemDuracaoAsync() =>
        context.Agendamentos.AnyAsync(a => a.Cancelado != "S" && !a.DuracaoMinutos.HasValue &&
            (!a.Procedimento!.ProcDuracaoMinutos.HasValue || a.Procedimento.ProcDuracaoMinutos <= 0));

    public Task<bool> HorarioOcupadoAsync(DateTime inicio, DateTime fim, int? idIgnorado = null) =>
        context.Agendamentos.AnyAsync(a =>
            a.Cancelado != "S" && (!idIgnorado.HasValue || a.Id != idIgnorado.Value) &&
            a.DataAgendadoPara < fim &&
            a.DataAgendadoPara.AddMinutes((double)(a.DuracaoMinutos ?? a.Procedimento!.ProcDuracaoMinutos!.Value)) > inicio);

    public async Task InserirAsync(Agendamento agendamento)
    {
        agendamento.Cancelado = "N";
        context.Agendamentos.Add(agendamento);
        await SalvarAsync();
    }

    public async Task AlterarAsync(Agendamento agendamento)
    {
        context.Agendamentos.Update(agendamento);
        await SalvarAsync();
    }

    public async Task AlterarCancelamentoAsync(Agendamento agendamento)
    {
        // A ação grava somente a flag e o responsável, sem atualizar o restante do cadastro.
        context.Entry(agendamento).Property(a => a.Cancelado).IsModified = true;
        context.Entry(agendamento).Property(a => a.UsuarioCancelouId).IsModified = true;
        await SalvarAsync();
    }

    private async Task SalvarAsync()
    {
        try { await context.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
            { SqlState: "23P01", ConstraintName: "ex_agendamento_intervalo" } or PostgresException
            { SqlState: "23505", ConstraintName: "ux_agendamento_horario" or "ux_agendamento_cliente_horario" })
        {
            throw new InvalidOperationException("O período selecionado coincide com outro agendamento. Escolha um horário após o término do procedimento anterior.")
            {
                Data = { ["campo"] = "dataAgendadoPara" }
            };
        }
    }
}
