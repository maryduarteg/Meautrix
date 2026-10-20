using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class ProdutoProcedimentoRepository : IProdutoProcedimentoRepository
    {
        private readonly MeautrixDbContext _context;

        public ProdutoProcedimentoRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProdutoProcedimento>> BuscarPorProcedimentoAsync(int procId)
        {
            return await _context.ProdutosProcedimentos
                .AsNoTracking()
                .Where(vinculo => vinculo.ProcId == procId)
                .ToListAsync();
        }

        public async Task<ProdutoProcedimento?> BuscarAsync(int procId, int prodId)
        {
            return await _context.ProdutosProcedimentos
                .FirstOrDefaultAsync(vinculo => vinculo.ProcId == procId && vinculo.ProdId == prodId);
        }

        public async Task InserirAsync(ProdutoProcedimento produtoProcedimento)
        {
            await _context.ProdutosProcedimentos.AddAsync(produtoProcedimento);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(ProdutoProcedimento produtoProcedimento)
        {
            _context.ProdutosProcedimentos.Update(produtoProcedimento);
            await _context.SaveChangesAsync();
        }

        public async Task ExcluirAsync(ProdutoProcedimento produtoProcedimento)
        {
            _context.ProdutosProcedimentos.Remove(produtoProcedimento);
            await _context.SaveChangesAsync();
        }
    }
}
