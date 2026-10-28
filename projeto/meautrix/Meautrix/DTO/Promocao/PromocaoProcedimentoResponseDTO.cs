using System.Text.Json.Serialization;

namespace Meautrix.DTO.Promocao;

public class PromocaoProcedimentoResponseDTO
{
    [JsonPropertyName("prom_proc_id")]
    public int PromProcId { get; set; }

    [JsonPropertyName("procedimentos_proc_id")]
    public int ProcedimentosProcId { get; set; }

    [JsonPropertyName("proc_nome")]
    public string ProcNome { get; set; } = string.Empty;

    [JsonPropertyName("proc_valor")]
    public decimal ProcValor { get; set; }

    [JsonPropertyName("prom_proc_desconto")]
    public decimal PromProcDesconto { get; set; }
}
