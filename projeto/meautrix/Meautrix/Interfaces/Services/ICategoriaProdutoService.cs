using Meautrix.DTO.CategoriaProduto;

namespace Meautrix.Interfaces
{
    public interface ICategoriaProdutoService
    {
        Task<IEnumerable<CategoriaProdutoResponseDTO>> BuscarTodosAsync();
        Task<CategoriaProdutoResponseDTO?> BuscarPorIdAsync(int id);
        Task<CategoriaProdutoResponseDTO?> BuscarPorDescricaoAsync(string descricao);
        Task CriarAsync(CategoriaProdutoCriarDTO dto);
        Task AlterarAsync(int id, CategoriaProdutoAlterarDTO dto);
        Task AlterarParcialAsync(int id, CategoriaProdutoAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}