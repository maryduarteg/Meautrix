namespace Meautrix.DTO.Cliente
{
    public class ClienteResponseDTO
    {
        public int CliId { get; set; }
        public string CliNome { get; set; } = string.Empty;
        public string CliGenero { get; set; } = string.Empty;
        public DateTime CliDataNascimento { get; set; }
        public string CliAtivo { get; set; }
        public string CliCpf { get; set; } = string.Empty;

    }
}