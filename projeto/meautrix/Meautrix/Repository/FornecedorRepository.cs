using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class FornecedorRepository : IFornecedorRepository
    {
        private readonly MeautrixDbContext _context;

        public FornecedorRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Fornecedor>> BuscarTodosAtivosAsync()
        {
            return await _context.Fornecedores
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Fornecedor?> BuscarPorIdAsync(int id)
        {
            return await _context.Fornecedores
                .FirstOrDefaultAsync(f => f.FornId == id);
        }

        public async Task<Fornecedor?> BuscarPorCnpjAsync(string cnpj)
        {
            return await _context.Fornecedores
                .FirstOrDefaultAsync(f => f.FornCnpj == cnpj);
        }

        public async Task<Fornecedor?> BuscarPorRazaoSocialAsync(string razaosocial)
        {
            return await _context.Fornecedores
                .FirstOrDefaultAsync(f => f.FornRazaoSocial == razaosocial);
        }

        public async Task InserirAsync(Fornecedor fornecedor)
        {
            await _context.Fornecedores.AddAsync(fornecedor);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(Fornecedor fornecedor)
        {
            _context.Fornecedores.Update(fornecedor);
            await _context.SaveChangesAsync();
        }
    }
}