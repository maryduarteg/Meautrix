using Meautrix.DTO.Procedimento;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProcedimentoController : ControllerBase
    {
        private readonly IProcedimentoService _procedimentoService;

        public ProcedimentoController(IProcedimentoService procedimentoService)
        {
            _procedimentoService = procedimentoService;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var procedimentos = await _procedimentoService.BuscarTodosAsync();
            return Ok(procedimentos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var procedimentos = await _procedimentoService.BuscarPorIdAsync(id);

            if (procedimentos == null)
                return NotFound(new { mensagem = "Procedimento não encontrada." });

            return Ok(procedimentos);
        }

        [HttpGet("{nome}")]
        public async Task<IActionResult> ObterPorNome(string nome)
        {
            var procedimento = await _procedimentoService.BuscarPorNomeAsync(nome);

            if (procedimento == null)
                return NotFound(new { mensagem = "Procedimento não encontrado." });

            return Ok(procedimento);
        }

        [HttpGet("{descricao}")]
        public async Task<IActionResult> ObterPorDescricao(string descricao)
        {
            var procedimento = await _procedimentoService.BuscarPorDescricaoAsync(descricao);

            if (procedimento == null)
                return NotFound(new { mensagem = "Procedimento não encontrado." });

            return Ok(procedimento);
        }

        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] ProcedimentoCriarDTO dto)
        {
            try
            {
                await _procedimentoService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, new { mensagem = "Procedimento criadao com sucesso." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        

        [HttpPut("{id}")]
        public async Task<IActionResult> Alterar(int id, [FromBody] ProcedimentoAlterarDTO dto)
        {
            try
            {
                var aviso = await _procedimentoService.AlterarAsync(id, dto);
                return Ok(new { mensagem = "Procedimento atualizado com sucesso.", aviso });
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
        public async Task<IActionResult> AlterarParcial(int id, [FromBody] ProcedimentoAlterarParcialDTO dto)
        {
            try
            {
                var aviso = await _procedimentoService.AlterarParcialAsync(id, dto);
                return Ok(new { mensagem = "Procedimento atualizado com sucesso.", aviso });
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
                await _procedimentoService.InativarAsync(id);
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
