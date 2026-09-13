using Meautrix.DTO.Medida;

namespace Meautrix.Interfaces
{
    public interface IMedidaService
    {
        Task<IEnumerable<MedidaResponseDTO>> BuscarTodosAsync();
        Task<MedidaResponseDTO?> BuscarPorIdAsync(int id);
        Task<MedidaResponseDTO?> BuscarPorSiglaAsync(string sigla);
        Task<MedidaResponseDTO?> BuscarPorDescricaoAsync(string descricao);
        Task CriarAsync(MedidaCriarDTO dto);
        Task AlterarAsync(int id, MedidaAlterarDTO dto);
        Task AlterarParcialAsync(int id, MedidaAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}