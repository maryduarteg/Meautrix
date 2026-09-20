using Meautrix.Interfaces;
using Meautrix.Repository;
using Meautrix.Services;
using Microsoft.EntityFrameworkCore;

namespace Meautrix
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // 1. Configuração do Banco de Dados (PostgreSQL + EF Core)
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<MeautrixDbContext>(options =>
                options.UseNpgsql(connectionString));

            // 2. Configuração de CORS (Permite acesso a partir do Next.js)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://localhost:3000")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            // 3. Injeção de Dependência
            builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            builder.Services.AddScoped<IUsuarioService, UsuarioService>();
            builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
            builder.Services.AddScoped<IClienteService, ClienteService>();
            builder.Services.AddScoped<IMedidaService, MedidaService>();
            builder.Services.AddScoped<IMedidaRepository, MedidaRepository>();
            builder.Services.AddScoped<ICategoriaProdutoService, CategoriaProdutoService>();
            builder.Services.AddScoped<ICategoriaProdutoRepository, CategoriaProdutoRepository>();
            builder.Services.AddScoped<IProdutoService, ProdutoService>();
            builder.Services.AddScoped<IProdutoRepository, ProdutoRepository>();
            builder.Services.AddScoped<IFornecedorRepository, FornecedorRepository>();
            builder.Services.AddScoped<IFornecedorService, FornecedorService>();
            builder.Services.AddScoped<IItemRepository, ItemRepository>();
            builder.Services.AddScoped<IItemService, ItemService>();

            // 4. Controllers e Documentação Swagger
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Pipeline de execução
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // 5. CORS aplicado antes das rotas e autorizações
            app.UseCors("AllowFrontend");

            // Redirecionamento HTTPS desativado em desenvolvimento local para evitar erro 307
            // app.UseHttpsRedirection();

            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }
    }
}
