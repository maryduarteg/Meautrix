using Meautrix.DTO.Item;
using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IItemRepository
    {
        Task<Item> CriarAsync(Item item);
        Task<Item> AlterarAsync(Item item);
        Task<Item> AlterarParcialAsync(int iteId, ItemAlterarParcialDTO dados);
        Task<bool> AlterarStatusAsync(int iteId, char novoStatus); // inativar ('I') / reativar ('A')

        Task<Item> BuscarPorIdAsync(int iteId);
        Task<IEnumerable<Item>> BuscarTodosAsync();

        Task<IEnumerable<Item>> BuscarPorNomeAsync(string nome);
        Task<IEnumerable<Item>> BuscarPorProdIdAsync(int prodId);
        Task<IEnumerable<Item>> BuscarPorQuantidadeAtualMenorQueAsync(float quantidade);
    }
}