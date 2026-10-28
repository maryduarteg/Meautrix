using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class ProcedimentoRepository : IProcedimentoRepository
    {
        private readonly MeautrixDbContext _context;

        public ProcedimentoRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Procedimento>> BuscarTodosAtivosAsync()
        {
            return await _context.Procedimento
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Procedimento?> BuscarPorIdAsync(int id)
        {
            return await _context.Procedimento
                .FirstOrDefaultAsync(p => p.ProcId == id);
        }

        public async Task<Procedimento?> BuscarPorDescricaoAsync(string descricao)
        {
            return await _context.Procedimento
                .FirstOrDefaultAsync(p => p.ProcDescricao == descricao);
        }
        public async Task<bool> ExisteDescricaoAsync(string descricao, int? idIgnorado = null)
        {
            var descricaoNormalizada = descricao.Trim().ToUpperInvariant();

            return await _context.Procedimento.AnyAsync(p =>
                (!idIgnorado.HasValue || p.ProcId != idIgnorado.Value) &&
                p.ProcDescricao.Trim().ToUpper() == descricaoNormalizada);
        }

        public async Task<Procedimento?> BuscarPorNomeAsync(string nome)
        {
            return await _context.Procedimento
                .FirstOrDefaultAsync( p => p.ProcNome == nome);
        }

        public Task<bool> TemAgendamentosComDuracaoAnteriorAsync(int id, int novaDuracao, DateTime agora) =>
            _context.Agendamentos.AnyAsync(a => a.Cancelado != "S" && a.ProcedimentoId == id && a.DataAgendadoPara >= agora &&
                (!a.DuracaoMinutos.HasValue || a.DuracaoMinutos.Value != novaDuracao));

        public async Task InserirAsync(Procedimento procedimento)
        {
            await _context.Procedimento.AddAsync(procedimento);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(Procedimento procedimento)
        {
            _context.Procedimento.Update(procedimento);
            await _context.SaveChangesAsync();
        }
    }
}
