using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("fornecedores")]
    public class Fornecedor
    {
        [Key]
        [Column("forn_id")]
        public int FornId { get; set; }

        [Required(ErrorMessage = "A razão social é obrigatória.")]
        [Column("forn_razao_social")]
        [StringLength(60)]
        public string FornRazaoSocial { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CNPJ é obrigatório.")]
        [Column("forn_cnpj")]
        [StringLength(20)]
        public string FornCnpj { get; set; } = string.Empty;

        /// <summary>
        /// Indicador de situação da fornecedor: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("forn_ativo")]
        public string FornAtivo { get; set; }
    }
}
