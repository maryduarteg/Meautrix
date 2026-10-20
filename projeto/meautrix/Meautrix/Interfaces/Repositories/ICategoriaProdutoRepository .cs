using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface ICategoriaProdutoRepository
    {
        Task<IEnumerable<CategoriaProduto>> BuscarTodosAtivosAsync();
        Task<CategoriaProduto?> BuscarPorIdAsync(int id);
        Task<CategoriaProduto?> BuscarPorDescricaoAsync(string descricao);
        Task<bool> ExisteDescricaoAsync(string descricao, int? idIgnorado = null);
        Task InserirAsync(CategoriaProduto categoriaProduto);
        Task AlterarAsync(CategoriaProduto categoriaProduto);
    }
}
