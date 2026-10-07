namespace Meautrix.DTO.Cliente
{
    public class ClienteCriarDTO
    {
        public string CliNome { get; set; } = string.Empty;
        public string CliGenero { get; set; } = string.Empty;
        public DateTime CliDataNascimento { get; set; }
        public string CliAtivo { get; set; } = "A";
        public string CliCpf { get; set; } = string.Empty;
        public string CliEstado { get; set; } = string.Empty;
        public string CliCidade { get; set; } = string.Empty;
        public string CliEndereco { get; set; } = string.Empty;
        public string CliEnderecoNumero { get; set; } = string.Empty;
        public string CliComplemento { get; set; } = string.Empty;
        public string CliCep { get; set; } = string.Empty;
    }
}