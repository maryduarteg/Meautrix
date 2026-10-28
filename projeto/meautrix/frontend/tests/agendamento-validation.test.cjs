const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const file = path.join(__dirname, '../app/agendamentos/page.tsx')
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
function extract(name) {
  let code
  function visit(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name?.text === name)
      code = node.getText(source)
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(code, name)
  return ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText
}
function form(data) {
  const context = {
    data, salvando: false, procedimentoId: '1', clienteId: '3',
    opcoesProcedimentos: [{ procId: 1 }], opcoesClientes: [{ cliId: 3 }, { cliId: 4 }],
    agendamentos: [], agendamento: undefined,
    duracao: 60, fim: '', usarNovaDuracao: false,
    agoraLocal: () => '2026-10-20T12:00:30',
    erros: {}, pedidos: [],
    setErros(value) { context.erros = typeof value === 'function' ? value(context.erros) : value },
    async onSalvar(value) { context.pedidos.push(value) },
  }
  vm.createContext(context)
  vm.runInContext(extract('ApiError') + extract('terminoLocal') + extract('periodosSobrepostos') + extract('enviar'), context)
  return context
}
const submit = context => {
  context.fim = context.data && context.duracao ? context.terminoLocal(context.data, context.duracao) : ''
  context.agendamentos = context.agendamentos.map(a => ({
    ...a, dataTerminoPrevisto: a.dataTerminoPrevisto ?? context.terminoLocal(a.dataAgendadoPara, a.duracaoMinutos ?? 60),
  }))
  return context.enviar({ preventDefault() {} })
}

test('bloqueia entradas dentro da duração, sobreposição parcial e inclusão de outro intervalo', async () => {
  for (const [data, duracao] of [['2026-10-20T19:30', 30], ['2026-10-20T18:30', 60], ['2026-10-20T18:30', 120]]) {
    const context = form(data)
    context.duracao = duracao
    context.agendamentos = [{ id: 1, clienteId: 4, dataAgendadoPara: '2026-10-20T19:00:00', duracaoMinutos: 60 }]
    await submit(context)
    assert.match(context.erros.dataAgendadoPara, /coincide/)
    assert.equal(context.pedidos.length, 0)
  }
})
test('permite começar no término exato ou terminar no início do próximo', async () => {
  for (const data of ['2026-10-20T20:00', '2026-10-20T18:00']) {
    const context = form(data)
    context.agendamentos = [{ id: 1, clienteId: 4, dataAgendadoPara: '2026-10-20T19:00:00', duracaoMinutos: 60 }]
    await submit(context)
    assert.equal(context.pedidos.length, 1)
  }
})
test('bloqueia sobreposição que atravessa a meia-noite', async () => {
  const context = form('2026-10-21T00:15')
  context.agendamentos = [{ id: 1, clienteId: 4, dataAgendadoPara: '2026-10-20T23:30:00', duracaoMinutos: 60 }]
  await submit(context)
  assert.match(context.erros.dataAgendadoPara, /coincide/)
})
test('não permite agendar procedimento sem duração', async () => {
  const context = form('2026-10-20T19:00')
  context.duracao = null
  await submit(context)
  assert.match(context.erros.procedimentoId, /duração/)
  assert.equal(context.pedidos.length, 0)
})

