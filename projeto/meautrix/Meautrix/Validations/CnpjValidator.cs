using System.Text.RegularExpressions;

namespace Meautrix.Validations
{
    public static class CnpjValidator
    {
        public static string Normalizar(string? valor) =>
            Regex.Replace(valor ?? string.Empty, @"[.\-/\s]", "").ToUpperInvariant();

        public static bool EhValido(string? valor)
        {
            var cnpj = Normalizar(valor);
            if (!Regex.IsMatch(cnpj, @"\A[A-Z0-9]{12}[0-9]{2}\z") ||
                cnpj.All(c => c == cnpj[0]))
                return false;

            for (var tamanho = 12; tamanho <= 13; tamanho++)
            {
                var soma = 0;
                var peso = 2;
                for (var i = tamanho - 1; i >= 0; i--)
                {
                    soma += (cnpj[i] - '0') * peso;
                    peso = peso == 9 ? 2 : peso + 1;
                }

                var resto = soma % 11;
                var digito = resto < 2 ? 0 : 11 - resto;
                if (cnpj[tamanho] - '0' != digito)
                    return false;
            }

            return true;
        }
    }
}
