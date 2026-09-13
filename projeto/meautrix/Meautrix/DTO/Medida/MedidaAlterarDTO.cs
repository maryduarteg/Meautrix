namespace Meautrix.DTO.Medida
{
    public class MedidaAlterarDTO
    {
        public string MedDescricao { get; set; } = string.Empty;
        public string MedSigla { get; set; } = string.Empty;
        public string MedAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo
    }
}