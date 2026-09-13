using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IMedidaRepository
    {
        Task<IEnumerable<Medida>> BuscarTodosAtivosAsync();
        Task<Medida?> BuscarPorIdAsync(int id);
        Task<Medida?> BuscarPorSiglaAsync(string sigla);
        Task<Medida?> BuscarPorDescricaoAsync(string sigla);
        Task InserirAsync(Medida medida);
        Task AlterarAsync(Medida medida);
    }
}