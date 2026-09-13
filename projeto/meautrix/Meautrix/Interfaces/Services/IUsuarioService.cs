using Meautrix.DTO.Usuario;

namespace Meautrix.Interfaces
{
    public interface IUsuarioService
    {
        Task<IEnumerable<UsuarioResponseDTO>> BuscarTodosAsync();
        Task<UsuarioResponseDTO?> BuscarPorIdAsync(int id);
        Task<UsuarioLoginDTO?> BuscarPorLoginAsync(string login);
        Task CriarAsync(UsuarioCriarDTO dto);
        Task AlterarAsync(int id, UsuarioAlterarDTO dto);
        Task AlterarParcialAsync(int id, UsuarioAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}