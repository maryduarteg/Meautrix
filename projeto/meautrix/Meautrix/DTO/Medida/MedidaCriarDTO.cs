namespace Meautrix.DTO.Medida
{
    public class MedidaCriarDTO
    {
        public string MedDescricao { get; set; } = string.Empty;
        public string MedSigla { get; set; } = string.Empty;
        public string MedAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo

    }
}