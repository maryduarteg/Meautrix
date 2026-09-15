using Meautrix.DTO.Produto;
using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IProdutoService
    {
        Task<IEnumerable<ProdutoResponseDTO>> BuscarTodosAsync();
        Task<ProdutoResponseDTO?> BuscarPorIdAsync(int id);
        Task<ProdutoResponseDTO?> BuscarPorDescricaoAsync(string descricao);
        Task<ProdutoResponseDTO?> BuscarPorCategoriaAsync(int categoria);
        Task<ProdutoResponseDTO?> BuscarPorQuantidadeMinimaAsync(double quantidade);
        Task CriarAsync(ProdutoCriarDTO dto);
        Task AlterarAsync(int id,ProdutoAlterarDTO dto);
        Task AlterarParcialAsync(int id, ProdutoAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}