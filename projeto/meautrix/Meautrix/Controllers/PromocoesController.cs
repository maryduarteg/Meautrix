using Meautrix.DTO.Promocao;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers;

[ApiController]
[Authorize]
[Route("api/promocoes")]
[Route("promocoes")]
public class PromocoesController(
    IPromocaoService service,
    IPromocaoProcedimentoService? procedimentoService = null) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> BuscarTodos([FromQuery] PromocaoFiltroDTO filtro)
    {
        try { return Ok(await service.BuscarTodosAsync(filtro)); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        try { return Ok(await service.BuscarPorIdAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Criar(PromocaoSalvarDTO dto)
    {
        try
        {
            var promocao = await service.CriarAsync(dto);
            return Created($"/api/promocoes/{promocao.PromId}", promocao);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Alterar(int id, PromocaoSalvarDTO dto)
    {
        try { return Ok(await service.AlterarAsync(id, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        try { await service.ExcluirAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
    }

    [HttpGet("{promId:int}/procedimentos")]
    public async Task<IActionResult> BuscarProcedimentos(int promId)
    {
        try { return Ok(await ObterServicoProcedimentos().BuscarPorPromocaoAsync(promId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
    }

    [HttpPost("{promId:int}/procedimentos")]
    public async Task<IActionResult> AssociarProcedimentos(
        int promId,
        [FromBody] List<PromocaoProcedimentoSalvarDTO> procedimentos)
    {
        try { return StatusCode(StatusCodes.Status201Created, await ObterServicoProcedimentos().CriarAsync(promId, procedimentos)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { mensagem = ex.Message }); }
    }

    [HttpPut("{promId:int}/procedimentos/{promProcId:int}")]
    public async Task<IActionResult> AlterarProcedimento(
        int promId,
        int promProcId,
        [FromBody] PromocaoProcedimentoSalvarDTO dto)
    {
        try { return Ok(await ObterServicoProcedimentos().AlterarAsync(promId, promProcId, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { mensagem = ex.Message }); }
    }

    [HttpDelete("{promId:int}/procedimentos/{promProcId:int}")]
    public async Task<IActionResult> ExcluirProcedimento(int promId, int promProcId)
    {
        try { await ObterServicoProcedimentos().ExcluirAsync(promId, promProcId); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { mensagem = ex.Message }); }
    }

    private IPromocaoProcedimentoService ObterServicoProcedimentos() =>
        procedimentoService ?? throw new InvalidOperationException("O serviço de associação de procedimentos não está configurado.");
}
