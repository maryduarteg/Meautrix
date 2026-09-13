using Meautrix.Entidades;
using Meautrix.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Meautrix.Repository
{
    public class ClienteRepository : IClienteRepository
    {
        private readonly MeautrixDbContext _context;

        public ClienteRepository(MeautrixDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Cliente>> BuscarTodosAtivosAsync()
        {
            return await _context.Clientes
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Cliente?> BuscarPorIdAsync(int id)
        {
            return await _context.Clientes
                .FirstOrDefaultAsync(c => c.CliId == id);
        }

        public async Task<Cliente?> BuscarPorCpfAsync(string cpf)
        {
            return await _context.Clientes
                .FirstOrDefaultAsync(c => c.CliCpf == cpf);
        }

        public async Task InserirAsync(Cliente cliente)
        {
            await _context.Clientes.AddAsync(cliente);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarAsync(Cliente cliente)
        {
            _context.Clientes.Update(cliente);
            await _context.SaveChangesAsync();
        }
    }
}