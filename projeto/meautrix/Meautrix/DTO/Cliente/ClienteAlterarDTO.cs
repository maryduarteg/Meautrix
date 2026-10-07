namespace Meautrix.DTO.Cliente
{
    public class ClienteAlterarDTO
    {
        public string CliNome { get; set; }
        public string CliGenero { get; set; }
        public DateTime CliDataNascimento { get; set; }
        public string CliAtivo { get; set; }
        public string CliEstado { get; set; } = string.Empty;
        public string CliCidade { get; set; } = string.Empty;
        public string CliEndereco { get; set; } = string.Empty;
        public string CliEnderecoNumero { get; set; } = string.Empty;
        public string CliComplemento { get; set; } = string.Empty;
        public string CliCep { get; set; } = string.Empty;
    }
}