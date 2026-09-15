using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IProdutoRepository
    {
        Task<IEnumerable<Produto>> BuscarTodosAtivosAsync();
        Task<Produto?> BuscarPorIdAsync(int id);
        Task<Produto?> BuscarPorQuantidadeMinimaAsync(double quantidade);
        Task<Produto?> BuscarPorCategoriaAsync(int categoria);
        Task<Produto?> BuscarPorDescricaoAsync(string descricao);
        Task InserirAsync(Produto produto);
        Task AlterarAsync(Produto produto);
    }
}