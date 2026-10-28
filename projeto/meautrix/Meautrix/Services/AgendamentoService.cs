using Meautrix.DTO.Agendamento;
using Meautrix.Entidades;
using Meautrix.Interfaces;

namespace Meautrix.Services;

public class AgendamentoService(IAgendamentoRepository repository, TimeProvider clock) : IAgendamentoService
{
    private static readonly TimeZoneInfo FusoHorario = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    private static AgendamentoResponseDTO Mapear(Agendamento a)
    {
        var duracao = a.DuracaoMinutos ?? a.Procedimento?.ProcDuracaoMinutos;
        return new()
        {
            Id = a.Id,
            Cancelado = a.Cancelado ?? "N",
            UsuarioCancelouId = a.UsuarioCancelouId,
            DataAgendadoPara = a.DataAgendadoPara,
            DataAgendadoEm = a.DataAgendadoEm,
            DuracaoMinutos = duracao,
            DataTerminoPrevisto = duracao > 0 ? a.DataAgendadoPara.AddMinutes(duracao.Value) : null,
            ProcedimentoId = a.ProcedimentoId,
            ProcedimentoNome = a.Procedimento?.ProcNome ?? string.Empty,
            ClienteId = a.ClienteId,
            ClienteNome = a.Cliente?.CliNome
        };
    }

    public async Task<IEnumerable<AgendamentoResponseDTO>> BuscarTodosAsync() =>
        (await repository.BuscarTodosAsync()).Select(Mapear);

    public async Task<AgendamentoResponseDTO> BuscarPorIdAsync(int id) =>
        Mapear(await repository.BuscarPorIdAsync(id) ??
            throw new KeyNotFoundException("Agendamento não encontrado."));

