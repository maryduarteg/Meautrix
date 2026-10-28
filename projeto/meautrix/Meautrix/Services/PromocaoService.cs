using System.ComponentModel.DataAnnotations;
using Meautrix.DTO.Promocao;
using Meautrix.Entidades;
using Meautrix.Interfaces;

namespace Meautrix.Services;

public class PromocaoService(IPromocaoRepository repository) : IPromocaoService
{
    private static void Validar(object dto)
    {
        var erros = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true))
            throw new InvalidOperationException(string.Join(" ", erros.Select(e => e.ErrorMessage)));
    }

    private static PromocaoResponseDTO Mapear(Promocao p) => new()
    {
        PromId = p.PromId, PromTitulo = p.PromTitulo, PromMensagem = p.PromMensagem,
        PromDataMinima = p.PromDataMinima, PromDataMaxima = p.PromDataMaxima, CreatedAt = p.CreatedAt,
    };

    private static void Preencher(Promocao promocao, PromocaoSalvarDTO dto)
    {
        promocao.PromTitulo = dto.PromTitulo!.Trim();
        promocao.PromMensagem = dto.PromMensagem!.Trim();
        promocao.PromDataMinima = dto.PromDataMinima!.Value;
        promocao.PromDataMaxima = dto.PromDataMaxima!.Value;
    }

    public async Task<IEnumerable<PromocaoResponseDTO>> BuscarTodosAsync(PromocaoFiltroDTO filtro)
    {
        Validar(filtro);
        return (await repository.BuscarTodosAsync(filtro)).Select(Mapear);
    }

    public async Task<PromocaoResponseDTO> BuscarPorIdAsync(int id) => Mapear(
        await repository.BuscarPorIdAsync(id) ?? throw new KeyNotFoundException("Promoção não encontrada."));

    public async Task<PromocaoResponseDTO> CriarAsync(PromocaoSalvarDTO dto)
    {
        Validar(dto);
        var promocao = new Promocao();
        Preencher(promocao, dto);
        await repository.InserirAsync(promocao);
        return Mapear(promocao);
    }

    public async Task<PromocaoResponseDTO> AlterarAsync(int id, PromocaoSalvarDTO dto)
    {
        Validar(dto);
        var promocao = await repository.BuscarPorIdAsync(id) ?? throw new KeyNotFoundException("Promoção não encontrada.");
        Preencher(promocao, dto);
        await repository.AlterarAsync(promocao);
        return Mapear(promocao);
    }

    public async Task ExcluirAsync(int id)
    {
        var promocao = await repository.BuscarPorIdAsync(id) ?? throw new KeyNotFoundException("Promoção não encontrada.");
        await repository.ExcluirAsync(promocao);
    }
}
