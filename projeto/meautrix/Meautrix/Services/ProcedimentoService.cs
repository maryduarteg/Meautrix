using Meautrix.DTO.Procedimento;
using Meautrix.Entidades;
using Meautrix.Interfaces;

namespace Meautrix.Services
{
    public class ProcedimentoService : IProcedimentoService
    {
        private readonly IProcedimentoRepository _procedimentoRepository;

        public ProcedimentoService(IProcedimentoRepository procedimentoRepository)
        {
            _procedimentoRepository = procedimentoRepository;
        }

        // Mapeia entidade para DTO de resposta, garantindo o nome UsuEAdmin no JSON
        private static ProcedimentoResponseDTO MapToDTO(Procedimento p) => new()
        {
            ProcId = p.ProcId,
            ProcNome = p.ProcNome,
            ProcDescricao = p.ProcDescricao,
            ProcDuracaoMinutos = p.ProcDuracaoMinutos,
            ProcValor = p.ProcValor,
            ProcAtivo = p.ProcAtivo
        };


        public async Task<IEnumerable<ProcedimentoResponseDTO>> BuscarTodosAsync()
        {
            var lista = await _procedimentoRepository.BuscarTodosAtivosAsync();
            return lista.Select(MapToDTO);
        }

        public async Task<ProcedimentoResponseDTO?> BuscarPorIdAsync(int id)
        {
            var procedimento = await _procedimentoRepository.BuscarPorIdAsync(id);
            if (procedimento == null || procedimento.ProcAtivo == "I")
                return null;
            return MapToDTO(procedimento);
        }

        public async Task<ProcedimentoResponseDTO?> BuscarPorNomeAsync(string nome)
        {
            var procedimento = await _procedimentoRepository.BuscarPorNomeAsync(nome);
            if (procedimento == null)
                return null;
            return MapToDTO(procedimento);
        }

        public async Task<ProcedimentoResponseDTO?> BuscarPorDescricaoAsync(string descricao)
        {
            var procedimento = await _procedimentoRepository.BuscarPorDescricaoAsync(descricao);
            if (procedimento == null)
                return null;
            return MapToDTO(procedimento);
        }


        public async Task CriarAsync(ProcedimentoCriarDTO dto)
        {
            ValidarDuracao(dto.ProcDuracaoMinutos);
            ValidarValor(dto.ProcValor);
            await ValidarDescricaoUnicaAsync(dto.ProcDescricao);

            var ativo = (dto.ProcAtivo == "I") ? "I" : "A";

            var novoProcedimento = new Procedimento
            {
                ProcDescricao = dto.ProcDescricao,
                ProcNome = dto.ProcNome,
                ProcDuracaoMinutos = dto.ProcDuracaoMinutos,
                ProcValor = dto.ProcValor,
                ProcAtivo = ativo
            };

            await _procedimentoRepository.InserirAsync(novoProcedimento);
        }

        public async Task<string?> AlterarAsync(int id, ProcedimentoAlterarDTO dto)
        {
            var procedimento = await _procedimentoRepository.BuscarPorIdAsync(id);
            if (procedimento == null)
                throw new KeyNotFoundException("Procedimento não encontrado.");

            await ValidarDescricaoUnicaAsync(dto.ProcDescricao, id);

            ValidarDuracao(dto.ProcDuracaoMinutos);
            ValidarValor(dto.ProcValor);
            var aviso = await AvisoDuracaoAsync(procedimento, dto.ProcDuracaoMinutos);

            // Converte string → char; padrão: 'N'
            var novoAtivo = (dto.ProcAtivo == "I") ? 'I' : 'A';


            // Aplica as alterações
            procedimento.ProcDescricao = dto.ProcDescricao;
            procedimento.ProcNome = dto.ProcNome;
            procedimento.ProcDuracaoMinutos = dto.ProcDuracaoMinutos;
            procedimento.ProcValor = dto.ProcValor;
            procedimento.ProcAtivo = dto.ProcAtivo;


            await _procedimentoRepository.AlterarAsync(procedimento);
            return aviso;
        }

