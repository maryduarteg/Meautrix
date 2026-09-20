using Meautrix.DTO.Item;

namespace Meautrix.Interfaces
{
    public interface IItemService
    {
        Task<ItemResponseDTO> CriarAsync(ItemCriarDTO dados);
        Task<ItemResponseDTO> AlterarAsync(int iteId, ItemAlterarDTO dados);
        Task<ItemResponseDTO> AlterarParcialAsync(int iteId, ItemAlterarParcialDTO dados);
        Task<bool> InativarAsync(int iteId);
        Task<bool> ReativarAsync(int iteId);

        Task<ItemResponseDTO> BuscarPorIdAsync(int iteId);
        Task<IEnumerable<ItemResponseDTO>> BuscarTodosAsync();

        Task<IEnumerable<ItemResponseDTO>> BuscarPorNomeAsync(string nome);
        Task<IEnumerable<ItemResponseDTO>> BuscarPorProdIdAsync(int prodId);
        Task<IEnumerable<ItemResponseDTO>> BuscarPorQuantidadeAtualMenorQueAsync(float quantidade);
    }
}