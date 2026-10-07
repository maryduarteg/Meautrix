using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("clientes")]
    public class Cliente
    {
        [Key]
        [Column("cli_id")]
        public int CliId { get; set; }

        [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
        [Column("cli_nome")]
        [StringLength(90)]
        public string CliNome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CPF da cliente é obrigatório.")]
        [Column("cli_cpf")]
        [StringLength(14)] // Considerando formatação (000.000.000-00). Se for salvar apenas números, use 11.
        public string CliCpf { get; set; } = string.Empty;

        [Column("cli_genero")]
        [StringLength(20)]
        public string CliGenero { get; set; } = string.Empty;

        /// <summary>
        /// A data de nascimento é opcional.
        /// </summary>
        [Column("cli_data_nascimento")]
        public DateTime CliDataNascimento { get; set; }

        /// <summary>
        /// Indicador de situação da cliente: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("cli_ativo")]
        public string CliAtivo { get; set; }

        [Column("cli_estado")]
        [StringLength(2)]
        public string CliEstado { get; set; } = string.Empty;

        [Column("cli_cidade")]
        [StringLength(60)]
        public string CliCidade { get; set; } = string.Empty;

        [Column("cli_endereco")]
        [StringLength(60)]
        public string CliEndereco { get; set; } = string.Empty;

        [Column("cli_endereco_numero")]
        [StringLength(60)]
        public string CliEnderecoNumero { get; set; } = string.Empty;

        [Column("cli_complemento")]
        [StringLength(60)]
        public string CliComplemento { get; set; } = string.Empty;

        [Column("cli_cep")]
        [StringLength(8)]
        public string CliCep { get; set; } = string.Empty;
    }
}
