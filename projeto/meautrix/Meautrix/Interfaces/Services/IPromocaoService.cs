using Meautrix.DTO.Promocao;

namespace Meautrix.Interfaces;

public interface IPromocaoService
{
    Task<IEnumerable<PromocaoResponseDTO>> BuscarTodosAsync(PromocaoFiltroDTO filtro);
    Task<PromocaoResponseDTO> BuscarPorIdAsync(int id);
    Task<PromocaoResponseDTO> CriarAsync(PromocaoSalvarDTO dto);
    Task<PromocaoResponseDTO> AlterarAsync(int id, PromocaoSalvarDTO dto);
    Task ExcluirAsync(int id);
}
