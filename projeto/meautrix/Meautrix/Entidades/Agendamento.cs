using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades;

[Table("procedimentos_previstos")]
public class Agendamento
{
    [Key, Column("proc_prev_id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column("proc_prev_data_agendado_para", TypeName = "timestamp without time zone")]
    public DateTime DataAgendadoPara { get; set; }

    [Column("proc_prev_data_agendado_em", TypeName = "timestamp without time zone")]
    public DateTime DataAgendadoEm { get; set; }

    [Column("proc_prev_duracao_minutos")]
    public int? DuracaoMinutos { get; set; }

    [Column("procedimentos_proc_id")]
    public int ProcedimentoId { get; set; }

    [Column("usuarios_usu_prev_id")]
    public int UsuarioAgendouId { get; set; }

    [Column("proc_prev_cancelado")]
    [StringLength(1)]
    public string? Cancelado { get; set; } = "N";

    [Column("usuarios_usu_cancelou_id")]
    public int? UsuarioCancelouId { get; set; }

    [Column("cli_id")]
    public int? ClienteId { get; set; }

    [ForeignKey(nameof(ProcedimentoId))]
    public Procedimento? Procedimento { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente? Cliente { get; set; }
}
