namespace Meautrix.DTO
{
    public class UsuarioResponseDTO
    {
        public int UsuId { get; set; }
        public string UsuNome { get; set; } = string.Empty;
        public string UsuLogin { get; set; } = string.Empty;
        public char UsuEAdmin { get; set; }
        public char UsuAtivo { get; set; }
    }
}