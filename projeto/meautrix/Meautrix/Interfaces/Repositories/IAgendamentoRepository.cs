using Meautrix.Entidades;

namespace Meautrix.Interfaces;

public interface IAgendamentoRepository
{
    Task<IEnumerable<Agendamento>> BuscarTodosAsync();
    Task<Agendamento?> BuscarPorIdAsync(int id);
    Task<IEnumerable<Agendamento>> BuscarAPartirDeAsync(DateTime data);
    Task<bool> ProcedimentoAtivoAsync(int id);
    Task<bool> ClienteAtivoAsync(int id);
    Task<bool> UsuarioAtivoAsync(int id);
    Task<int?> BuscarDuracaoProcedimentoAsync(int id);
    Task<bool> HaAgendamentosSemDuracaoAsync();
    Task<bool> HorarioOcupadoAsync(DateTime inicio, DateTime fim, int? idIgnorado = null);
    Task InserirAsync(Agendamento agendamento);
    Task AlterarAsync(Agendamento agendamento);
    Task AlterarCancelamentoAsync(Agendamento agendamento);
}
