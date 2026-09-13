using Meautrix.DTO.Usuario;
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

        // Mapeia entidade para DTO de resposta, garantindo o nome UsuEAdmin no JSON
        private static UsuarioResponseDTO MapToDTO(Usuario u) => new()
        {
            UsuId     = u.UsuId,
            UsuNome   = u.UsuNome,
            UsuLogin  = u.UsuLogin,
            UsuEAdmin = u.UsuEAdm,
            UsuAtivo  = u.UsuAtivo
        };

        private static UsuarioLoginDTO MapLoginToDTO(Usuario u) => new()
        {
            UsuLogin = u.UsuLogin,
            UsuSenha = u.UsuSenha
        };

        public async Task<IEnumerable<UsuarioResponseDTO>> BuscarTodosAsync()
        {
            var lista = await _usuarioRepository.BuscarTodosAtivosAsync();
            return lista.Select(MapToDTO);
        }

        public async Task<UsuarioResponseDTO?> BuscarPorIdAsync(int id)
        {
            var usuario = await _usuarioRepository.BuscarPorIdAsync(id);
            if (usuario == null || usuario.UsuAtivo == 'I')
                return null;
            return MapToDTO(usuario);
        }

        public async Task<UsuarioLoginDTO?> BuscarPorLoginAsync(string login)
        {
            var usuario = await _usuarioRepository.BuscarPorLoginAsync(login);
            if (usuario == null || usuario.UsuAtivo == 'I')
                return null;
            return MapLoginToDTO(usuario);
        }

        public async Task CriarAsync(UsuarioCriarDTO dto)
        {
            var usuarioExistente = await _usuarioRepository.BuscarPorLoginAsync(dto.UsuLogin);
            if (usuarioExistente != null)
            {
                throw new InvalidOperationException("Já existe um usuário cadastrado com este login.");
            }

            // Normaliza o valor e converte string → char; padrão: 'N' (Operador)
            var eAdm  = (dto.UsuEAdmin == "S") ? 'S' : 'N';
            var ativo = (dto.UsuAtivo  == "I") ? 'I' : 'A';

            var novoUsuario = new Usuario
            {
                UsuNome  = dto.UsuNome,
                UsuLogin = dto.UsuLogin,
                UsuSenha = dto.UsuSenha,
                UsuEAdm  = eAdm,
                UsuAtivo = ativo
            };

            await _usuarioRepository.InserirAsync(novoUsuario);
        }

        public async Task AlterarAsync(int id, UsuarioAlterarDTO dto)
        {
            var usuario = await _usuarioRepository.BuscarPorIdAsync(id);
            if (usuario == null)
                throw new KeyNotFoundException("Usuário não encontrado.");

            // Converte string → char; padrão: 'N'
            var novoEAdm  = (dto.UsuEAdmin == "S") ? 'S' : 'N';
            var novoAtivo = (dto.UsuAtivo  == "I") ? 'I' : 'A';

            // Guard: impede remover o último administrador
            if (usuario.UsuEAdm == 'S' && novoEAdm != 'S')
            {
                var adminCount = await _usuarioRepository.ContarAdminsAsync();
                if (adminCount <= 1)
                    throw new InvalidOperationException("Não é possível remover o último administrador do sistema.");
            }

            // Aplica as alterações
            usuario.UsuNome  = dto.UsuNome;
            usuario.UsuLogin = dto.UsuLogin;
            usuario.UsuEAdm  = novoEAdm;
            usuario.UsuAtivo = novoAtivo;

            // Atualiza a senha apenas se informada
            if (!string.IsNullOrWhiteSpace(dto.UsuSenha))
            {
                usuario.UsuSenha = dto.UsuSenha;
            }

            await _usuarioRepository.AlterarAsync(usuario);
        }

        public async Task AlterarParcialAsync(int id, UsuarioAlterarParcialDTO dto)
        {
            var usuarioExistente = await _usuarioRepository.BuscarPorIdAsync(id);

            if (usuarioExistente == null || usuarioExistente.UsuAtivo == 'I')
            {
                throw new KeyNotFoundException("Usuário não encontrado ou inativo no sistema.");
            }

            // Guard: impede remover o último administrador via PATCH
            if (dto.UsuEAdm.HasValue && dto.UsuEAdm.Value != 'S' && usuarioExistente.UsuEAdm == 'S')
            {
                var adminCount = await _usuarioRepository.ContarAdminsAsync();
                if (adminCount <= 1)
                    throw new InvalidOperationException("Não é possível remover o último administrador do sistema.");
            }

            if (!string.IsNullOrEmpty(dto.UsuNome))  usuarioExistente.UsuNome  = dto.UsuNome;
            if (!string.IsNullOrEmpty(dto.UsuLogin)) usuarioExistente.UsuLogin = dto.UsuLogin;
            if (!string.IsNullOrEmpty(dto.UsuSenha)) usuarioExistente.UsuSenha = dto.UsuSenha;
            if (dto.UsuEAdm.HasValue)
            {
                // Sanitiza byte nulo
                var eAdm = (dto.UsuEAdm.Value == '\0') ? 'N' : dto.UsuEAdm.Value;
                usuarioExistente.UsuEAdm = eAdm;
            }

            await _usuarioRepository.AlterarAsync(usuarioExistente);
        }

        public async Task InativarAsync(int id)
        {
            var usuario = await _usuarioRepository.BuscarPorIdAsync(id);

            if (usuario == null || usuario.UsuAtivo == 'I')
            {
                throw new KeyNotFoundException("Usuário não encontrado ou já inativado.");
            }

            if (usuario.UsuEAdm == 'S')
            {
                if (await _usuarioRepository.ContarAdminsAsync() <= 1)
                    throw new InvalidOperationException("Usuário é o único adminsitrador ativo.");
            }

            usuario.UsuAtivo = 'I';
            await _usuarioRepository.AlterarAsync(usuario);
        }
    }
}