        public async Task<string?> AlterarParcialAsync(int id, ProcedimentoAlterarParcialDTO dto)
        {
            var procedimentoExistente = await _procedimentoRepository.BuscarPorIdAsync(id);

            if (procedimentoExistente == null || (procedimentoExistente.ProcAtivo == "I" && dto.ProcAtivo != "A"))
            {
                throw new KeyNotFoundException("Procedimento não encontrado ou inativo no sistema.");
            }

            if (dto.ProcValor.HasValue) ValidarValor(dto.ProcValor);

            if (dto.ProcDuracaoMinutos.HasValue)
                ValidarDuracao(dto.ProcDuracaoMinutos.Value);
            var aviso = dto.ProcDuracaoMinutos.HasValue
                ? await AvisoDuracaoAsync(procedimentoExistente, dto.ProcDuracaoMinutos.Value) : null;

            if (!string.IsNullOrEmpty(dto.ProcDescricao))
            {
                await ValidarDescricaoUnicaAsync(dto.ProcDescricao, id);
                procedimentoExistente.ProcDescricao = dto.ProcDescricao;
            }
            if (!string.IsNullOrEmpty(dto.ProcNome)) procedimentoExistente.ProcNome = dto.ProcNome;
            if (!string.IsNullOrEmpty(dto.ProcAtivo)) procedimentoExistente.ProcAtivo = dto.ProcAtivo;
            if (dto.ProcDuracaoMinutos.HasValue) procedimentoExistente.ProcDuracaoMinutos = dto.ProcDuracaoMinutos.Value;


            if (dto.ProcValor.HasValue) procedimentoExistente.ProcValor = dto.ProcValor.Value;

            await _procedimentoRepository.AlterarAsync(procedimentoExistente);
            return aviso;
        }

        private async Task<string?> AvisoDuracaoAsync(Procedimento procedimento, int minutos)
        {
            if (procedimento.ProcDuracaoMinutos == minutos) return null;
            var agora = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"));
            if (!await _procedimentoRepository.TemAgendamentosComDuracaoAnteriorAsync(procedimento.ProcId, minutos, agora))
                return null;
            return procedimento.ProcDuracaoMinutos.HasValue
                ? "A duração foi alterada. Há agendamentos futuros com a duração anterior; o tempo reservado foi mantido. Revise esses agendamentos antes de ajustar a duração para não impactar a agenda dos outros clientes."
                : "A duração foi cadastrada. Há agendamentos futuros deste procedimento que precisam ser revisados. Confira a duração e os horários reservados para não impactar a agenda dos outros clientes.";
        }

        private static void ValidarValor(decimal? valor)
        {
            if (!valor.HasValue)
                throw new InvalidOperationException("Informe o valor do procedimento.");
            if (valor < 0 || valor > 99999999.99m || decimal.Round(valor.Value, 2) != valor.Value)
                throw new InvalidOperationException("Informe um valor entre R$ 0,00 e R$ 99.999.999,99, com até duas casas decimais.");
        }

        private static void ValidarDuracao(int minutos)
        {
            if (minutos <= 0)
                throw new InvalidOperationException("Informe a duração em minutos, maior que zero.");
        }

        private async Task ValidarDescricaoUnicaAsync(string descricao, int? idIgnorado = null)
        {
            if (await _procedimentoRepository.ExisteDescricaoAsync(descricao, idIgnorado))
                throw new InvalidOperationException("Já existe um procedimento com esta descrição.");
        }

        public async Task InativarAsync(int id)
        {
            var procedimento = await _procedimentoRepository.BuscarPorIdAsync(id);

            if (procedimento == null || procedimento.ProcAtivo == "I")
            {
                throw new KeyNotFoundException("Procedimento não encontrado ou já inativado.");
            }

            procedimento.ProcAtivo = "I";
            await _procedimentoRepository.AlterarAsync(procedimento);
        }
    }
}
