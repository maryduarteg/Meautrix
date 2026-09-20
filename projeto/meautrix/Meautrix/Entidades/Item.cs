using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;


namespace Meautrix.Entidades
{
    [Table("itens")]
    public class Item
    {
        [Key]
        [Column("ite_id")]
        public int IteId { get; set; }
        [Required(ErrorMessage = "O nome do item é obrigatório.")]
        [Column("ite_nome")]
        [StringLength(60)]
        public string IteNome { get; set; } = string.Empty;

        [Column("produtos_prod_id")]
        [Required(ErrorMessage = "O produto do item é obrigatório.")]
        public int ProdId { get; set; } // FK -> Produtos.ProdId

        /// <summary>
        /// Indicador de situação da cliente: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("ite_ativo")]
        public char IteAtivo { get; set; } // 'A' = ativo, 'I' = inativo
        [Column("ite_quantidade_atual")]
        public float IteQuantidadeAtual { get; set; }
        [Column("ite_quantidade_saida_alterada")]
        public float IteQuantidadeSaidaAlterada { get; set; }
        [Column("ite_lote_nome")]
        public string IteLoteNome { get; set; }
        [Column("ite_lote_data_aquisicao")]
        public DateTime IteLoteDataAquisicao { get; set; }
        [Column("ite_lote_data_vencimento")]
        public DateTime IteLoteDataVencimento { get; set; }
    }
}
