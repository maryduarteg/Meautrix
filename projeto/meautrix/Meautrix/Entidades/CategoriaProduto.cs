using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("categorias_produtos")]
    public class CategoriaProduto
    {
        [Key]
        [Column("cat_prod_id")]
        public int CatProdId { get; set; }

        [Required(ErrorMessage = "A descrição do produto é obrigatório.")]
        [Column("cat_prod_descricao")]
        [StringLength(30)]
        public string CatProdDescricao { get; set; } = string.Empty;

        /// <summary>
        /// Indicador de situação da categoria produto: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("cat_prod_ativo")]
        public string CatProdAtivo { get; set; }
    }
}
