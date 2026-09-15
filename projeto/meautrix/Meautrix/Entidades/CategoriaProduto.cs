using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("CATEGORIAS_PRODUTOS")]
    public class CategoriaProduto
    {
        [Key]
        [Column("CAT_PROD_ID")]
        public int CatProdId { get; set; }

        [Required(ErrorMessage = "A descrição do produto é obrigatório.")]
        [Column("CAT_PROD_DESCRICAO")]
        [StringLength(30)]
        public string CatProdDescricao { get; set; } = string.Empty;

        /// <summary>
        /// Indicador de situação da categoria produto: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("CAT_PROD_ATIVO")]
        public string CatProdAtivo { get; set; }
    }
}
