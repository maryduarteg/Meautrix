namespace Meautrix.DTO.Cliente
{
    public class ClienteCriarDTO
    {
        public string CliNome { get; set; } = string.Empty;
        public string CliGenero { get; set; } = string.Empty;
        public DateTime CliDataNascimento { get; set; }
        public string CliAtivo { get; set; } = "A";
        public string CliCpf { get; set; } = string.Empty;

    }
}