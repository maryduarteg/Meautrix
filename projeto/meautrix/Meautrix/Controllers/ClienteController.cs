using Meautrix.DTO.Cliente;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly IClienteService _clienteService;

        public ClienteController(IClienteService clienteService)
        {
            _clienteService = clienteService;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var clientes = await _clienteService.BuscarTodosAsync();
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var cliente = await _clienteService.BuscarPorIdAsync(id);

            if (cliente == null)
                return NotFound(new { mensagem = "Cliente não encontrado." });

            return Ok(cliente);
        }

        [HttpGet("{cpf}")]
        public async Task<IActionResult> ObterPorCpf(string cpf)
        {
            var cliente = await _clienteService.BuscarPorCpfAsync(cpf);

            if (cliente == null)
                return NotFound(new { mensagem = "Cliente não encontrado." });

            return Ok(cliente);
        }


        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] ClienteCriarDTO dto)
        {
            try
            {
                await _clienteService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, new { mensagem = "Cliente criado com sucesso." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        

        [HttpPut("{id}")]
        public async Task<IActionResult> Alterar(int id, [FromBody] ClienteAlterarDTO dto)
        {
            try
            {
                await _clienteService.AlterarAsync(id, dto);
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
        public async Task<IActionResult> AlterarParcial(int id, [FromBody] ClienteAlterarParcialDTO dto)
        {
            try
            {
                await _clienteService.AlterarParcialAsync(id, dto);
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
                await _clienteService.InativarAsync(id);
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