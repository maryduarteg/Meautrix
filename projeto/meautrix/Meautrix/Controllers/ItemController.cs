using Meautrix.DTO.Item;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemController : ControllerBase
    {
        private readonly IItemService _itemService;

        public ItemController(IItemService itemService)
        {
            _itemService = itemService;
        }

        // POST /api/item
        [HttpPost]
        public async Task<ActionResult<ItemResponseDTO>> Criar([FromBody] ItemCriarDTO dados)
        {
            try
            {
                var criado = await _itemService.CriarAsync(dados);
                return CreatedAtAction(nameof(BuscarPorId), new { id = criado.IteId }, criado);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { mensagem = ex.Message });
            }
        }

        // GET /api/item
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemResponseDTO>>> BuscarTodos()
        {
            var itens = await _itemService.BuscarTodosAsync();
            return Ok(itens);
        }

        // GET /api/item/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ItemResponseDTO>> BuscarPorId(int id)
        {
            var item = await _itemService.BuscarPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensagem = "Item não encontrado." });

            return Ok(item);
        }

        // GET /api/item/buscar-nome?nome=...
        [HttpGet("buscar-nome")]
        public async Task<ActionResult<IEnumerable<ItemResponseDTO>>> BuscarPorNome([FromQuery] string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                return BadRequest(new { mensagem = "Informe o nome para a busca." });

            var itens = await _itemService.BuscarPorNomeAsync(nome);
            return Ok(itens);
        }

        // GET /api/item/buscar-produto/{prodId}
        [HttpGet("buscar-produto/{prodId}")]
        public async Task<ActionResult<IEnumerable<ItemResponseDTO>>> BuscarPorProdId(int prodId)
        {
            var itens = await _itemService.BuscarPorProdIdAsync(prodId);
            return Ok(itens);
        }

        // GET /api/item/buscar-quantidade-menor?quantidade=...
        [HttpGet("buscar-quantidade-menor")]
        public async Task<ActionResult<IEnumerable<ItemResponseDTO>>> BuscarPorQuantidadeAtualMenorQue([FromQuery] float quantidade)
        {
            var itens = await _itemService.BuscarPorQuantidadeAtualMenorQueAsync(quantidade);
            return Ok(itens);
        }

        // PUT /api/item/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<ItemResponseDTO>> Alterar(int id, [FromBody] ItemAlterarDTO dados)
        {
            try
            {
                var alterado = await _itemService.AlterarAsync(id, dados);
                return Ok(alterado);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        // PATCH /api/item/{id}
        // Usado tanto para inativar/reativar (envie { "iteAtivo": "I" } ou { "iteAtivo": "A" })
        // quanto para alteração parcial de qualquer outro campo.
        [HttpPatch("{id}")]
        public async Task<ActionResult<ItemResponseDTO>> AlterarParcial(int id, [FromBody] ItemAlterarParcialDTO dados)
        {
            try
            {
                var alterado = await _itemService.AlterarParcialAsync(id, dados);
                return Ok(alterado);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
        }

        // PATCH /api/item/{id}/inativar
        [HttpPatch("{id}/inativar")]
        public async Task<IActionResult> Inativar(int id)
        {
            var sucesso = await _itemService.InativarAsync(id);
            if (!sucesso)
                return NotFound(new { mensagem = "Item não encontrado." });

            return NoContent();
        }

        // PATCH /api/item/{id}/reativar
        [HttpPatch("{id}/reativar")]
        public async Task<IActionResult> Reativar(int id)
        {
            var sucesso = await _itemService.ReativarAsync(id);
            if (!sucesso)
                return NotFound(new { mensagem = "Item não encontrado." });

            return NoContent();
        }
    }
}