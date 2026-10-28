using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades;

[Table("promocoes", Schema = "public")]
public class Promocao
{
    [Key, Column("prom_id")]
    public int PromId { get; set; }

    [Required, StringLength(60), Column("prom_titulo")]
    public string PromTitulo { get; set; } = string.Empty;

    [Required, StringLength(100), Column("prom_mensagem")]
    public string PromMensagem { get; set; } = string.Empty;

    [Column("prom_data_minima", TypeName = "date")]
    public DateOnly PromDataMinima { get; set; }

    [Column("prom_data_maxima", TypeName = "date")]
    public DateOnly PromDataMaxima { get; set; }

    [Column("created_at", TypeName = "timestamp with time zone")]
    public DateTime? CreatedAt { get; set; }
}
