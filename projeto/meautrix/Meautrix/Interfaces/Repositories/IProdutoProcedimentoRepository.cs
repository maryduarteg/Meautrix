using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IProdutoProcedimentoRepository
    {
        Task<IEnumerable<ProdutoProcedimento>> BuscarPorProcedimentoAsync(int procId);
        Task<ProdutoProcedimento?> BuscarAsync(int procId, int prodId);
        Task InserirAsync(ProdutoProcedimento produtoProcedimento);
        Task AlterarAsync(ProdutoProcedimento produtoProcedimento);
        Task ExcluirAsync(ProdutoProcedimento produtoProcedimento);
    }
}
