namespace Meautrix.DTO.Fornecedor
{
    public class FornecedorAlterarParcialDTO
    {
        public string? FornRazaoSocial { get; set; } = string.Empty;
        public string? FornCnpj { get; set; } = string.Empty;
        public string FornAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo
    }
}