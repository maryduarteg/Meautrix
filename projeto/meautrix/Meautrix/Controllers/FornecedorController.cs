using Meautrix.DTO.Fornecedor;
using Meautrix.Interfaces;
using Meautrix.Services;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FornecedorController : ControllerBase
    {
        private readonly IFornecedorService _fornecedorService;

        public FornecedorController(IFornecedorService fornecedorService)
        {
            _fornecedorService = fornecedorService;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var fornecedores = await _fornecedorService.BuscarTodosAsync();
            return Ok(fornecedores);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var fornecedor = await _fornecedorService.BuscarPorIdAsync(id);

            if (fornecedor == null)
                return NotFound(new { mensagem = "Fornecedor não encontrado." });

            return Ok(fornecedor);
        }

        [HttpGet("{cnpj}")]
        public async Task<IActionResult> ObterPorCpf(string cnpj)
        {
            var fornecedor = await _fornecedorService.BuscarPorCnpjAsync(cnpj);

            if (fornecedor == null)
                return NotFound(new { mensagem = "Fornecedor não encontrado." });

            return Ok(fornecedor);
        }

        [HttpGet("{razaoSocial}")]
        public async Task<IActionResult> ObterPorRazaoSocial(string razaoSocial)
        {
            var fornecedor = await _fornecedorService.BuscarPorRazaoSocialAsync(razaoSocial);

            if (fornecedor == null)
                return NotFound(new { mensagem = "Fornecedor não encontrado." });

            return Ok(fornecedor);
        }


        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] FornecedorCriarDTO dto)
        {
            try
            {
                await _fornecedorService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, new { mensagem = "Fornecedor criado com sucesso." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        

        [HttpPut("{id}")]
        public async Task<IActionResult> Alterar(int id, [FromBody] FornecedorAlterarDTO dto)
        {
            try
            {
                await _fornecedorService.AlterarAsync(id, dto);
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
        public async Task<IActionResult> AlterarParcial(int id, [FromBody] FornecedorAlterarParcialDTO dto)
        {
            try
            {
                await _fornecedorService.AlterarParcialAsync(id, dto);
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
                await _fornecedorService.InativarAsync(id);
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