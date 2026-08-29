using System.ComponentModel.DataAnnotations;

namespace Meautrix.Application.DTOs.Usuario
{
    public class UsuarioAlterarDTO
    {
        [Required(ErrorMessage = "O ID do usuário é obrigatório para alteração.")]
        public int UsuId { get; set; }

        [Required(ErrorMessage = "O nome do usuário é obrigatório.")]
        [StringLength(60)]
        public string UsuNome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O login é obrigatório.")]
        [StringLength(30)]
        public string UsuLogin { get; set; } = string.Empty;

        [StringLength(60)]
        public string UsuSenha { get; set; } = string.Empty;

        [Required]
        public char UsuEAdmin { get; set; }

        [Required]
        public char UsuAtivo { get; set; }
    }
}