using Meautrix.DTO.CategoriaProduto;
using Meautrix.DTO.Cliente;
using Meautrix.Entidades;
using Meautrix.Interfaces;
using Meautrix.Repository;

namespace Meautrix.Services
{
    public class ClienteService : IClienteService
    {
        private readonly IClienteRepository _clienteRepository;

        public ClienteService(IClienteRepository clienteRepository)
        {
            _clienteRepository = clienteRepository;
        }

        // Mapeia entidade para DTO de resposta, garantindo o nome UsuEAdmin no JSON
        private static ClienteResponseDTO MapToDTO(Cliente c) => new()
        {
            CliId = c.CliId,
            CliNome = c.CliNome,
            CliGenero = c.CliGenero,
            CliDataNascimento = c.CliDataNascimento,
            CliAtivo = c.CliAtivo,
            CliCpf = c.CliCpf,
            CliEstado = c.CliEstado,
            CliCidade = c.CliCidade,
            CliEndereco = c.CliEndereco,
            CliEnderecoNumero = c.CliEnderecoNumero,
            CliComplemento = c.CliComplemento,
            CliCep = c.CliCep
        };


        public async Task<IEnumerable<ClienteResponseDTO>> BuscarTodosAsync()
        {
            var lista = await _clienteRepository.BuscarTodosAtivosAsync();
            return lista.Select(MapToDTO);
        }

        public async Task<ClienteResponseDTO?> BuscarPorIdAsync(int id)
        {
            var cliente = await _clienteRepository.BuscarPorIdAsync(id);
            if (cliente == null || cliente.CliAtivo == "I")
                return null;
            return MapToDTO(cliente);
        }

        public async Task<ClienteResponseDTO?> BuscarPorCpfAsync(string cpf)
        {
            var cliente = await _clienteRepository.BuscarPorCpfAsync(cpf);
            if (cliente == null)
                return null;
            return MapToDTO(cliente);
        }
        public async Task CriarAsync(ClienteCriarDTO dto)
        {
            var usuarioExistente = await _clienteRepository.BuscarPorCpfAsync(dto.CliCpf);
            if (usuarioExistente != null)
            {
                throw new InvalidOperationException("Já existe um cliente cadastrado com este cpf.");
            }

            var ativo = (dto.CliAtivo == "I") ? "I" : "A";

            var novoCliente = new Cliente
            {
                CliNome = dto.CliNome,
                CliCpf = dto.CliCpf,
                CliGenero = dto.CliGenero,
                CliDataNascimento = dto.CliDataNascimento,
                CliAtivo = ativo,
                CliEstado = dto.CliEstado,
                CliCidade = dto.CliCidade,
                CliEndereco = dto.CliEndereco,
                CliEnderecoNumero = dto.CliEnderecoNumero,
                CliComplemento = dto.CliComplemento,
                CliCep = dto.CliCep
            };

            await _clienteRepository.InserirAsync(novoCliente);
        }

        public async Task AlterarAsync(int id, ClienteAlterarDTO dto)
        {
            var cliente = await _clienteRepository.BuscarPorIdAsync(id);
            if (cliente == null)
                throw new KeyNotFoundException("Cliente não encontrado.");

            // Converte string → char; padrão: 'N'
            var novoAtivo = (dto.CliAtivo == "I") ? 'I' : 'A';


            // Aplica as alterações
            cliente.CliNome = dto.CliNome;
            cliente.CliGenero = dto.CliGenero;
            cliente.CliAtivo = dto.CliAtivo;
            cliente.CliDataNascimento = dto.CliDataNascimento;
            cliente.CliEstado = dto.CliEstado;
            cliente.CliCidade = dto.CliCidade;
            cliente.CliEndereco = dto.CliEndereco;
            cliente.CliEnderecoNumero = dto.CliEnderecoNumero;
            cliente.CliComplemento = dto.CliComplemento;
            cliente.CliCep = dto.CliCep;

            await _clienteRepository.AlterarAsync(cliente);
        }

        public async Task AlterarParcialAsync(int id, ClienteAlterarParcialDTO dto)
        {
            var clienteExistente = await _clienteRepository.BuscarPorIdAsync(id);

            if (clienteExistente == null)
            {
                throw new KeyNotFoundException("Cliente não encontrado.");
            }

            if (!string.IsNullOrEmpty(dto.CliNome)) clienteExistente.CliNome = dto.CliNome;
            if (!string.IsNullOrEmpty(dto.CliGenero)) clienteExistente.CliGenero = dto.CliGenero;
            if (!string.IsNullOrEmpty(dto.CliAtivo)) clienteExistente.CliAtivo = dto.CliAtivo;
            if (!string.IsNullOrEmpty(dto.CliEstado)) clienteExistente.CliEstado = dto.CliEstado;
            if (!string.IsNullOrEmpty(dto.CliCidade)) clienteExistente.CliCidade = dto.CliCidade;
            if (!string.IsNullOrEmpty(dto.CliEndereco)) clienteExistente.CliEndereco = dto.CliEndereco;
            if (!string.IsNullOrEmpty(dto.CliEnderecoNumero)) clienteExistente.CliEnderecoNumero = dto.CliEnderecoNumero;
            if (!string.IsNullOrEmpty(dto.CliComplemento)) clienteExistente.CliComplemento = dto.CliComplemento;
            if (!string.IsNullOrEmpty(dto.CliCep)) clienteExistente.CliCep = dto.CliCep;


            await _clienteRepository.AlterarAsync(clienteExistente);
        }

        public async Task InativarAsync(int id)
        {
            var cliente = await _clienteRepository.BuscarPorIdAsync(id);

            if (cliente == null)
            {
                throw new KeyNotFoundException("Cliente não encontrado.");
            }

            if (cliente.CliAtivo == "I")
            {
                throw new InvalidOperationException("Cliente já está inativado.");
            }

            cliente.CliAtivo = "I";
            await _clienteRepository.AlterarAsync(cliente);
        }
    }
}
