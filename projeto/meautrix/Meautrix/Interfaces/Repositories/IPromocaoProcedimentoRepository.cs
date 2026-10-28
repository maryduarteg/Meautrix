using Meautrix.Entidades;

namespace Meautrix.Interfaces;

public interface IPromocaoProcedimentoRepository
{
    Task<IEnumerable<PromocaoProcedimento>> BuscarPorPromocaoAsync(int promId);
    Task<PromocaoProcedimento?> BuscarPorIdAsync(int promId, int promProcId);
    Task InserirAsync(IEnumerable<PromocaoProcedimento> vinculos);
    Task AlterarAsync(PromocaoProcedimento vinculo);
    Task ExcluirAsync(PromocaoProcedimento vinculo);
}
