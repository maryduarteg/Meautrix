using Meautrix.Repository;
// Usings das interfaces e implementações (ajuste conforme os namespaces exatos do seu projeto)
// using Meautrix.Interfaces.Repositories;
// using Meautrix.Interfaces.Services;
// using Meautrix.Services;
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

            // 2. Configuração de CORS (Permite que o React faça requisições para a API)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("PermitirReact", policy =>
                {
                    policy.WithOrigins("http://localhost:3000") // Porta padrão do React
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            // 3. Injeção de Dependência (Invertion of Control)
            // Aqui informamos ao .NET qual classe instanciar quando uma Interface for chamada
            // Descomente e ajuste as linhas abaixo quando criar as classes Repository e Service

            // builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            // builder.Services.AddScoped<IUsuarioService, UsuarioService>();

            // Adiciona os controllers
            builder.Services.AddControllers();

            // Configuração do Swagger para testes de API 
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // Ativa o CORS configurado acima
            app.UseCors("PermitirReact");

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}