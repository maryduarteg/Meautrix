using Meautrix.DTO.Promocao;
using Meautrix.Entidades;

namespace Meautrix.Interfaces;

public interface IPromocaoRepository
{
    Task<IEnumerable<Promocao>> BuscarTodosAsync(PromocaoFiltroDTO filtro);
    Task<Promocao?> BuscarPorIdAsync(int id);
    Task InserirAsync(Promocao promocao);
    Task AlterarAsync(Promocao promocao);
    Task ExcluirAsync(Promocao promocao);
}
