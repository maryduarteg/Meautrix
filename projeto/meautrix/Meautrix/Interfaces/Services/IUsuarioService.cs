using Meautrix.DTO;
using Meautrix.DTOs;
using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IUsuarioService
    {
        Task<IEnumerable<Usuario>> BuscarTodosAsync();
        Task<Usuario?> BuscarPorIdAsync(int id);
        Task CriarAsync(UsuarioCriarDTO dto);
        Task AlterarAsync(int id, UsuarioAlterarDTO dto);
        Task AlterarParcialAsync(int id, UsuarioAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}