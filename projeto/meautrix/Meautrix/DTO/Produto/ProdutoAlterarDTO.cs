namespace Meautrix.DTO.Produto
{
    public class ProdutoAlterarDTO
    {
        public string ProdDescricao { get; set; } = string.Empty;
        public double ProdQuantidadeMinima { get; set; }
        public int Medidas_Med_Id { get; set; }
        public int CatProdId { get; set; }
        public string ProdAtivo { get; set; } = "A";

    }
}