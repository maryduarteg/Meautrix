using Meautrix.DTO.CategoriaProduto;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriaProdutoController : ControllerBase
    {
        private readonly ICategoriaProdutoService _categoriaProdutoService;

        public CategoriaProdutoController(ICategoriaProdutoService categoriaProdutoService)
        {
            _categoriaProdutoService = categoriaProdutoService;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var categoriasProdutos = await _categoriaProdutoService.BuscarTodosAsync();
            return Ok(categoriasProdutos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var categoriaProduto = await _categoriaProdutoService.BuscarPorIdAsync(id);

            if (categoriaProduto == null)
                return NotFound(new { mensagem = "Categoria de produto não encontrada." });

            return Ok(categoriaProduto);
        }

        [HttpGet("{descricao}")]
        public async Task<IActionResult> ObterPorDescricao(string descricao)
        {
            var categoriaProduto = await _categoriaProdutoService.BuscarPorDescricaoAsync(descricao);

            if (categoriaProduto == null)
                return NotFound(new { mensagem = "Categoria de produto não encontrada." });

            return Ok(categoriaProduto);
        }


        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] CategoriaProdutoCriarDTO dto)
        {
            try
            {
                await _categoriaProdutoService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, new { mensagem = "Categoria de produto criada com sucesso." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        

        [HttpPut("{id}")]
        public async Task<IActionResult> Alterar(int id, [FromBody] CategoriaProdutoAlterarDTO dto)
        {
            try
            {
                await _categoriaProdutoService.AlterarAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }

        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> AlterarParcial(int id, [FromBody] CategoriaProdutoAlterarParcialDTO dto)
        {
            try
            {
                await _categoriaProdutoService.AlterarParcialAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }

        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                await _categoriaProdutoService.InativarAsync(id);
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