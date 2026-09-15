using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface ICategoriaProdutoRepository
    {
        Task<IEnumerable<CategoriaProduto>> BuscarTodosAtivosAsync();
        Task<CategoriaProduto?> BuscarPorIdAsync(int id);
        Task<CategoriaProduto?> BuscarPorDescricaoAsync(string descricao);
        Task InserirAsync(CategoriaProduto categoriaProduto);
        Task AlterarAsync(CategoriaProduto categoriaProduto);
    }
}