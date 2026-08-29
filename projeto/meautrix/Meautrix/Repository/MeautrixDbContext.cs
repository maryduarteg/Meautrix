using Microsoft.EntityFrameworkCore;
using Meautrix.Entidades;

namespace Meautrix.Repository
{
    public class MeautrixDbContext : DbContext
    {
        public MeautrixDbContext(DbContextOptions<MeautrixDbContext> options) : base(options)
        {
        }

        // DbSets das Entidades
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Cliente> Clientes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapeamento adicional e restrições de tabelas
            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.HasIndex(c => c.CliCpf).IsUnique();
            });

            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasIndex(u => u.UsuLogin).IsUnique();
            });
        }
    }
}