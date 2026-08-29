using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{

    [Table("USUARIOS")]
    public class Usuario
    {
        [Key]
        [Column("USU_ID")]
        public int UsuId { get; set; }

        [Required(ErrorMessage = "O nome do usuário é obrigatório.")]
        [Column("USU_NOME")]
        [StringLength(60)]
        public string UsuNome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O login é obrigatório.")]
        [Column("USU_LOGIN")]
        [StringLength(30)]
        public string UsuLogin { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [Column("USU_SENHA")]
        [StringLength(60)]
        public string UsuSenha { get; set; } = string.Empty;

        /// <summary>
        /// Indicador de perfil: 'T' para true (Administrador) e 'F' para false (Operador).
        /// </summary>
        [Required]
        [Column("USU_E_ADM")]
        public char UsuEAdmin { get; set; }

        /// <summary>
        /// Indicador de situação do usuário: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("USU_ATIVO")]
        public char UsuAtivo { get; set; }

        // Método citado no diagrama de classes
        public void Criar()
        {
            this.UsuAtivo = 'A'; // Um novo usuário deve ser criado como ativo
        }
    }
}
