using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.DTO.Item
{
   
    public class ItemAlterarDTO
    {
        public string IteNome { get; set; }
        public int ProdId { get; set; }
        public char IteAtivo { get; set; }
        public float IteQuantidadeAtual { get; set; }
        public float IteQuantidadeSaidaAlterada { get; set; }
        public string IteLoteNome { get; set; }
        public DateTime IteLoteDataAquisicao { get; set; }
        public DateTime IteLoteDataVencimento { get; set; }
    }
}
