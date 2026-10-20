namespace Meautrix.DTO.ProdutoProcedimento
{
    public class ProdutoProcedimentoResponseDTO
    {
        public int ProdId { get; set; }
        public string ProdDescricao { get; set; } = string.Empty;
        public int ProcId { get; set; }
        public double QuantidadeSaida { get; set; }
        public int MedidasMedId { get; set; }
    }
}
