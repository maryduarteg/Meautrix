using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly MeautrixDbContext _context;

        public UsuarioRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Usuario>> BuscarTodosAtivosAsync()
        {
            return await _context.Usuarios
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Usuario?> BuscarPorIdAsync(int id)
        {
            return await _context.Usuarios
                .FirstOrDefaultAsync(u => u.UsuId == id);
        }

        public async Task<Usuario?> BuscarPorLoginAsync(string login)
        {
            return await _context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UsuLogin.ToLower() == login.ToLower());
        }

        public async Task InserirAsync(Usuario usuario)
        {
            await _context.Usuarios.AddAsync(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(Usuario usuario)
        {
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();
        }
    }
}