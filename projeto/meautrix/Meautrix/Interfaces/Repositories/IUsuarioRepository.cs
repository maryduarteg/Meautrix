using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<IEnumerable<Usuario>> BuscarTodosAtivosAsync();
        Task<Usuario?> BuscarPorIdAsync(int id);
        Task<Usuario?> BuscarPorLoginAsync(string login);
        Task InserirAsync(Usuario usuario);
        Task AlterarAsync(Usuario usuario);
    }
}