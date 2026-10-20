using Meautrix.DTO.ProdutoProcedimento;

namespace Meautrix.Interfaces
{
    public interface IProdutoProcedimentoService
    {
        Task<IEnumerable<ProdutoProcedimentoResponseDTO>> BuscarPorProcedimentoAsync(int procId);
        Task<ProdutoProcedimentoResponseDTO> CriarAsync(ProdutoProcedimentoCriarDTO dto);
        Task AlterarAsync(int procId, int prodId, ProdutoProcedimentoAlterarDTO dto);
        Task ExcluirAsync(int procId, int prodId);
    }
}
