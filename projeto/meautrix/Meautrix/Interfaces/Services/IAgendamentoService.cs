using Meautrix.DTO.Agendamento;

namespace Meautrix.Interfaces;

public interface IAgendamentoService
{
    Task<IEnumerable<AgendamentoResponseDTO>> BuscarTodosAsync();
    Task<AgendamentoResponseDTO> BuscarPorIdAsync(int id);
    Task<IEnumerable<AgendamentoResponseDTO>> BuscarParaCancelamentoAsync();
    Task<AgendamentoResponseDTO> AlterarCancelamentoAsync(int id, string cancelado, int usuarioId);
    Task<AgendamentoResponseDTO> CriarAsync(AgendamentoSalvarDTO dto, int usuarioId);
    Task<AgendamentoResponseDTO> AlterarAsync(int id, AgendamentoSalvarDTO dto);
}
