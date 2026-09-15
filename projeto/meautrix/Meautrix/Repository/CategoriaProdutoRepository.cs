using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class CategoriaProdutoRepository : ICategoriaProdutoRepository
    {
        private readonly MeautrixDbContext _context;

        public CategoriaProdutoRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CategoriaProduto>> BuscarTodosAtivosAsync()
        {
            return await _context.Categorias_Produtos
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<CategoriaProduto?> BuscarPorIdAsync(int id)
        {
            return await _context.Categorias_Produtos
                .FirstOrDefaultAsync(cp => cp.CatProdId == id);
        }

        public async Task<CategoriaProduto?> BuscarPorDescricaoAsync(string descricao)
        {
            return await _context.Categorias_Produtos
                .FirstOrDefaultAsync(cp => cp.CatProdDescricao == descricao);
        }

        public async Task InserirAsync(CategoriaProduto categoriaProduto)
        {
            await _context.Categorias_Produtos.AddAsync(categoriaProduto);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(CategoriaProduto categoriaProduto)
        {
            _context.Categorias_Produtos.Update(categoriaProduto);
            await _context.SaveChangesAsync();
        }
    }
}