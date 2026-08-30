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

            // 2. Configuração de CORS (Permite comunicação com o front-end React)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("PermitirReact", policy =>
                {
                    policy.WithOrigins("http://localhost:3000")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            // 3. Injeção de Dependência
            builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            builder.Services.AddScoped<IUsuarioService, UsuarioService>();

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

            app.UseHttpsRedirection();
            app.UseCors("PermitirReact");
            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }
    }
}