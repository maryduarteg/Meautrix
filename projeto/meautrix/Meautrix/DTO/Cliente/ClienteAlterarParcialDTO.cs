namespace Meautrix.DTO.Cliente
{
    public class ClienteAlterarParcialDTO
    {
        public string? CliNome { get; set; }
        public string? CliGenero { get; set; }
        public DateTime? CliDataNascimento { get; set; }
        public string CliAtivo { get; set; }
    }
}