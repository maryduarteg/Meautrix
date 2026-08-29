namespace Meautrix.Entidades
{
    public class Usuario
    {
        public int UsuId { get; set; }
        public string UsuNome { get; set; } = string.Empty;
        public string UsuLogin { get; set; } = string.Empty;
        public string UsuSenha { get; set; } = string.Empty;
        public char UsuEAdm { get; set; }   // CHAR(1) - 'S' / 'N' ou '1' / '0'
        public char UsuAtivo { get; set; }  // CHAR(1) - 'A' / 'I'
    }
}