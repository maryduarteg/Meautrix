using Meautrix.Entidades;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Meautrix.Interfaces.Repositories
{
    public interface IUsuarioRepository
    {
        // No diagrama, a entidade é chamada de "Usuarios", mas usamos "Usuario"
        void Inserir(Usuario usuario);

        void Alterar(Usuario usuario);

        Usuario BuscarPorId(int id); // Retorna a entidade para ser manipulada no Service
    }
}
