namespace Meautrix.DTO.Produto
{
    public class ProdutoResponseDTO
    {
        public int ProdId { get; set; }
        public string ProdDescricao { get; set; } = string.Empty;
        public double ProdQuantidadeMinima { get; set; }
        public int MedidasMedId { get; set; }
        public int CatProdId { get; set; }
        public string ProdAtivo { get; set; } = "A";

    }
}