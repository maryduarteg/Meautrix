using System.Security.Claims;
using Meautrix.DTO.Agendamento;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers;

[ApiController]
[Authorize]
[Route("api/agendamentos")]
public class AgendamentosController(IAgendamentoService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> BuscarTodos() => Ok(await service.BuscarTodosAsync());

    [HttpGet("cancelamentos")]
    public async Task<IActionResult> BuscarParaCancelamento() => Ok(await service.BuscarParaCancelamentoAsync());

    [HttpPatch("{id:int}/cancelamento")]
    public async Task<IActionResult> AlterarCancelamento(int id, AgendamentoCancelamentoDTO dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId))
            return Unauthorized(new { mensagem = "Entre novamente para alterar o cancelamento." });
        try { return Ok(await service.AlterarCancelamentoAsync(id, dto.Cancelado, usuarioId)); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { mensagem = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        try { return Ok(await service.BuscarPorIdAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Criar(AgendamentoSalvarDTO dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId))
            return Unauthorized(new { mensagem = "Entre novamente para realizar o agendamento." });

        try
        {
            var agendamento = await service.CriarAsync(dto, usuarioId);
            return CreatedAtAction(nameof(BuscarPorId), new { id = agendamento.Id }, agendamento);
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { mensagem = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensagem = ex.Message, campo = ex.Data["campo"] as string }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Alterar(int id, AgendamentoSalvarDTO dto)
    {
        try { return Ok(await service.AlterarAsync(id, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(new { mensagem = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { mensagem = ex.Message, campo = ex.Data["campo"] as string }); }
    }
}
