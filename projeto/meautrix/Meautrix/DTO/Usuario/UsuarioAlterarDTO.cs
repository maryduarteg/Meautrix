namespace Meautrix.DTO.Usuario
{
    public class UsuarioAlterarDTO
    {
        public string UsuNome { get; set; } = string.Empty;
        public string UsuLogin { get; set; } = string.Empty;
        public string UsuSenha { get; set; } = string.Empty;
        public string UsuEAdmin { get; set; } = "N"; // 'S' = Admin, 'N' = Operador
        public string UsuAtivo { get; set; } = "A";

    }
}