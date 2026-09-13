using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("FORNECEDORES")]
    public class Fornecedor
    {
        [Key]
        [Column("FORN_ID")]
        public int FornId { get; set; }

        [Required(ErrorMessage = "A razão social é obrigatória.")]
        [Column("FORN_RAZAO_SOCIAL")]
        [StringLength(60)]
        public string FornRazaoSocial { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CNPJ é obrigatório.")]
        [Column("FORN_CNPJ")]
        [StringLength(20)]
        public string FornCnpj { get; set; } = string.Empty;

        /// <summary>
        /// Indicador de situação da fornecedor: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("FORN_ATIVO")]
        public string FornAtivo { get; set; }
    }
}
