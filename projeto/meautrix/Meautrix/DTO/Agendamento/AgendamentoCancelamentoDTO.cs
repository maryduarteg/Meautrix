using System.ComponentModel.DataAnnotations;

namespace Meautrix.DTO.Agendamento;

public class AgendamentoCancelamentoDTO
{
    [Required(ErrorMessage = "Informe a situação do cancelamento.")]
    [RegularExpression("^[SN]$", ErrorMessage = "Informe S para cancelado ou N para não cancelado.")]
    public string Cancelado { get; set; } = string.Empty;
}
