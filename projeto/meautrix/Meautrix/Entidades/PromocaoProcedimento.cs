using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades;

[Table("promocoes_procedimentos", Schema = "public")]
public class PromocaoProcedimento
{
    [Key, Column("prom_proc_id")]
    public int PromProcId { get; set; }

    [Column("procedimentos_proc_id")]
    public int ProcedimentosProcId { get; set; }

    [Column("promocoes_prom_id")]
    public int PromocoesPromId { get; set; }

    [Column("prom_proc_desconto", TypeName = "numeric(10,2)")]
    public decimal PromProcDesconto { get; set; }

    public Procedimento? Procedimento { get; set; }
    public Promocao? Promocao { get; set; }
}
