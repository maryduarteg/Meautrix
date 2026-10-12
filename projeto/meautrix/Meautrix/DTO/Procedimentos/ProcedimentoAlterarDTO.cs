namespace Meautrix.DTO.Procedimento
{
    public class ProcedimentoAlterarDTO
    {
        public string ProcNome { get; set; } = string.Empty;
        public string ProcDescricao { get; set; } = string.Empty;
        public string ProcAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo
    }
}