using Meautrix.DTO;
using Meautrix.DTOs;
using Meautrix.Entidades;
using Meautrix.Interfaces;

namespace Meautrix.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioService(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<IEnumerable<Usuario>> BuscarTodosAsync()
        {
            return await _usuarioRepository.BuscarTodosAtivosAsync();
        }

        public async Task<Usuario?> BuscarPorIdAsync(int id)
        {
            var usuario = await _usuarioRepository.BuscarPorIdAsync(id);

            if (usuario == null || usuario.UsuAtivo == 'I')
                return null;

            return usuario;
        }

        public async Task CriarAsync(UsuarioCriarDTO dto)
        {
            var usuarioExistente = await _usuarioRepository.BuscarPorLoginAsync(dto.UsuLogin);
            if (usuarioExistente != null)
            {
                throw new InvalidOperationException("Já existe um usuário cadastrado com este login.");
            }

            var novoUsuario = new Usuario
            {
                UsuNome = dto.UsuNome,
                UsuLogin = dto.UsuLogin,
                UsuSenha = dto.UsuSenha,
                UsuEAdm = dto.UsuEAdm,
                UsuAtivo = 'A'
            };

            await _usuarioRepository.InserirAsync(novoUsuario);
        }

        public async Task AlterarAsync(int id, UsuarioAlterarDTO dto)
        {
            var usuarioExistente = await _usuarioRepository.BuscarPorIdAsync(id);

            if (usuarioExistente == null || usuarioExistente.UsuAtivo == 'I')
            {
                throw new KeyNotFoundException("Usuário não encontrado ou inativo no sistema.");
            }

            usuarioExistente.UsuNome = dto.UsuNome;
            usuarioExistente.UsuLogin = dto.UsuLogin;
            usuarioExistente.UsuSenha = dto.UsuSenha;
            usuarioExistente.UsuEAdm = dto.UsuEAdm;

            await _usuarioRepository.AlterarAsync(usuarioExistente);
        }

        public async Task AlterarParcialAsync(int id, UsuarioAlterarParcialDTO dto)
        {
            var usuarioExistente = await _usuarioRepository.BuscarPorIdAsync(id);

            if (usuarioExistente == null || usuarioExistente.UsuAtivo == 'I')
            {
                throw new KeyNotFoundException("Usuário não encontrado ou inativo no sistema.");
            }

            if (!string.IsNullOrEmpty(dto.UsuNome)) usuarioExistente.UsuNome = dto.UsuNome;
            if (!string.IsNullOrEmpty(dto.UsuLogin)) usuarioExistente.UsuLogin = dto.UsuLogin;
            if (!string.IsNullOrEmpty(dto.UsuSenha)) usuarioExistente.UsuSenha = dto.UsuSenha;
            if (dto.UsuEAdm.HasValue) usuarioExistente.UsuEAdm = dto.UsuEAdm.Value;

            await _usuarioRepository.AlterarAsync(usuarioExistente);
        }

        public async Task InativarAsync(int id)
        {
            var usuario = await _usuarioRepository.BuscarPorIdAsync(id);

            if (usuario == null || usuario.UsuAtivo == 'I')
            {
                throw new KeyNotFoundException("Usuário não encontrado ou já inativado.");
            }

            usuario.UsuAtivo = 'I';
            await _usuarioRepository.AlterarAsync(usuario);
        }
    }
}