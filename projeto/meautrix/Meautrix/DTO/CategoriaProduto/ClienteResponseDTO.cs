namespace Meautrix.DTO.CategoriaProduto
{
    public class CategoriaProdutoResponseDTO
    {
        public int CatProdId { get; set; }
        public string CatProdDescricao { get; set; } = string.Empty;
        public string CatProdAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo
    }
}