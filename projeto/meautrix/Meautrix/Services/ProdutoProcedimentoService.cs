using Meautrix.DTO.ProdutoProcedimento;
using Meautrix.Entidades;
using Meautrix.Interfaces;

namespace Meautrix.Services
{
    public class ProdutoProcedimentoService : IProdutoProcedimentoService
    {
        private readonly IProdutoProcedimentoRepository _vinculoRepository;
        private readonly IProdutoRepository _produtoRepository;
        private readonly IProcedimentoRepository _procedimentoRepository;

        public ProdutoProcedimentoService(
            IProdutoProcedimentoRepository vinculoRepository,
            IProdutoRepository produtoRepository,
            IProcedimentoRepository procedimentoRepository)
        {
            _vinculoRepository = vinculoRepository;
            _produtoRepository = produtoRepository;
            _procedimentoRepository = procedimentoRepository;
        }

        public async Task<IEnumerable<ProdutoProcedimentoResponseDTO>> BuscarPorProcedimentoAsync(int procId)
        {
            var vinculos = await _vinculoRepository.BuscarPorProcedimentoAsync(procId);
            var produtos = await _produtoRepository.BuscarTodosAtivosAsync();
            var produtosPorId = produtos.ToDictionary(produto => produto.ProdId);

            return vinculos
                .Where(vinculo => produtosPorId.ContainsKey(vinculo.ProdId))
                .Select(vinculo => Mapear(vinculo, produtosPorId[vinculo.ProdId]));
        }

        public async Task<ProdutoProcedimentoResponseDTO> CriarAsync(ProdutoProcedimentoCriarDTO dto)
        {
            if (dto.QuantidadeSaida <= 0)
                throw new InvalidOperationException("A quantidade utilizada deve ser maior que zero.");

            var procedimento = await _procedimentoRepository.BuscarPorIdAsync(dto.ProcId);
            if (procedimento == null || procedimento.ProcAtivo == "I")
                throw new KeyNotFoundException("Procedimento não encontrado ou inativo.");

            var produto = await _produtoRepository.BuscarPorIdAsync(dto.ProdId);
            if (produto == null || produto.ProdAtivo == "I")
                throw new KeyNotFoundException("Produto não encontrado ou inativo.");

            var existente = await _vinculoRepository.BuscarAsync(dto.ProcId, dto.ProdId);
            if (existente != null)
                throw new InvalidOperationException("Este produto já está associado ao procedimento.");

            var vinculo = new ProdutoProcedimento
            {
                ProcId = dto.ProcId,
                ProdId = dto.ProdId,
                QuantidadeSaida = dto.QuantidadeSaida
            };

            await _vinculoRepository.InserirAsync(vinculo);
            return Mapear(vinculo, produto);
        }

        public async Task AlterarAsync(int procId, int prodId, ProdutoProcedimentoAlterarDTO dto)
        {
            if (dto.QuantidadeSaida <= 0)
                throw new InvalidOperationException("A quantidade utilizada deve ser maior que zero.");

            var vinculo = await _vinculoRepository.BuscarAsync(procId, prodId);
            if (vinculo == null)
                throw new KeyNotFoundException("Vínculo de produto não encontrado.");

            vinculo.QuantidadeSaida = dto.QuantidadeSaida;
            await _vinculoRepository.AlterarAsync(vinculo);
        }

        public async Task ExcluirAsync(int procId, int prodId)
        {
            var vinculo = await _vinculoRepository.BuscarAsync(procId, prodId);
            if (vinculo == null)
                throw new KeyNotFoundException("Vínculo de produto não encontrado.");

            await _vinculoRepository.ExcluirAsync(vinculo);
        }

        private static ProdutoProcedimentoResponseDTO Mapear(ProdutoProcedimento vinculo, Produto produto) => new()
        {
            ProdId = vinculo.ProdId,
            ProdDescricao = produto.ProdDescricao,
            ProcId = vinculo.ProcId,
            QuantidadeSaida = vinculo.QuantidadeSaida,
            MedidasMedId = produto.MedidasMedId
        };
    }
}
