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
        public DbSet<Medida> Medidas { get; set; }
        public DbSet<Fornecedor> Fornecedores { get; set; }
        public DbSet<CategoriaProduto> Categorias_Produtos { get; set; }
        public DbSet<Produto> Produtos { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapeamento adicional e restrições de tabelas
            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.ToTable("clientes");
                entity.Property(c => c.CliId).HasColumnName("cli_id").ValueGeneratedOnAdd();
                entity.Property(c => c.CliNome).HasColumnName("cli_nome");
                entity.Property(c => c.CliCpf).HasColumnName("cli_cpf");
                entity.Property(c => c.CliGenero).HasColumnName("cli_genero");
                entity.Property(c => c.CliDataNascimento)
                    .HasColumnName("cli_data_nascimento")
                    .HasColumnType("date");
                entity.Property(c => c.CliAtivo).HasColumnName("cli_ativo");
                entity.HasIndex(c => c.CliCpf).IsUnique();
            });

            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasIndex(u => u.UsuLogin).IsUnique();
            });

            modelBuilder.Entity<Fornecedor>(entity =>
            {
                entity.HasIndex(f => f.FornCnpj).IsUnique();
            });
        }
    }
}
