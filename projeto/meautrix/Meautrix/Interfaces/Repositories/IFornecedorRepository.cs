using Meautrix.Entidades;

namespace Meautrix.Interfaces
{
    public interface IFornecedorRepository
    {
        Task<IEnumerable<Fornecedor>> BuscarTodosAtivosAsync();
        Task<Fornecedor?> BuscarPorIdAsync(int id);
        Task<Fornecedor?> BuscarPorCnpjAsync(string cnpj);
        Task<Fornecedor?> BuscarPorRazaoSocialAsync(string razaoSocial);
        Task InserirAsync(Fornecedor fornecedor);
        Task AlterarAsync(Fornecedor fornecedor);
    }
}