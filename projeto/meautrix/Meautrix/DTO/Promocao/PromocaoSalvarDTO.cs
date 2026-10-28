using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Meautrix.DTO.Promocao;

public class PromocaoSalvarDTO : IValidatableObject
{
    [Required(ErrorMessage = "Informe o título."), StringLength(60)]
    [JsonPropertyName("prom_titulo")]
    public string? PromTitulo { get; set; }

    [Required(ErrorMessage = "Informe a mensagem."), StringLength(100)]
    [JsonPropertyName("prom_mensagem")]
    public string? PromMensagem { get; set; }

    [Required(ErrorMessage = "Informe a data inicial.")]
    [JsonPropertyName("prom_data_minima")]
    public DateOnly? PromDataMinima { get; set; }

    [Required(ErrorMessage = "Informe a data final.")]
    [JsonPropertyName("prom_data_maxima")]
    public DateOnly? PromDataMaxima { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (PromDataMaxima < PromDataMinima)
            yield return new ValidationResult("A data final não pode ser anterior à data inicial.", [nameof(PromDataMaxima)]);
    }
}
