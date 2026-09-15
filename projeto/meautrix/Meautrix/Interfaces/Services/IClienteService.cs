using Meautrix.DTO.CategoriaProduto;
using Meautrix.DTO.Cliente;

namespace Meautrix.Interfaces
{
    public interface IClienteService
    {
        Task<IEnumerable<ClienteResponseDTO>> BuscarTodosAsync();
        Task<ClienteResponseDTO?> BuscarPorIdAsync(int id);
        Task<ClienteResponseDTO?> BuscarPorCpfAsync(string cpf);
        Task CriarAsync(ClienteCriarDTO dto);
        Task AlterarAsync(int id, ClienteAlterarDTO dto);
        Task AlterarParcialAsync(int id, ClienteAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}