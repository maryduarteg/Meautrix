using Meautrix.DTO.Fornecedor;

namespace Meautrix.Interfaces
{
    public interface IFornecedorService
    {
        Task<IEnumerable<FornecedorResponseDTO>> BuscarTodosAsync();
        Task<FornecedorResponseDTO?> BuscarPorIdAsync(int id);
        Task<FornecedorResponseDTO?> BuscarPorCnpjAsync(string cnpj);
        Task<FornecedorResponseDTO?> BuscarPorRazaoSocialAsync(string razaoSocial);
        Task CriarAsync(FornecedorCriarDTO dto);
        Task AlterarAsync(int id, FornecedorAlterarDTO dto);
        Task AlterarParcialAsync(int id, FornecedorAlterarParcialDTO dto);
        Task InativarAsync(int id);
    }
}