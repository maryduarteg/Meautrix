using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("produtos")]
    public class Produto
    {
        [Key]
        [Column("prod_id")]
        public int ProdId { get; set; }

        [Required(ErrorMessage = "A descrição do produto é obrigatória.")]
        [Column("prod_descricao")]
        [StringLength(90)]
        public string ProdDescricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "A quantidade mínima é obrigatória.")]
        [Column("prod_quantidade_minima")]
        public double ProdQuantidadeMinima { get; set; }

        [Required(ErrorMessage = "O id de medidas é obrigatório.")]
        [Column("medidas_med_id")]
        public int MedidasMedId { get; set; }

        [Required(ErrorMessage = "O id de categoria é obrigatório.")]
        [Column("cat_prod_id")]
        public int CatProdId { get; set; }

        [Required(ErrorMessage = "O id de fornecedor é obrigatório.")]
        [Column("forn_id")]
        public int FornId { get; set; }
        /// <summary>
        /// Indicador de situação do produto: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("prod_ativo")]
        public string ProdAtivo { get; set; }
    }
}