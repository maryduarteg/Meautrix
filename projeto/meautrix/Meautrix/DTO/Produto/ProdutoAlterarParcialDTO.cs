namespace Meautrix.DTO.Produto
{
    public class ProdutoAlterarParcialDTO
    {

        public string? ProdDescricao { get; set; } = string.Empty;
        public double? ProdQuantidadeMinima { get; set; }
        public int? MedidasMedId { get; set; }
        public int? CatProdId { get; set; }
        public int? FornId { get; set; }

        public string ProdAtivo { get; set; } = "A";

    }
}