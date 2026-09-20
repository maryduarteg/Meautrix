using Meautrix.DTO.Item;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class ItemRepository : IItemRepository
    {
        private readonly MeautrixDbContext _context;

        public ItemRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<Item> CriarAsync(Item item)
        {
            item.IteAtivo = 'A';
            _context.Item.Add(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<Item> AlterarAsync(Item item)
        {
            var existente = await _context.Item.FindAsync(item.IteId);
            if (existente == null) return null;

            existente.IteNome = item.IteNome;
            existente.ProdId = item.ProdId;
            existente.IteQuantidadeAtual = item.IteQuantidadeAtual;
            existente.IteQuantidadeSaidaAlterada = item.IteQuantidadeSaidaAlterada;
            existente.IteLoteNome = item.IteLoteNome;
            existente.IteLoteDataAquisicao = item.IteLoteDataAquisicao;
            existente.IteLoteDataVencimento = item.IteLoteDataVencimento;

            await _context.SaveChangesAsync();
            return existente;
        }

        public async Task<Item> AlterarParcialAsync(int iteId, ItemAlterarParcialDTO dados)
        {
            var existente = await _context.Item.FindAsync(iteId);
            if (existente == null) return null;

            if (dados.IteNome != null) existente.IteNome = dados.IteNome;
            if (dados.ProdId.HasValue) existente.ProdId = dados.ProdId.Value;
            if (dados.IteAtivo.HasValue) existente.IteAtivo = dados.IteAtivo.Value;
            if (dados.IteQuantidadeAtual.HasValue) existente.IteQuantidadeAtual = dados.IteQuantidadeAtual.Value;
            if (dados.IteQuantidadeSaidaAlterada.HasValue) existente.IteQuantidadeSaidaAlterada = dados.IteQuantidadeSaidaAlterada.Value;
            if (dados.IteLoteNome != null) existente.IteLoteNome = dados.IteLoteNome;
            if (dados.IteLoteDataAquisicao.HasValue) existente.IteLoteDataAquisicao = dados.IteLoteDataAquisicao.Value;
            if (dados.IteLoteDataVencimento.HasValue) existente.IteLoteDataVencimento = dados.IteLoteDataVencimento.Value;

            await _context.SaveChangesAsync();
            return existente;
        }

        public async Task<bool> AlterarStatusAsync(int iteId, char novoStatus)
        {
            var existente = await _context.Item.FindAsync(iteId);
            if (existente == null) return false;

            existente.IteAtivo = novoStatus;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Item> BuscarPorIdAsync(int iteId)
        {
            return await _context.Item.FindAsync(iteId);
        }

        public async Task<IEnumerable<Item>> BuscarTodosAsync()
        {
            return await Task.FromResult(_context.Item.ToList());
        }

        public async Task<IEnumerable<Item>> BuscarPorNomeAsync(string nome)
        {
            return await Task.FromResult(
                _context.Item
                    .Where(i => i.IteNome.Contains(nome))
                    .ToList());
        }

        public async Task<IEnumerable<Item>> BuscarPorProdIdAsync(int prodId)
        {
            return await Task.FromResult(
                _context.Item
                    .Where(i => i.ProdId == prodId)
                    .ToList());
        }

        public async Task<IEnumerable<Item>> BuscarPorQuantidadeAtualMenorQueAsync(float quantidade)
        {
            return await Task.FromResult(
                _context.Item
                    .Where(i => i.IteQuantidadeAtual < quantidade)
                    .ToList());
        }
    }
}