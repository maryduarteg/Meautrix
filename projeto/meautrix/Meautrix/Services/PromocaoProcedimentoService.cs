using Meautrix.DTO.Promocao;
using Meautrix.Entidades;
using Meautrix.Interfaces;

namespace Meautrix.Services;

public class PromocaoProcedimentoService(
    IPromocaoProcedimentoRepository vinculoRepository,
    IPromocaoRepository promocaoRepository,
    IProcedimentoRepository procedimentoRepository,
    TimeProvider timeProvider) : IPromocaoProcedimentoService
{
    private static readonly TimeZoneInfo FusoHorarioBrasil = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    public async Task<IEnumerable<PromocaoProcedimentoResponseDTO>> BuscarPorPromocaoAsync(int promId)
    {
        await ObterPromocaoAsync(promId);
        var vinculos = await vinculoRepository.BuscarPorPromocaoAsync(promId);
        return vinculos.Select(vinculo => Mapear(vinculo));
    }

    public async Task<IEnumerable<PromocaoProcedimentoResponseDTO>> CriarAsync(
        int promId,
        IEnumerable<PromocaoProcedimentoSalvarDTO> procedimentos)
    {
        var itens = procedimentos.ToList();
        if (itens.Count == 0)
            throw new InvalidOperationException("Informe ao menos um procedimento para associar.");

        var promocao = await ObterPromocaoAlteravelAsync(promId);
        if (itens.GroupBy(item => item.ProcedimentosProcId).Any(grupo => grupo.Count() > 1))
            throw new InvalidOperationException("Um procedimento só pode ser informado uma vez na mesma promoção.");

        ValidarDescontos(itens);
        var existentes = await vinculoRepository.BuscarPorPromocaoAsync(promocao.PromId);
        var idsExistentes = existentes.Select(vinculo => vinculo.ProcedimentosProcId).ToHashSet();
        if (itens.Any(item => idsExistentes.Contains(item.ProcedimentosProcId)))
            throw new InvalidOperationException("Um ou mais procedimentos já estão associados a esta promoção.");

        var novos = new List<(PromocaoProcedimento Vinculo, Procedimento Procedimento)>();
        foreach (var item in itens)
        {
            var procedimento = await procedimentoRepository.BuscarPorIdAsync(item.ProcedimentosProcId)
                ?? throw new KeyNotFoundException("Procedimento não encontrado.");

            if (!EstaAtivo(procedimento))
                throw new InvalidOperationException("Somente procedimentos ativos podem ser associados à promoção.");
            if (!procedimento.ProcValor.HasValue)
                throw new InvalidOperationException($"Informe o valor do procedimento '{procedimento.ProcNome}' antes de associá-lo a uma promoção.");
            ValidarDesconto(item.PromProcDesconto, procedimento.ProcValor.Value);

            novos.Add((new PromocaoProcedimento
            {
                PromocoesPromId = promocao.PromId,
                ProcedimentosProcId = procedimento.ProcId,
                PromProcDesconto = item.PromProcDesconto,
            }, procedimento));
        }

        await vinculoRepository.InserirAsync(novos.Select(item => item.Vinculo));
        return novos.Select(item => Mapear(item.Vinculo, item.Procedimento));
    }

    public async Task<PromocaoProcedimentoResponseDTO> AlterarAsync(
        int promId,
        int promProcId,
        PromocaoProcedimentoSalvarDTO dto)
    {
        await ObterPromocaoAlteravelAsync(promId);

        var vinculo = await vinculoRepository.BuscarPorIdAsync(promId, promProcId)
            ?? throw new KeyNotFoundException("Associação de procedimento não encontrada.");
        var valorProcedimento = vinculo.Procedimento?.ProcValor;
        if (!valorProcedimento.HasValue)
            throw new InvalidOperationException("O procedimento associado não possui valor cadastrado.");
        ValidarDesconto(dto.PromProcDesconto, valorProcedimento.Value);
        vinculo.PromProcDesconto = dto.PromProcDesconto;
        await vinculoRepository.AlterarAsync(vinculo);

        return Mapear(vinculo);
    }

    public async Task ExcluirAsync(int promId, int promProcId)
    {
        await ObterPromocaoAlteravelAsync(promId);
        var vinculo = await vinculoRepository.BuscarPorIdAsync(promId, promProcId)
            ?? throw new KeyNotFoundException("Associação de procedimento não encontrada.");
        await vinculoRepository.ExcluirAsync(vinculo);
    }

    private async Task<Promocao> ObterPromocaoAsync(int promId) =>
        await promocaoRepository.BuscarPorIdAsync(promId)
            ?? throw new KeyNotFoundException("Promoção não encontrada.");

    private async Task<Promocao> ObterPromocaoAlteravelAsync(int promId)
    {
        var promocao = await ObterPromocaoAsync(promId);
        var hoje = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), FusoHorarioBrasil).DateTime);
        if (promocao.PromDataMaxima < hoje)
            throw new InvalidOperationException("Não é possível alterar os procedimentos de uma promoção expirada.");
        return promocao;
    }

    private static bool EstaAtivo(Procedimento procedimento) =>
        string.Equals(procedimento.ProcAtivo, "A", StringComparison.OrdinalIgnoreCase);

    private static void ValidarDescontos(IEnumerable<PromocaoProcedimentoSalvarDTO> itens)
    {
        foreach (var item in itens) ValidarDesconto(item.PromProcDesconto);
    }

    private static void ValidarDesconto(decimal desconto, decimal? valorProcedimento = null)
    {
        if (desconto < 0 || desconto > 99999999.99m || decimal.Round(desconto, 2) != desconto)
            throw new InvalidOperationException("Informe um desconto em reais entre R$ 0,00 e R$ 99.999.999,99, com até duas casas decimais.");
        if (valorProcedimento.HasValue && desconto > valorProcedimento.Value)
            throw new InvalidOperationException("O desconto não pode ser maior que o valor do procedimento.");
    }

    private static PromocaoProcedimentoResponseDTO Mapear(PromocaoProcedimento vinculo, Procedimento? procedimento = null)
    {
        var dadosProcedimento = procedimento ?? vinculo.Procedimento
            ?? throw new InvalidOperationException("Não foi possível carregar o procedimento associado.");
        return new PromocaoProcedimentoResponseDTO
        {
            PromProcId = vinculo.PromProcId,
            ProcedimentosProcId = vinculo.ProcedimentosProcId,
            ProcNome = dadosProcedimento.ProcNome,
            ProcValor = dadosProcedimento.ProcValor ?? 0,
            PromProcDesconto = vinculo.PromProcDesconto,
        };
    }
}
