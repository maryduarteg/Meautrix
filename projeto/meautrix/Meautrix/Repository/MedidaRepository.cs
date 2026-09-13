using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class MedidaRepository : IMedidaRepository
    {
        private readonly MeautrixDbContext _context;

        public MedidaRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Medida>> BuscarTodosAtivosAsync()
        {
            return await _context.Medidas
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Medida?> BuscarPorIdAsync(int id)
        {
            return await _context.Medidas
                .FirstOrDefaultAsync(m => m.MedId == id);
        }

        public async Task<Medida?> BuscarPorSiglaAsync(string sigla)
        {
            return await _context.Medidas
                .FirstOrDefaultAsync(m => m.MedSigla == sigla);
        }

        public async Task<Medida?> BuscarPorDescricaoAsync(string descricao)
        {
            return await _context.Medidas
                .FirstOrDefaultAsync(m => m.MedDescricao == descricao);
        }

        public async Task InserirAsync(Medida medida)
        {
            await _context.Medidas.AddAsync(medida);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(Medida medida)
        {
            _context.Medidas.Update(medida);
            await _context.SaveChangesAsync();
        }
    }
}