test('cliente é obrigatório', async () => {
  const context = form('2026-10-20T12:01')
  context.clienteId = ''
  await submit(context)
  assert.match(context.erros.clienteId, /Selecione um cliente/)
  assert.equal(context.pedidos.length, 0)
})
test('bloqueia o mesmo minuto, independentemente do procedimento', async () => {
  const context = form('2026-10-20T12:01')
  context.agendamentos = [{ id: 1, clienteId: 3, procedimentoId: 99, dataAgendadoPara: '2026-10-20T12:01:45' }]
  await submit(context)
  assert.match(context.erros.dataAgendadoPara, /coincide com outro agendamento/)
  assert.equal(context.pedidos.length, 0)
})
test('permite manter o próprio horário na edição', async () => {
  const context = form('2026-10-20T12:01')
  context.agendamento = { id: 1 }
  context.agendamentos = [{ id: 1, clienteId: 3, dataAgendadoPara: '2026-10-20T12:01:00' }]
  await submit(context)
  assert.equal(context.pedidos.length, 1)
})
test('bloqueia outro cliente no mesmo horário', async () => {
  const context = form('2026-10-20T12:01')
  context.agendamentos = [{ id: 1, clienteId: 4, dataAgendadoPara: '2026-10-20T12:01:00' }]
  await submit(context)
  assert.match(context.erros.dataAgendadoPara, /coincide com outro agendamento/)
  assert.equal(context.pedidos.length, 0)
})
test('permite agendamentos em outro dia ou horário', async () => {
  for (const item of [
    { id: 1, clienteId: 4, dataAgendadoPara: '2026-10-20T13:01:00' },
    { id: 1, clienteId: 3, dataAgendadoPara: '2026-10-21T12:01:00' },
  ]) {
    const context = form('2026-10-20T12:01')
    context.agendamentos = [item]
    await submit(context)
    assert.equal(context.pedidos.length, 1)
  }
})
test('bloqueia horário exatamente igual ao atual', async () => {
  const context = form('2026-10-20T12:00:30')
  await submit(context)
  assert.match(context.erros.dataAgendadoPara, /posteriores/)
  assert.equal(context.pedidos.length, 0)
})

test('bloqueia dias e horários passados, inclusive o minuto atual já iniciado', async () => {
  for (const data of ['2026-10-19T23:59', '2026-10-20T11:59', '2026-10-20T12:00']) {
    const context = form(data)
    await submit(context)
    assert.match(context.erros.dataAgendadoPara, /posteriores/)
    assert.equal(context.pedidos.length, 0)
  }
})
test('permite horário futuro hoje e data futura, com cliente obrigatório', async () => {
  for (const data of ['2026-10-20T12:01', '2026-10-21T09:00']) {
    const context = form(data)
    await submit(context)
    assert.equal(Object.keys(context.erros).length, 0)
    assert.equal(context.pedidos.length, 1)
    assert.equal(context.pedidos[0].dataAgendadoPara, data)
    assert.equal(context.pedidos[0].clienteId, 3)
  }
})
test('mostra erros separados para data e procedimento obrigatórios', async () => {
  const context = form('')
  context.procedimentoId = ''
  await submit(context)
  assert.match(context.erros.dataAgendadoPara, /Informe/)
  assert.match(context.erros.procedimentoId, /Selecione/)
  assert.equal(context.pedidos.length, 0)
})
test('mostra no campo a rejeição da API quando o horário expira durante o envio', async () => {
  const context = form('2026-10-20T12:01')
  const ApiError = vm.runInContext('ApiError', context)
  context.onSalvar = async () => { throw new ApiError('Horário passado.', 400, 'dataAgendadoPara') }
  await submit(context)
  assert.equal(context.erros.dataAgendadoPara, 'Horário passado.')
})

test('agendamento cancelado não bloqueia o mesmo período', async () => {
  const context = form('2026-10-20T19:00')
  context.agendamentos = [{ id: 1, cancelado: 'S', clienteId: 4, dataAgendadoPara: '2026-10-20T19:00:00', duracaoMinutos: 60 }]
  await submit(context)
  assert.equal(context.pedidos.length, 1)
})

test('permite ajustar horário de agendamento cancelado sem reservar novamente', async () => {
  const context = form('2026-10-20T19:00')
  context.agendamento = { id: 1, cancelado: 'S' }
  context.agendamentos = [{ id: 2, cancelado: 'N', clienteId: 4, dataAgendadoPara: '2026-10-20T19:00:00', duracaoMinutos: 60 }]
  await submit(context)
  assert.equal(context.pedidos.length, 1)
})
