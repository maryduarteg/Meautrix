using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IClienteRepository
    {
        Task<IEnumerable<Cliente>> BuscarTodosAtivosAsync();
        Task<Cliente?> BuscarPorIdAsync(int id);
        Task<Cliente?> BuscarPorCpfAsync(string cpf);
        Task InserirAsync(Cliente cliente);
        Task AlterarAsync(Cliente cliente);
    }
}