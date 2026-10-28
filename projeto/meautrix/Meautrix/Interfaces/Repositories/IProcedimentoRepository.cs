using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IProcedimentoRepository
    {
        Task<IEnumerable<Procedimento>> BuscarTodosAtivosAsync();
        Task<Procedimento?> BuscarPorIdAsync(int id);
        Task<Procedimento?> BuscarPorNomeAsync(string nome);
        Task<Procedimento?> BuscarPorDescricaoAsync(string descricao);
        Task<bool> ExisteDescricaoAsync(string descricao, int? idIgnorado = null);
        Task<bool> TemAgendamentosComDuracaoAnteriorAsync(int id, int novaDuracao, DateTime agora);
        Task InserirAsync(Procedimento procedimento);
        Task AlterarAsync(Procedimento procedimento);
    }
}
