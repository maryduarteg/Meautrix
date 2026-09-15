namespace Meautrix.DTO.CategoriaProduto
{
    public class CategoriaProdutoAlterarDTO
    {
        public string CatProdDescricao { get; set; } = string.Empty;
        public string CatProdAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo
    }
}