using Meautrix.Application.DTOs.Usuario;

namespace Meautrix.Application.Interfaces
{
    public interface IUsuarioService
    {
        UsuarioResponseDTO Criar(UsuarioCriarDTO usuarioDto);

        UsuarioResponseDTO Alterar(UsuarioAlterarDTO usuarioDto);

        UsuarioResponseDTO AlterarParcial(UsuarioAlterarParcialDTO usuarioDto);

        // No diagrama consta "Buscart", ajustei para "Buscar" para manter a semântica correta
        UsuarioResponseDTO Buscar(int id);
    }
}