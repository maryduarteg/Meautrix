namespace Meautrix.DTO.Cliente
{
    public class ClienteAlterarParcialDTO
    {
        public string? CliNome { get; set; }
        public string? CliGenero { get; set; }
        public DateTime? CliDataNascimento { get; set; }
        public string CliAtivo { get; set; }
        public string? CliEstado { get; set; }
        public string? CliCidade { get; set; }
        public string? CliEndereco { get; set; }
        public string? CliEnderecoNumero { get; set; }
        public string? CliComplemento { get; set; }
        public string? CliCep { get; set; }
    }
}