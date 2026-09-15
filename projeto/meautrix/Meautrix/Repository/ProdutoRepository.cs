using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class ProdutoRepository : IProdutoRepository
    {
        private readonly MeautrixDbContext _context;

        public ProdutoRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Produto>> BuscarTodosAtivosAsync()
        {
            return await _context.Produtos
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Produto?> BuscarPorIdAsync(int id)
        {
            return await _context.Produtos
                .FirstOrDefaultAsync(p => p.ProdId == id);
        }

        public async Task<Produto?> BuscarPorDescricaoAsync(string descricao)
        {
            return await _context.Produtos
                .FirstOrDefaultAsync(p => p.ProdDescricao == descricao);
        }
        public async Task<Produto?> BuscarPorQuantidadeMinimaAsync(double quantidade)
        {
            return await _context.Produtos
                .FirstOrDefaultAsync(p => p.ProdQuantidadeMinima == quantidade);
        }
        public async Task<Produto?> BuscarPorCategoriaAsync(int categoria)
        {
            return await _context.Produtos
                .FirstOrDefaultAsync(p => p.CatProdId == categoria);
        }

        public async Task InserirAsync(Produto produto)
        {
            await _context.Produtos.AddAsync(produto);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(Produto produto)
        {
            _context.Produtos.Update(produto);
            await _context.SaveChangesAsync();
        }
    }
}