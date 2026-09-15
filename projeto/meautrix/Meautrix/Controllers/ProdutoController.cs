using Meautrix.DTO.Produto;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutoController : ControllerBase
    {
        private readonly IProdutoService _produtoService;

        public ProdutoController(IProdutoService produtoService)
        {
            _produtoService = produtoService;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var sProdutos = await _produtoService.BuscarTodosAsync();
            return Ok(sProdutos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var Produto = await _produtoService.BuscarPorIdAsync(id);

            if (Produto == null)
                return NotFound(new { mensagem = " de produto não encontrado." });

            return Ok(Produto);
        }

        [HttpGet("{descricao}")]
        public async Task<IActionResult> ObterPorDescricao(string descricao)
        {
            var Produto = await _produtoService.BuscarPorDescricaoAsync(descricao);

            if (Produto == null)
                return NotFound(new { mensagem = "Produto não encontrado." });

            return Ok(Produto);
        }

        [HttpGet("{quantidademinima}")]
        public async Task<IActionResult> ObterPorQuantidadeMinima(double quantidade)
        {
            var Produto = await _produtoService.BuscarPorQuantidadeMinimaAsync(quantidade);

            if (Produto == null)
                return NotFound(new { mensagem = "Produto não encontrado." });

            return Ok(Produto);
        }

        [HttpGet("{categoria}")]
        public async Task<IActionResult> ObterPorCategoria(int categoria)
        {
            var Produto = await _produtoService.BuscarPorCategoriaAsync(categoria);

            if (Produto == null)
                return NotFound(new { mensagem = "Produto não encontrado." });

            return Ok(Produto);
        }


        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] ProdutoCriarDTO dto)
        {
            try
            {
                await _produtoService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, new { mensagem = "Produto criado com sucesso." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        

        [HttpPut("{id}")]
        public async Task<IActionResult> Alterar(int id, [FromBody] ProdutoAlterarDTO dto)
        {
            try
            {
                await _produtoService.AlterarAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }

        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> AlterarParcial(int id, [FromBody] ProdutoAlterarParcialDTO dto)
        {
            try
            {
                await _produtoService.AlterarParcialAsync(id, dto);
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
                await _produtoService.InativarAsync(id);
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