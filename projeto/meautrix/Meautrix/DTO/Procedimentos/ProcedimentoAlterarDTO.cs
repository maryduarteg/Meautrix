namespace Meautrix.DTO.Procedimento
{
    public class ProcedimentoAlterarDTO
    {
        public string ProcNome { get; set; } = string.Empty;
        public string ProcDescricao { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Range(1, int.MaxValue, ErrorMessage = "Informe a duração em minutos, maior que zero.")]
        public int ProcDuracaoMinutos { get; set; }
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Informe o valor do procedimento.")]
        [System.ComponentModel.DataAnnotations.Range(typeof(decimal), "0", "99999999.99", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Informe um valor entre R$ 0,00 e R$ 99.999.999,99.")]
        public decimal? ProcValor { get; set; }
        public string ProcAtivo { get; set; } = "A"; // 'A' = Ativo, 'I' = Inativo
    }
}
