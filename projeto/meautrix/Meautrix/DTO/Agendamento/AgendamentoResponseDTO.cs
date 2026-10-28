namespace Meautrix.DTO.Agendamento;

public class AgendamentoResponseDTO
{
    public int Id { get; set; }
    public string Cancelado { get; set; } = "N";
    public int? UsuarioCancelouId { get; set; }
    public DateTime DataAgendadoPara { get; set; }
    public DateTime DataAgendadoEm { get; set; }
    public int? DuracaoMinutos { get; set; }
    public DateTime? DataTerminoPrevisto { get; set; }
    public int ProcedimentoId { get; set; }
    public string ProcedimentoNome { get; set; } = string.Empty;
    public int? ClienteId { get; set; }
    public string? ClienteNome { get; set; }
}
