using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("usuarios")]
    public class Usuario
    {
        [Key]
        [Column("usu_id")]
        public int UsuId { get; set; }

        [Column("usu_nome")]
        public string UsuNome { get; set; } = string.Empty;

        [Column("usu_login")]
        public string UsuLogin { get; set; } = string.Empty;

        [Column("usu_senha")]
        public string UsuSenha { get; set; } = string.Empty;

        [Column("usu_e_adm")]
        public char UsuEAdm { get; set; }

        [Column("usu_ativo")]
        public char UsuAtivo { get; set; }
    }
}