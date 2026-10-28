using System.Text.Json.Serialization;

namespace Meautrix.DTO.Promocao;

public class PromocaoResponseDTO
{
    [JsonPropertyName("prom_id")]
    public int PromId { get; set; }
    [JsonPropertyName("prom_titulo")]
    public string PromTitulo { get; set; } = string.Empty;
    [JsonPropertyName("prom_mensagem")]
    public string PromMensagem { get; set; } = string.Empty;
    [JsonPropertyName("prom_data_minima")]
    public DateOnly PromDataMinima { get; set; }
    [JsonPropertyName("prom_data_maxima")]
    public DateOnly PromDataMaxima { get; set; }
    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
}
