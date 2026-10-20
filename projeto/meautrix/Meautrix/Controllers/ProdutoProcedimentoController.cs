using Meautrix.DTO.ProdutoProcedimento;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/procedimento-produto")]
    public class ProdutoProcedimentoController : ControllerBase
    {
        private readonly IProdutoProcedimentoService _vinculoService;

        public ProdutoProcedimentoController(IProdutoProcedimentoService vinculoService)
        {
            _vinculoService = vinculoService;
        }

        [HttpGet("procedimento/{procId:int}")]
        public async Task<IActionResult> BuscarPorProcedimento(int procId)
        {
            return Ok(await _vinculoService.BuscarPorProcedimentoAsync(procId));
        }

        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] ProdutoProcedimentoCriarDTO dto)
        {
            try
            {
                var vinculo = await _vinculoService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, vinculo);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPut("procedimento/{procId:int}/produto/{prodId:int}")]
        public async Task<IActionResult> Alterar(int procId, int prodId, [FromBody] ProdutoProcedimentoAlterarDTO dto)
        {
            try
            {
                await _vinculoService.AlterarAsync(procId, prodId, dto);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpDelete("procedimento/{procId:int}/produto/{prodId:int}")]
        public async Task<IActionResult> Excluir(int procId, int prodId)
        {
            try
            {
                await _vinculoService.ExcluirAsync(procId, prodId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
        }
    }
}
