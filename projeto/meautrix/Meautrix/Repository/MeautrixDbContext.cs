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
        public DbSet<Item> Item { get; set; }
        public DbSet<Procedimento> Procedimento { get; set; }
        public DbSet<ProdutoProcedimento> ProdutosProcedimentos { get; set; }
        public DbSet<Agendamento> Agendamentos { get; set; }
        public DbSet<Promocao> Promocoes { get; set; }
        public DbSet<PromocaoProcedimento> PromocoesProcedimentos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Promocao>(entity =>
            {
                entity.Property(p => p.PromId).UseIdentityByDefaultColumn();
                entity.Property(p => p.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            modelBuilder.Entity<PromocaoProcedimento>(entity =>
            {
                entity.Property(vinculo => vinculo.PromProcId).UseIdentityByDefaultColumn();
                entity.Property(vinculo => vinculo.PromProcDesconto).HasPrecision(10, 2);
                entity.HasIndex(vinculo => new { vinculo.PromocoesPromId, vinculo.ProcedimentosProcId }).IsUnique();
                entity.HasOne(vinculo => vinculo.Promocao)
                    .WithMany()
                    .HasForeignKey(vinculo => vinculo.PromocoesPromId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(vinculo => vinculo.Procedimento)
                    .WithMany()
                    .HasForeignKey(vinculo => vinculo.ProcedimentosProcId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Agendamento>()
                .Property(a => a.Cancelado)
                .HasDefaultValue("N");

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

            modelBuilder.Entity<Item>(entity =>
            {
                entity.Property(i => i.IteLoteDataAquisicao)
                    .HasColumnName("ite_lote_data_aquisicao")
                    .HasColumnType("date");

                entity.Property(i => i.IteLoteDataVencimento)
                    .HasColumnName("ite_lote_data_vencimento")
                    .HasColumnType("date");
            });

            modelBuilder.Entity<ProdutoProcedimento>(entity =>
            {
                entity.HasKey(vinculo => new { vinculo.ProdId, vinculo.ProcId });
            });
        }
    }
}
