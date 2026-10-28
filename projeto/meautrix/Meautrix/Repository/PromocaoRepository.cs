using Meautrix.DTO.Promocao;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository;

public class PromocaoRepository(MeautrixDbContext context) : IPromocaoRepository
{
    // Escape dos curingas: os filtros de texto buscam o conteúdo literal informado.
    private static string Contem(string valor) => "%" + valor.Trim()
        .Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%";

    public async Task<IEnumerable<Promocao>> BuscarTodosAsync(PromocaoFiltroDTO filtro)
    {
        // CURRENT_DATE é calculado pelo PostgreSQL, no fuso da sessão do banco.
        IQueryable<Promocao> query = filtro.ApenasAtivas
            ? context.Promocoes.FromSqlRaw("SELECT * FROM public.promocoes WHERE CURRENT_DATE BETWEEN prom_data_minima AND prom_data_maxima")
            : context.Promocoes;
        query = query.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filtro.Titulo))
            query = query.Where(p => EF.Functions.ILike(p.PromTitulo, Contem(filtro.Titulo), "\\"));
        if (!string.IsNullOrWhiteSpace(filtro.Mensagem))
            query = query.Where(p => EF.Functions.ILike(p.PromMensagem, Contem(filtro.Mensagem), "\\"));
        // Interseção inclusiva das vigências com o intervalo pesquisado.
        if (filtro.DataInicio.HasValue) query = query.Where(p => p.PromDataMaxima >= filtro.DataInicio.Value);
        if (filtro.DataFim.HasValue) query = query.Where(p => p.PromDataMinima <= filtro.DataFim.Value);
        return await query.OrderByDescending(p => p.PromDataMinima).ThenByDescending(p => p.PromId).ToListAsync();
    }

    public Task<Promocao?> BuscarPorIdAsync(int id) => context.Promocoes.FirstOrDefaultAsync(p => p.PromId == id);

    public async Task InserirAsync(Promocao promocao)
    {
        context.Promocoes.Add(promocao);
        await context.SaveChangesAsync();
    }

    public async Task AlterarAsync(Promocao promocao)
    {
        context.Promocoes.Update(promocao);
        await context.SaveChangesAsync();
    }

    public async Task ExcluirAsync(Promocao promocao)
    {
        context.Promocoes.Remove(promocao);
        await context.SaveChangesAsync();
    }
}
