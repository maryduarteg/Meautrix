using Meautrix.DTO.Fornecedor;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Repository;

namespace Meautrix.Services
{
    public class FornecedorService : IFornecedorService
    {
        private readonly IFornecedorRepository _fornecedorRepository;
        public FornecedorService(IFornecedorRepository fornecedorRepository)
        {
            _fornecedorRepository = fornecedorRepository;
        }

        // Mapeia entidade para DTO de resposta, garantindo o nome UsuEAdmin no JSON
        private static FornecedorResponseDTO MapToDTO(Fornecedor f) => new()
        {
            FornId    = f.FornId,
            FornRazaoSocial   = f.FornRazaoSocial,
            FornCnpj  = f.FornCnpj,
            FornAtivo = f.FornAtivo
        };


        public async Task<IEnumerable<FornecedorResponseDTO>> BuscarTodosAsync()
        {
            var lista = await _fornecedorRepository.BuscarTodosAtivosAsync();
            return lista.Select(MapToDTO);
        }

        public async Task<FornecedorResponseDTO?> BuscarPorIdAsync(int id)
        {
            var fornecedor = await _fornecedorRepository.BuscarPorIdAsync(id);
            if (fornecedor == null)
                return null;
            return MapToDTO(fornecedor);
        }
        public async Task<FornecedorResponseDTO?> BuscarPorCnpjAsync(string cnpj)
        {
            var fornecedor = await _fornecedorRepository.BuscarPorCnpjAsync(cnpj);
            if (fornecedor == null)
                return null;
            return MapToDTO(fornecedor);
        }
        public async Task<FornecedorResponseDTO?> BuscarPorRazaoSocialAsync(string razaoSocial)
        {
            var fornecedor = await _fornecedorRepository.BuscarPorRazaoSocialAsync(razaoSocial);
            if (fornecedor == null)
                return null;
            return MapToDTO(fornecedor);
        }
        public async Task CriarAsync(FornecedorCriarDTO dto)
        {
            var fornecedorExistente = await _fornecedorRepository.BuscarPorCnpjAsync(dto.FornCnpj);
            if (fornecedorExistente != null)
            {
                throw new InvalidOperationException("Já existe um fornecedor cadastrado com este cnpj.");
            }

            var ativo = (dto.FornAtivo  == "I") ? "I" : "A";

            var novoFornecedor = new Fornecedor
            {
            
                FornCnpj = dto.FornCnpj,
                FornRazaoSocial  = dto.FornRazaoSocial,
                FornAtivo= ativo
            };

            await _fornecedorRepository.InserirAsync(novoFornecedor);
        }

        public async Task AlterarAsync(int id, FornecedorAlterarDTO dto)
        {
            var fornecedor = await _fornecedorRepository.BuscarPorIdAsync(id);
            if (fornecedor == null)
                throw new KeyNotFoundException("Fornecedor não encontrado.");

            // Converte string → char; padrão: 'N'
            var novoAtivo = (dto.FornAtivo  == "I") ? 'I' : 'A';


            // Aplica as alterações
            fornecedor.FornRazaoSocial  = dto.FornRazaoSocial;
            fornecedor.FornCnpj  = dto.FornCnpj;
            fornecedor.FornAtivo = dto.FornAtivo;


            await _fornecedorRepository.AlterarAsync(fornecedor);
        }

        public async Task AlterarParcialAsync(int id, FornecedorAlterarParcialDTO dto)
        {
            var fornecedorExistente = await _fornecedorRepository.BuscarPorIdAsync(id);

            if (fornecedorExistente == null)
            {
                throw new KeyNotFoundException("Fornecedor não encontrado ou inativo no sistema.");
            }

            if (!string.IsNullOrEmpty(dto.FornCnpj)) fornecedorExistente.FornCnpj = dto.FornCnpj;
            if (!string.IsNullOrEmpty(dto.FornRazaoSocial)) fornecedorExistente.FornRazaoSocial = dto.FornRazaoSocial;
            if (!string.IsNullOrEmpty(dto.FornAtivo)) fornecedorExistente.FornAtivo = dto.FornAtivo;
   

            await _fornecedorRepository.AlterarAsync(fornecedorExistente);
        }

        public async Task InativarAsync(int id)
        {
            var fornecedor = await _fornecedorRepository.BuscarPorIdAsync(id);

            if (fornecedor == null)
            {
                throw new KeyNotFoundException("Fornecedor não encontrado ou já inativado.");
            }

            fornecedor.FornAtivo = "I";
            await _fornecedorRepository.AlterarAsync(fornecedor);
        }
    }
}