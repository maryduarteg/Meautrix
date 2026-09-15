using Meautrix.DTO.Usuario;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuariosController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var usuarios = await _usuarioService.BuscarTodosAsync();
            return Ok(usuarios);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var usuario = await _usuarioService.BuscarPorIdAsync(id);

            if (usuario == null)
                return NotFound(new { mensagem = "Usuário não encontrado." });

            return Ok(usuario);
        }

        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] UsuarioCriarDTO dto)
        {
            try
            {
                await _usuarioService.CriarAsync(dto);
                return StatusCode(StatusCodes.Status201Created, new { mensagem = "Usuário criado com sucesso." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPost]
        [Route("/login")]
        public async Task<IActionResult> Login([FromBody] UsuarioLoginDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UsuLogin) || string.IsNullOrWhiteSpace(dto.UsuSenha))
                return BadRequest(new { mensagem = "Informe o login e a senha." });

            var usuario = await _usuarioService.BuscarPorLoginAsync(dto.UsuLogin);
            if (usuario == null || !string.Equals(dto.UsuSenha, usuario.UsuSenha, StringComparison.Ordinal))
                return Unauthorized(new { mensagem = "Login ou senha inválidos." });

            return Ok(new { mensagem = "Login realizado com sucesso." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Alterar(int id, [FromBody] UsuarioAlterarDTO dto)
        {
            try
            {
                await _usuarioService.AlterarAsync(id, dto);
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
        public async Task<IActionResult> AlterarParcial(int id, [FromBody] UsuarioAlterarParcialDTO dto)
        {
            try
            {
                await _usuarioService.AlterarParcialAsync(id, dto);
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
                await _usuarioService.InativarAsync(id);
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
