using Meautrix.DTO.Procedimento;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Repository;

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
            await ValidarDescricaoUnicaAsync(dto.ProcDescricao);

            var ativo = (dto.ProcAtivo == "I") ? "I" : "A";

            var novoProcedimento = new Procedimento
            {
                ProcDescricao = dto.ProcDescricao,
                ProcNome = dto.ProcNome,
                ProcAtivo = ativo
            };

            await _procedimentoRepository.InserirAsync(novoProcedimento);
        }

        public async Task AlterarAsync(int id, ProcedimentoAlterarDTO dto)
        {
            var procedimento = await _procedimentoRepository.BuscarPorIdAsync(id);
            if (procedimento == null)
                throw new KeyNotFoundException("Procedimento não encontrado.");

            await ValidarDescricaoUnicaAsync(dto.ProcDescricao, id);

            // Converte string → char; padrão: 'N'
            var novoAtivo = (dto.ProcAtivo == "I") ? 'I' : 'A';


            // Aplica as alterações
            procedimento.ProcDescricao = dto.ProcDescricao;
            procedimento.ProcNome = dto.ProcNome;
            procedimento.ProcAtivo = dto.ProcAtivo;


            await _procedimentoRepository.AlterarAsync(procedimento);
        }

        public async Task AlterarParcialAsync(int id, ProcedimentoAlterarParcialDTO dto)
        {
            var procedimentoExistente = await _procedimentoRepository.BuscarPorIdAsync(id);

            if (procedimentoExistente == null || procedimentoExistente.ProcAtivo == "I")
            {
                throw new KeyNotFoundException("Procedimento não encontrado ou inativo no sistema.");
            }

            if (!string.IsNullOrEmpty(dto.ProcDescricao))
            {
                await ValidarDescricaoUnicaAsync(dto.ProcDescricao, id);
                procedimentoExistente.ProcDescricao = dto.ProcDescricao;
            }
            if (!string.IsNullOrEmpty(dto.ProcNome)) procedimentoExistente.ProcNome = dto.ProcNome;
            if (!string.IsNullOrEmpty(dto.ProcAtivo)) procedimentoExistente.ProcAtivo = dto.ProcAtivo;


            await _procedimentoRepository.AlterarAsync(procedimentoExistente);
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
