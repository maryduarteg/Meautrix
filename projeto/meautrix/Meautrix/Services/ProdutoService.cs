using Meautrix.DTO.Produto;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Repository;

namespace Meautrix.Services
{
    public class ProdutoService : IProdutoService
    {
        private readonly IProdutoRepository _produtoRepository; 

        public ProdutoService(IProdutoRepository produtoRepository)
        {
            _produtoRepository = produtoRepository;
        }

        // Mapeia entidade para DTO de resposta, garantindo o nome UsuEAdmin no JSON
        private static ProdutoResponseDTO MapToDTO(Produto p) => new()
        {
            ProdId               = p.ProdId,
            ProdDescricao        = p.ProdDescricao,
            ProdQuantidadeMinima = p.ProdQuantidadeMinima,
            ProdAtivo            = p.ProdAtivo,
            MedidasMedId       = p.MedidasMedId,
            CatProdId          = p.CatProdId,
            FornId             = p.FornId
            
        };


        public async Task<IEnumerable<ProdutoResponseDTO>> BuscarTodosAsync()
        {
            var lista = await _produtoRepository.BuscarTodosAtivosAsync();
            return lista.Select(MapToDTO);
        }

        public async Task<ProdutoResponseDTO?> BuscarPorIdAsync(int id)
        {
            var Produto = await _produtoRepository.BuscarPorIdAsync(id);
            if (Produto == null)
                return null;
            return MapToDTO(Produto);
        }

        public async Task<ProdutoResponseDTO?> BuscarPorDescricaoAsync(string descricao)
        {
            var Produto = await _produtoRepository.BuscarPorDescricaoAsync(descricao);
            if (Produto == null)
                return null;
            return MapToDTO(Produto);
        }

        public async Task<ProdutoResponseDTO?> BuscarPorCategoriaAsync(int categoria)
        {
            var Produto = await _produtoRepository.BuscarPorCategoriaAsync(categoria);
            if (Produto == null)
                return null;
            return MapToDTO(Produto);
        }

        public async Task<ProdutoResponseDTO?> BuscarPorQuantidadeMinimaAsync(double quantidadeMinina)
        {
            var Produto = await _produtoRepository.BuscarPorQuantidadeMinimaAsync(quantidadeMinina);
            if (Produto == null)
                return null;
            return MapToDTO(Produto);
        }

        public async Task CriarAsync(ProdutoCriarDTO dto)
        {
            var ativo = (dto.ProdAtivo  == "I") ? "I" : "A";

            var novoProduto = new Produto
            {
                ProdDescricao  = dto.ProdDescricao,
                ProdQuantidadeMinima = dto.ProdQuantidadeMinima,
                CatProdId = dto.CatProdId,
                MedidasMedId = dto.MedidasMedId,
                ProdAtivo = ativo
            };

            await _produtoRepository.InserirAsync(novoProduto);
        }

        public async Task AlterarAsync(int id, ProdutoAlterarDTO dto)
        {
            var Produto = await _produtoRepository.BuscarPorIdAsync(id);
            if (Produto == null)
                throw new KeyNotFoundException(" de produto não encontrada.");

            // Converte string → char; padrão: 'N'
            var novoAtivo = (dto.ProdAtivo == "I") ? 'I' : 'A';


            // Aplica as alterações
            Produto.ProdDescricao  = dto.ProdDescricao;
            Produto.ProdAtivo = dto.ProdAtivo;


            await _produtoRepository.AlterarAsync(Produto);
        }

        public async Task AlterarParcialAsync(int id, ProdutoAlterarParcialDTO dto)
        {
            var produtoExistente = await _produtoRepository.BuscarPorIdAsync(id);

            if (produtoExistente == null)
            {
                throw new KeyNotFoundException("Produto não encontrada ou inativa no sistema.");
            }

            if (!string.IsNullOrEmpty(dto.ProdDescricao)) produtoExistente.ProdDescricao = dto.ProdDescricao;
            if (dto.ProdQuantidadeMinima.HasValue) produtoExistente.ProdQuantidadeMinima = dto.ProdQuantidadeMinima.Value;
            if (dto.CatProdId.HasValue) produtoExistente.CatProdId = dto.CatProdId.Value;
            if (dto.MedidasMedId.HasValue) produtoExistente.MedidasMedId = dto.MedidasMedId.Value;
            if (!string.IsNullOrEmpty(dto.ProdDescricao)) produtoExistente.ProdDescricao = dto.ProdDescricao;
            if (!string.IsNullOrEmpty(dto.ProdAtivo)) produtoExistente.ProdAtivo = dto.ProdAtivo;
   

            await _produtoRepository.AlterarAsync(produtoExistente);
        }

        public async Task InativarAsync(int id)
        {
            var Produto = await _produtoRepository.BuscarPorIdAsync(id);

            if (Produto == null || Produto.ProdAtivo == "I")
            {
                throw new KeyNotFoundException("Produto não encontrado ou já inativado.");
            }

            Produto.ProdAtivo = "I";
            await _produtoRepository.AlterarAsync(Produto);
        }
    }
}