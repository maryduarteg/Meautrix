using System.ComponentModel.DataAnnotations;

namespace Meautrix.Application.DTOs.Usuario
{
    public class UsuarioCriarDTO
    {
        public int UsuId { get; set; } // Opcional no envio, será gerado pelo banco

        [Required(ErrorMessage = "O nome do usuário é obrigatório.")]
        [StringLength(60)]
        public string UsuNome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O login é obrigatório.")]
        [StringLength(30)]
        public string UsuLogin { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(6, ErrorMessage = "A senha deve conter pelo menos 6 caracteres.")]
        [StringLength(60)]
        public string UsuSenha { get; set; } = string.Empty;

        [Required(ErrorMessage = "O perfil de acesso é obrigatório.")]
        public char UsuEAdmin { get; set; }

        public char UsuAtivo { get; set; } // Opcional no envio, o Service definirá como 'A'
    }
}