using Meautrix.DTO.Procedimento;

namespace Meautrix.Interfaces
{
    public interface IProcedimentoService
    {
        Task<IEnumerable<ProcedimentoResponseDTO>> BuscarTodosAsync();
        Task<ProcedimentoResponseDTO?> BuscarPorIdAsync(int id);
        Task<ProcedimentoResponseDTO?> BuscarPorNomeAsync(string nome);
        Task<ProcedimentoResponseDTO?> BuscarPorDescricaoAsync(string descricao);
        Task CriarAsync(ProcedimentoCriarDTO dto);
        Task<string?> AlterarAsync(int id, ProcedimentoAlterarDTO dto);
        Task<string?> AlterarParcialAsync(int id, ProcedimentoAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}
