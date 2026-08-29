namespace Meautrix.Application.DTOs.Usuario
{
    public class UsuarioAlterarParcialDTO
    {
        public int UsuId { get; set; }

        public string? UsuNome { get; set; }

        public string? UsuLogin { get; set; }

        public string? UsuSenha { get; set; }

        public char? UsuEAdmin { get; set; }

        public char? UsuAtivo { get; set; }
    }
}