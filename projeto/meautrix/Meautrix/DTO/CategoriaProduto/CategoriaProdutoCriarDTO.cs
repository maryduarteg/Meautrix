namespace Meautrix.DTO.CategoriaProduto
{
    public class CategoriaProdutoCriarDTO
    {
        public string CatProdDescricao { get; set; } = string.Empty;
        public string CatProdAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo
    }
}