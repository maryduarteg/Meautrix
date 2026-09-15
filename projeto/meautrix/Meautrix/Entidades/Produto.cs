using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("PRODUTOS")]
    public class Produto
    {
        [Key]
        [Column("PROD_ID")]
        public int ProdId { get; set; }

        [Required(ErrorMessage = "A descrição do produto é obrigatória.")]
        [Column("PROD_DESCRICAO")]
        [StringLength(90)]
        public string ProdDescricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "A quantidade mínima é obrigatória.")]
        [Column("PROD_QUANTIDADE_MINIMA")]
        public double ProdQuantidadeMinima { get; set; }

        [Required(ErrorMessage = "O id de medidas é obrigatório.")]
        [Column("MEDIDAS_MED_ID")]
        public int MedidasMedId { get; set; }

        [Required(ErrorMessage = "O id de categoria é obrigatório.")]
        [Column("CAT_PROD_ID")]
        public int CatProdId { get; set; }

        /// <summary>
        /// Indicador de situação do produto: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("PROD_ATIVO")]
        public string ProdAtivo { get; set; }
    }
}
