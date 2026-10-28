using Meautrix.DTO.Usuario;
using Meautrix.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Meautrix.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuariosController(IUsuarioService usuarioService, IUsuarioRepository usuarioRepository)
        {
            _usuarioService = usuarioService;
            _usuarioRepository = usuarioRepository;
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var usuarios = await _usuarioService.BuscarTodosAsync();
            return Ok(usuarios);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> ObterUsuarioLogado()
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
                return Unauthorized();

            var usuario = await _usuarioRepository.BuscarPorIdAsync(id);
            if (usuario == null || usuario.UsuAtivo != 'A')
                return Unauthorized();

            return Ok(new { usuNome = usuario.UsuNome });
        }

        [HttpGet("{id:int}")]
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

            var usuario = await _usuarioRepository.BuscarPorLoginAsync(dto.UsuLogin);
            if (usuario == null || usuario.UsuAtivo != 'A' || !string.Equals(dto.UsuSenha, usuario.UsuSenha, StringComparison.Ordinal))
                return Unauthorized(new { mensagem = "Login ou senha inválidos." });

            var identidade = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.UsuId.ToString()),
                new Claim(ClaimTypes.Name, usuario.UsuLogin)
            }, CookieAuthenticationDefaults.AuthenticationScheme);
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identidade));

            return Ok(new { mensagem = "Login realizado com sucesso." });
        }

        [HttpPost("/logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return NoContent();
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
