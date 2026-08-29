namespace Meautrix.DTOs
{
    public class UsuarioAlterarParcialDTO
    {
        public string? UsuNome { get; set; }
        public string? UsuLogin { get; set; }
        public string? UsuSenha { get; set; }
        public char? UsuEAdm { get; set; } // Nulo caso não queira atualizar o campo no PATCH
    }
}