using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("produtos_procedimentos")]
    public class ProdutoProcedimento
    {
        [Column("produtos_prod_id")]
        public int ProdId { get; set; }

        [Column("procedimentos_proc_id")]
        public int ProcId { get; set; }

        [Required]
        [Column("prod_proc_quantidade_saida")]
        public double QuantidadeSaida { get; set; }
    }
}
