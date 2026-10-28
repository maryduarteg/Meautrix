using System.ComponentModel.DataAnnotations;

namespace Meautrix.DTO.Agendamento;

public class AgendamentoSalvarDTO
{
    [Required(ErrorMessage = "Informe a data e a hora do procedimento.")]
    public DateTime? DataAgendadoPara { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Selecione um procedimento.")]
    public int ProcedimentoId { get; set; }

    [Required(ErrorMessage = "Selecione um cliente.")]
    [Range(1, int.MaxValue, ErrorMessage = "Selecione um cliente válido.")]
    public int? ClienteId { get; set; }
    public bool AtualizarDuracao { get; set; }
}
