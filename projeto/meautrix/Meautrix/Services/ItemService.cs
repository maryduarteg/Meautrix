using Meautrix.DTO.CategoriaProduto;
using Meautrix.DTO.Item;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Repository;

namespace Meautrix.Services
{
    public class ItemService : IItemService
    {
        private readonly IItemRepository _itemRepository;

        public ItemService(IItemRepository itemRepository)
        {
            _itemRepository = itemRepository;
        }

        public async Task<ItemResponseDTO> CriarAsync(ItemCriarDTO dados)
        {
            if (string.IsNullOrWhiteSpace(dados.IteNome))
                throw new ArgumentException("O nome (etiqueta) do item é obrigatório.");

            if (string.IsNullOrWhiteSpace(dados.IteLoteNome))
                throw new ArgumentException("O nome do lote é obrigatório.");

            // Regra: só pode existir um item ATIVO por etiqueta (IteNome) do mesmo produto.
            var itensDoProduto = await _itemRepository.BuscarPorProdIdAsync(dados.ProdId);
            var etiquetaEmUso = itensDoProduto.Any(i =>
                i.IteAtivo == 'A' &&
                i.IteNome.Equals(dados.IteNome, StringComparison.OrdinalIgnoreCase));

            if (etiquetaEmUso)
                throw new InvalidOperationException("Já existe um item ativo com essa etiqueta para o produto informado.");

            var item = new Item
            {
                IteNome = dados.IteNome,
                ProdId = dados.ProdId,
                IteQuantidadeAtual = dados.IteQuantidadeAtual,
                IteQuantidadeSaidaAlterada = dados.IteQuantidadeSaidaAlterada,
                IteLoteNome = dados.IteLoteNome,
                IteLoteDataAquisicao = dados.IteLoteDataAquisicao,
                IteLoteDataVencimento = dados.IteLoteDataVencimento,
            };

            var criado = await _itemRepository.CriarAsync(item);
            return MapParaResponse(criado);
        }

        public async Task<ItemResponseDTO> AlterarAsync(int iteId, ItemAlterarDTO dados)
        {
            var item = new Item
            {
                IteId = iteId,
                IteNome = dados.IteNome,
                ProdId = dados.ProdId,
                IteAtivo = dados.IteAtivo,
                IteQuantidadeAtual = dados.IteQuantidadeAtual,
                IteQuantidadeSaidaAlterada = dados.IteQuantidadeSaidaAlterada,
                IteLoteNome = dados.IteLoteNome,
                IteLoteDataAquisicao = dados.IteLoteDataAquisicao,
                IteLoteDataVencimento = dados.IteLoteDataVencimento,
            };

            var alterado = await _itemRepository.AlterarAsync(item);
            if (alterado == null)
                throw new KeyNotFoundException("Item não encontrado.");

            return MapParaResponse(alterado);
        }

        public async Task<ItemResponseDTO> AlterarParcialAsync(int iteId, ItemAlterarParcialDTO dados)
        {
            var alterado = await _itemRepository.AlterarParcialAsync(iteId, dados);
            if (alterado == null)
                throw new KeyNotFoundException("Item não encontrado.");

            return MapParaResponse(alterado);
        }

        public async Task<bool> InativarAsync(int iteId)
        {
            return await _itemRepository.AlterarStatusAsync(iteId, 'I');
        }

        public async Task<bool> ReativarAsync(int iteId)
        {
            return await _itemRepository.AlterarStatusAsync(iteId, 'A');
        }

        public async Task<ItemResponseDTO> BuscarPorIdAsync(int iteId)
        {
            var item = await _itemRepository.BuscarPorIdAsync(iteId);
            return item == null ? null : MapParaResponse(item);
        }

        public async Task<IEnumerable<ItemResponseDTO>> BuscarTodosAsync()
        {
            var itens = await _itemRepository.BuscarTodosAsync();
            return itens.Select(MapParaResponse);
        }

        public async Task<IEnumerable<ItemResponseDTO>> BuscarPorNomeAsync(string nome)
        {
            var itens = await _itemRepository.BuscarPorNomeAsync(nome);
            return itens.Select(MapParaResponse);
        }

        public async Task<IEnumerable<ItemResponseDTO>> BuscarPorProdIdAsync(int prodId)
        {
            var itens = await _itemRepository.BuscarPorProdIdAsync(prodId);
            return itens.Select(MapParaResponse);
        }

        public async Task<IEnumerable<ItemResponseDTO>> BuscarPorQuantidadeAtualMenorQueAsync(float quantidade)
        {
            var itens = await _itemRepository.BuscarPorQuantidadeAtualMenorQueAsync(quantidade);
            return itens.Select(MapParaResponse);
        }

        private static ItemResponseDTO MapParaResponse(Item item)
        {
            return new ItemResponseDTO
            {
                IteId = item.IteId,
                IteNome = item.IteNome,
                ProdId = item.ProdId,
                IteAtivo = item.IteAtivo,
                IteQuantidadeAtual = item.IteQuantidadeAtual,
                IteQuantidadeSaidaAlterada = item.IteQuantidadeSaidaAlterada,
                IteLoteNome = item.IteLoteNome,
                IteLoteDataAquisicao = item.IteLoteDataAquisicao,
                IteLoteDataVencimento = item.IteLoteDataVencimento,
            };
        }
    }
}