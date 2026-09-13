using Meautrix.DTO.Medida;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Repository;

namespace Meautrix.Services
{
    public class MedidaService : IMedidaService
    {
        private readonly IMedidaRepository _medidaRepository; 

        public MedidaService(IMedidaRepository medidaRepository)
        {
            _medidaRepository = medidaRepository;
        }

        // Mapeia entidade para DTO de resposta, garantindo o nome UsuEAdmin no JSON
        private static MedidaResponseDTO MapToDTO(Medida m) => new()
        {
            MedDescricao = m.MedDescricao,
            MedSigla     = m.MedSigla,
            MedAtivo     = m.MedAtivo
        };


        public async Task<IEnumerable<MedidaResponseDTO>> BuscarTodosAsync()
        {
            var lista = await _medidaRepository.BuscarTodosAtivosAsync();
            return lista.Select(MapToDTO);
        }

        public async Task<MedidaResponseDTO?> BuscarPorIdAsync(int id)
        {
            var cliente = await _medidaRepository.BuscarPorIdAsync(id);
            if (cliente == null || cliente.MedAtivo == "I")
                return null;
            return MapToDTO(cliente);
        }

        public async Task<MedidaResponseDTO?> BuscarPorSiglaAsync(string sigla)
        {
            var medida = await _medidaRepository.BuscarPorSiglaAsync(sigla);
            if (medida == null)
                return null;
            return MapToDTO(medida);
        }

        public async Task<MedidaResponseDTO?> BuscarPorDescricaoAsync(string descricao)
        {
            var medida = await _medidaRepository.BuscarPorSiglaAsync(descricao);
            if (medida == null)
                return null;
            return MapToDTO(medida);
        }


        public async Task CriarAsync(MedidaCriarDTO dto)
        {
           
            var ativo = (dto.MedAtivo  == "I") ? "I" : "A";

            var novaMedida = new Medida
            {
                MedDescricao  = dto.MedDescricao,
                MedSigla = dto.MedSigla,
                MedAtivo = ativo
            };

            await _medidaRepository.InserirAsync(novaMedida);
        }

        public async Task AlterarAsync(int id, MedidaAlterarDTO dto)
        {
            var medida = await _medidaRepository.BuscarPorIdAsync(id);
            if (medida == null)
                throw new KeyNotFoundException("Medida não encontrada.");

            // Converte string → char; padrão: 'N'
            var novoAtivo = (dto.MedAtivo  == "I") ? 'I' : 'A';


            // Aplica as alterações
            medida.MedDescricao  = dto.MedDescricao;
            medida.MedSigla  = dto.MedSigla;
            medida.MedAtivo = dto.MedAtivo;


            await _medidaRepository.AlterarAsync(medida);
        }

        public async Task AlterarParcialAsync(int id, MedidaAlterarParcialDTO dto)
        {
            var medidaExistente = await _medidaRepository.BuscarPorIdAsync(id);

            if (medidaExistente == null || medidaExistente.MedAtivo == "I")
            {
                throw new KeyNotFoundException("Medida não encontrada ou inativa no sistema.");
            }

            if (!string.IsNullOrEmpty(dto.MedDescricao)) medidaExistente.MedDescricao = dto.MedDescricao;
            if (!string.IsNullOrEmpty(dto.MedSigla)) medidaExistente.MedSigla = dto.MedSigla;
            if (!string.IsNullOrEmpty(dto.MedAtivo)) medidaExistente.MedAtivo = dto.MedAtivo;
   

            await _medidaRepository.AlterarAsync(medidaExistente);
        }

        public async Task InativarAsync(int id)
        {
            var medida = await _medidaRepository.BuscarPorIdAsync(id);

            if (medida == null || medida.MedAtivo == "I")
            {
                throw new KeyNotFoundException("Medida não encontrada ou já inativado.");
            }

            medida.MedAtivo = "I";
            await _medidaRepository.AlterarAsync(medida);
        }
    }
}