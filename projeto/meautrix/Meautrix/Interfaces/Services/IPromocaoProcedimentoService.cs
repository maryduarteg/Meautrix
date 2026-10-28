using Meautrix.DTO.Promocao;

namespace Meautrix.Interfaces;

public interface IPromocaoProcedimentoService
{
    Task<IEnumerable<PromocaoProcedimentoResponseDTO>> BuscarPorPromocaoAsync(int promId);
    Task<IEnumerable<PromocaoProcedimentoResponseDTO>> CriarAsync(int promId, IEnumerable<PromocaoProcedimentoSalvarDTO> procedimentos);
    Task<PromocaoProcedimentoResponseDTO> AlterarAsync(int promId, int promProcId, PromocaoProcedimentoSalvarDTO dto);
    Task ExcluirAsync(int promId, int promProcId);
}
