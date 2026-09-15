using Meautrix.DTO.CategoriaProduto;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Repository;

namespace Meautrix.Services
{
    public class CategoriaProdutoService : ICategoriaProdutoService
    {
        private readonly ICategoriaProdutoRepository _categoriaProdutoRepository; 

        public CategoriaProdutoService(ICategoriaProdutoRepository categoriaProdutoRepository)
        {
            _categoriaProdutoRepository = categoriaProdutoRepository;
        }

        // Mapeia entidade para DTO de resposta, garantindo o nome UsuEAdmin no JSON
        private static CategoriaProdutoResponseDTO MapToDTO(CategoriaProduto cp) => new()
        {
            CatProdId     = cp.CatProdId,
            CatProdDescricao   = cp.CatProdDescricao,
            CatProdAtivo  = cp.CatProdAtivo
        };


        public async Task<IEnumerable<CategoriaProdutoResponseDTO>> BuscarTodosAsync()
        {
            var lista = await _categoriaProdutoRepository.BuscarTodosAtivosAsync();
            return lista.Select(MapToDTO);
        }

        public async Task<CategoriaProdutoResponseDTO?> BuscarPorIdAsync(int id)
        {
            var categoriaProduto = await _categoriaProdutoRepository.BuscarPorIdAsync(id);
            if (categoriaProduto == null || categoriaProduto.CatProdAtivo == "I")
                return null;
            return MapToDTO(categoriaProduto);
        }

        public async Task<CategoriaProdutoResponseDTO?> BuscarPorDescricaoAsync(string descricao)
        {
            var categoriaProduto = await _categoriaProdutoRepository.BuscarPorDescricaoAsync(descricao);
            if (categoriaProduto == null)
                return null;
            return MapToDTO(categoriaProduto);
        }
        public async Task CriarAsync(CategoriaProdutoCriarDTO dto)
        {
            var ativo = (dto.CatProdAtivo  == "I") ? "I" : "A";

            var novaCategoriaProduto = new CategoriaProduto
            {
                CatProdDescricao  = dto.CatProdDescricao,
                CatProdAtivo = ativo
            };

            await _categoriaProdutoRepository.InserirAsync(novaCategoriaProduto);
        }

        public async Task AlterarAsync(int id, CategoriaProdutoAlterarDTO dto)
        {
            var categoriaProduto = await _categoriaProdutoRepository.BuscarPorIdAsync(id);
            if (categoriaProduto == null)
                throw new KeyNotFoundException("Categoria de produto não encontrada.");

            // Converte string → char; padrão: 'N'
            var novoAtivo = (dto.CatProdAtivo == "I") ? 'I' : 'A';


            // Aplica as alterações
            categoriaProduto.CatProdDescricao  = dto.CatProdDescricao;
            categoriaProduto.CatProdAtivo = dto.CatProdAtivo;


            await _categoriaProdutoRepository.AlterarAsync(categoriaProduto);
        }

        public async Task AlterarParcialAsync(int id, CategoriaProdutoAlterarParcialDTO dto)
        {
            var categoriaProdutoExistente = await _categoriaProdutoRepository.BuscarPorIdAsync(id);

            if (categoriaProdutoExistente == null || categoriaProdutoExistente.CatProdAtivo == "I")
            {
                throw new KeyNotFoundException("Categoria de produto não encontrada ou inativa no sistema.");
            }

            if (!string.IsNullOrEmpty(dto.CatProdDescricao)) categoriaProdutoExistente.CatProdDescricao = dto.CatProdDescricao;
            if (!string.IsNullOrEmpty(dto.CatProdAtivo)) categoriaProdutoExistente.CatProdAtivo = dto.CatProdAtivo;
   

            await _categoriaProdutoRepository.AlterarAsync(categoriaProdutoExistente);
        }

        public async Task InativarAsync(int id)
        {
            var categoriaProduto = await _categoriaProdutoRepository.BuscarPorIdAsync(id);

            if (categoriaProduto == null || categoriaProduto.CatProdAtivo == "I")
            {
                throw new KeyNotFoundException("Categoria de produto não encontrada ou já inativada.");
            }

            categoriaProduto.CatProdAtivo = "I";
            await _categoriaProdutoRepository.AlterarAsync(categoriaProduto);
        }
    }
}