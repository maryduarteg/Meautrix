using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("CLIENTES")]
    public class Cliente
    {
        [Key]
        [Column("CLI_ID")]
        public int CliId { get; set; }

        [Required(ErrorMessage = "O nome da cliente é obrigatório.")]
        [Column("CLI_NOME")]
        [StringLength(90)]
        public string CliNome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CPF da cliente é obrigatório.")]
        [Column("CLI_CPF")]
        [StringLength(14)] // Considerando formatação (000.000.000-00). Se for salvar apenas números, use 11.
        public string CliCpf { get; set; } = string.Empty;

        [Column("CLI_GENERO")]
        [StringLength(20)]
        public string CliGenero { get; set; } = string.Empty;

        /// <summary>
        /// A data de nascimento é opcional.
        /// </summary>
        [Column("CLI_DATA_NASCIMENTO")]
        public DateTime? CliDataNascimento { get; set; }

        /// <summary>
        /// Indicador de situação da cliente: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("CLI_ATIVO")]
        public char CliAtivo { get; set; }
    }
}
