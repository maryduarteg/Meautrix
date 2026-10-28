using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.DTO.Promocao;

public class PromocaoFiltroDTO : IValidatableObject
{
    [FromQuery(Name = "titulo")]
    public string? Titulo { get; set; }
    [FromQuery(Name = "mensagem")]
    public string? Mensagem { get; set; }
    [FromQuery(Name = "data_inicio")]
    public DateOnly? DataInicio { get; set; }
    [FromQuery(Name = "data_fim")]
    public DateOnly? DataFim { get; set; }
    [FromQuery(Name = "apenas_ativas")]
    public bool ApenasAtivas { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DataFim < DataInicio)
            yield return new ValidationResult("O fim do filtro não pode ser anterior ao início.", [nameof(DataFim)]);
    }
}
