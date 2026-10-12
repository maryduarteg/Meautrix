using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IProcedimentoRepository
    {
        Task<IEnumerable<Procedimento>> BuscarTodosAtivosAsync();
        Task<Procedimento?> BuscarPorIdAsync(int id);
        Task<Procedimento?> BuscarPorNomeAsync(string nome);
        Task<Procedimento?> BuscarPorDescricaoAsync(string descricao);
        Task InserirAsync(Procedimento procedimento);
        Task AlterarAsync(Procedimento procedimento);
    }
}