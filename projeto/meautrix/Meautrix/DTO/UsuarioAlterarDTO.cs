namespace Meautrix.DTOs
{
    public class UsuarioAlterarDTO
    {
        public string UsuNome { get; set; } = string.Empty;
        public string UsuLogin { get; set; } = string.Empty;
        public string UsuSenha { get; set; } = string.Empty;
        public char UsuEAdm { get; set; }
        public char UsuAtivo { get; set; }

    }
}