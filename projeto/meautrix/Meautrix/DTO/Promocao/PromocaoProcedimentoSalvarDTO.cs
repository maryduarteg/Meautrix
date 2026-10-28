using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Meautrix.DTO.Promocao;

public class PromocaoProcedimentoSalvarDTO : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "Informe o procedimento.")]
    [JsonPropertyName("procedimentos_proc_id")]
    public int ProcedimentosProcId { get; set; }

    [JsonPropertyName("prom_proc_desconto")]
    public decimal PromProcDesconto { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (PromProcDesconto < 0 || PromProcDesconto > 99999999.99m ||
            decimal.Round(PromProcDesconto, 2) != PromProcDesconto)
        {
            yield return new ValidationResult(
                "Informe um desconto entre R$ 0,00 e R$ 99.999.999,99, com até duas casas decimais.",
                [nameof(PromProcDesconto)]);
        }
    }
}