    public async Task<IEnumerable<AgendamentoResponseDTO>> BuscarParaCancelamentoAsync()
    {
        var hoje = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), FusoHorario).Date;
        return (await repository.BuscarAPartirDeAsync(hoje)).Select(Mapear);
    }

    public async Task<AgendamentoResponseDTO> AlterarCancelamentoAsync(int id, string cancelado, int usuarioId)
    {
        if (usuarioId <= 0 || !await repository.UsuarioAtivoAsync(usuarioId))
            throw new UnauthorizedAccessException("Entre novamente para alterar o cancelamento.");
        if (cancelado != "S" && cancelado != "N")
            throw new InvalidOperationException("Informe S para cancelado ou N para não cancelado.");
        var agendamento = await repository.BuscarPorIdAsync(id)
            ?? throw new KeyNotFoundException("Agendamento não encontrado.");
        var hoje = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), FusoHorario).Date;
        if (agendamento.DataAgendadoPara.Date < hoje)
            throw new InvalidOperationException("Só é possível cancelar ou reativar procedimentos de hoje em diante.");
        if ((agendamento.Cancelado ?? "N") == cancelado) return Mapear(agendamento);
        if (cancelado == "N")
        {
            var duracao = agendamento.DuracaoMinutos ?? agendamento.Procedimento?.ProcDuracaoMinutos;
            if (!duracao.HasValue || duracao <= 0)
                throw new InvalidOperationException("Defina a duração deste agendamento antes de reativar.");
            DateTime fim;
            try { fim = agendamento.DataAgendadoPara.AddMinutes(duracao.Value); }
            catch (ArgumentOutOfRangeException) { throw new InvalidOperationException("A duração excede o limite da data informada."); }
            if (await repository.HaAgendamentosSemDuracaoAsync())
                throw new InvalidOperationException("Há agendamentos ativos sem duração definida. Revise as durações antes de reativar.");
            if (await repository.HorarioOcupadoAsync(agendamento.DataAgendadoPara, fim, id))
                throw new InvalidOperationException("Não é possível reativar: o horário coincide com outro agendamento. Ajuste a data ou o horário na tela de agendamentos.");
        }
        agendamento.Cancelado = cancelado;
        agendamento.UsuarioCancelouId = usuarioId;
        await repository.AlterarCancelamentoAsync(agendamento);
        return Mapear(agendamento);
    }

    public async Task<AgendamentoResponseDTO> CriarAsync(AgendamentoSalvarDTO dto, int usuarioId)
    {
        if (usuarioId <= 0 || !await repository.UsuarioAtivoAsync(usuarioId))
            throw new UnauthorizedAccessException("Entre novamente para realizar o agendamento.");

        var duracao = await ValidarAsync(dto);
        var agendamento = new Agendamento
        {
            DataAgendadoPara = DateTime.SpecifyKind(dto.DataAgendadoPara!.Value, DateTimeKind.Unspecified),
            DataAgendadoEm = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), FusoHorario).DateTime,
            ProcedimentoId = dto.ProcedimentoId,
            ClienteId = dto.ClienteId,
            UsuarioAgendouId = usuarioId,
            DuracaoMinutos = duracao,
            Cancelado = "N"
        };

        await repository.InserirAsync(agendamento);
        return await BuscarPorIdAsync(agendamento.Id);
    }

    public async Task<AgendamentoResponseDTO> AlterarAsync(int id, AgendamentoSalvarDTO dto)
    {
        var agendamento = await repository.BuscarPorIdAsync(id) ??
            throw new KeyNotFoundException("Agendamento não encontrado.");

        var duracao = await ValidarAsync(dto, agendamento);
        agendamento.DataAgendadoPara = DateTime.SpecifyKind(dto.DataAgendadoPara!.Value, DateTimeKind.Unspecified);
        agendamento.ProcedimentoId = dto.ProcedimentoId;
        agendamento.ClienteId = dto.ClienteId;
        agendamento.DuracaoMinutos = duracao;
        await repository.AlterarAsync(agendamento);
        return await BuscarPorIdAsync(id);
    }

    private async Task<int> ValidarAsync(AgendamentoSalvarDTO dto, Agendamento? existente = null)
    {
        if (!dto.DataAgendadoPara.HasValue || dto.DataAgendadoPara.Value == default)
            throw new InvalidOperationException("Informe a data e a hora do procedimento.");
        if (dto.DataAgendadoPara.Value.Kind != DateTimeKind.Unspecified)
            throw new InvalidOperationException("Informe a data e a hora local do procedimento, sem fuso horário.");
        var agora = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), FusoHorario).DateTime;
        if (dto.DataAgendadoPara.Value <= agora)
            throw new InvalidOperationException("Selecione uma data e um horário posteriores ao momento atual.")
            {
                Data = { ["campo"] = "dataAgendadoPara" }
            };
        if (dto.ProcedimentoId <= 0 ||
            (dto.ProcedimentoId != existente?.ProcedimentoId && !await repository.ProcedimentoAtivoAsync(dto.ProcedimentoId)))
            throw new InvalidOperationException("Selecione um procedimento ativo.");
        if (!dto.ClienteId.HasValue || dto.ClienteId.Value <= 0)
            throw new InvalidOperationException("Selecione um cliente.")
            {
                Data = { ["campo"] = "clienteId" }
            };
        if (dto.ClienteId != existente?.ClienteId && !await repository.ClienteAtivoAsync(dto.ClienteId.Value))
            throw new InvalidOperationException("Selecione um cliente ativo.")
            {
                Data = { ["campo"] = "clienteId" }
            };
        var duracao = existente != null && dto.ProcedimentoId == existente.ProcedimentoId && !dto.AtualizarDuracao
            ? existente.DuracaoMinutos : null;
        duracao ??= await repository.BuscarDuracaoProcedimentoAsync(dto.ProcedimentoId);
        if (!duracao.HasValue || duracao.Value <= 0)
            throw new InvalidOperationException("Informe a duração no cadastro deste procedimento antes de agendar.")
            {
                Data = { ["campo"] = "procedimentoId" }
            };
        if (existente?.Cancelado != "S" && await repository.HaAgendamentosSemDuracaoAsync())
            throw new InvalidOperationException("Há agendamentos sem duração definida. Preencha a duração dos procedimentos existentes antes de reservar novos horários.")
            {
                Data = { ["campo"] = "dataAgendadoPara" }
            };
        DateTime fim;
        try { fim = dto.DataAgendadoPara.Value.AddMinutes(duracao.Value); }
        catch (ArgumentOutOfRangeException)
        {
            throw new InvalidOperationException("A duração excede o limite da data informada.")
            {
                Data = { ["campo"] = "dataAgendadoPara" }
            };
        }
        if (existente?.Cancelado != "S" && await repository.HorarioOcupadoAsync(dto.DataAgendadoPara.Value, fim, existente?.Id))
            throw new InvalidOperationException("O período selecionado coincide com outro agendamento. Escolha um horário após o término do procedimento anterior.")
            {
                Data = { ["campo"] = "dataAgendadoPara" }
            };
        return duracao.Value;
    }
}
