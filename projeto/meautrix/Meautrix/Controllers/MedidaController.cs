using Meautrix.DTO.Cliente;
using Meautrix.DTO.Medida;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedidaController : ControllerBase
    {
        private readonly IMedidaService _medidaService;

        public MedidaController(IMedidaService medidaService)
        {
            _medidaService = medidaService;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var medidas = await _medidaService.BuscarTodosAsync();
            return Ok(medidas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var medida = await _medidaService.BuscarPorIdAsync(id);

            if (medida == null)
                return NotFound(new { mensagem = "Medida não encontrada." });

            return Ok(medida);
        }

        [HttpGet("{sigla}")]
        public async Task<IActionResult> ObterPorSigla(string sigla)
        {
            var medida = await _medidaService.BuscarPorSiglaAsync(sigla);

            if (medida == null)
                return NotFound(new { mensagem = "Medida não encontrada." });

            return Ok(medida);
        }

        [HttpGet("{descricao}")]
        public async Task<IActionResult> ObterPorDescricao(string descricao)
        {
            var medida = await _medidaService.BuscarPorDescricaoAsync(descricao);

            if (medida == null)
                return NotFound(new { mensagem = "Medida não encontrada." });

            return Ok(medida);
        }

        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] MedidaCriarDTO dto)
        {
            try
            {
                await _medidaService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, new { mensagem = "Medida criada com sucesso." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        

        [HttpPut("{id}")]
        public async Task<IActionResult> Alterar(int id, [FromBody] MedidaAlterarDTO dto)
        {
            try
            {
                await _medidaService.AlterarAsync(id, dto);
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

        [HttpPatch("{id}")]
        public async Task<IActionResult> AlterarParcial(int id, [FromBody] MedidaAlterarParcialDTO dto)
        {
            try
            {
                await _medidaService.AlterarParcialAsync(id, dto);
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                await _medidaService.InativarAsync(id);
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
    }
}