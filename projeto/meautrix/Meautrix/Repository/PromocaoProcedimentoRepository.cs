using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository;

public class PromocaoProcedimentoRepository(MeautrixDbContext context) : IPromocaoProcedimentoRepository
{
    public async Task<IEnumerable<PromocaoProcedimento>> BuscarPorPromocaoAsync(int promId) =>
        await context.PromocoesProcedimentos
            .AsNoTracking()
            .Include(vinculo => vinculo.Procedimento)
            .Where(vinculo => vinculo.PromocoesPromId == promId)
            .OrderBy(vinculo => vinculo.Procedimento!.ProcNome)
            .ToListAsync();

    public Task<PromocaoProcedimento?> BuscarPorIdAsync(int promId, int promProcId) =>
        context.PromocoesProcedimentos
            .Include(vinculo => vinculo.Procedimento)
            .FirstOrDefaultAsync(vinculo => vinculo.PromocoesPromId == promId && vinculo.PromProcId == promProcId);

    public async Task InserirAsync(IEnumerable<PromocaoProcedimento> vinculos)
    {
        await context.PromocoesProcedimentos.AddRangeAsync(vinculos);
        await context.SaveChangesAsync();
    }

    public async Task AlterarAsync(PromocaoProcedimento vinculo)
    {
        await context.SaveChangesAsync();
    }

    public async Task ExcluirAsync(PromocaoProcedimento vinculo)
    {
        context.PromocoesProcedimentos.Remove(vinculo);
        await context.SaveChangesAsync();
    }
}
