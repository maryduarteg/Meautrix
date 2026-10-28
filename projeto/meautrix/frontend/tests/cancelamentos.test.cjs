const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const source = fs.readFileSync(path.join(__dirname, '../lib/cancelamentos.ts'), 'utf8')
const context = vm.createContext({ exports: {}, Intl, Date })
vm.runInContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context)
const { hojeLocal, somarDias, intervaloFiltro, filtrarCancelamentos } = context.exports
const hoje = '2026-10-21'
function registro(id, data, cliente = 'Ana Cláudia', procedimento = 'Limpeza de pele', cancelado = 'N') {
  return { id, dataAgendadoPara: data, clienteNome: cliente, procedimentoNome: procedimento, cancelado }
}

test('consulta exclui passado e mantém agendamentos cancelados para reativar', () => {
  const lista = [registro(1, '2026-10-20T23:59:00'), registro(2, '2026-10-21T00:00:00'), registro(3, '2027-01-01T12:00:00', null, 'Botox', 'S')]
  const intervalo = intervaloFiltro(hoje, 'todos', '', '')
  assert.deepEqual(filtrarCancelamentos(lista, hoje, intervalo, '', '').map(a => a.id), [2, 3])
})

test('hoje e amanhã usam datas completas e limites inclusivos', () => {
  const lista = [registro(1, '2026-10-21T00:00:00'), registro(2, '2026-10-21T23:59:59'), registro(3, '2026-10-22T00:00:00'), registro(4, '2026-10-23T00:00:00')]
  assert.deepEqual(filtrarCancelamentos(lista, hoje, intervaloFiltro(hoje, 'hoje', '', ''), '', '').map(a => a.id), [1, 2])
  assert.deepEqual(filtrarCancelamentos(lista, hoje, intervaloFiltro(hoje, 'amanha', '', ''), '', '').map(a => a.id), [3])
})

test('7 e 15 dias incluem hoje e atravessam meses e anos', () => {
  assert.equal(intervaloFiltro(hoje, '7', '', '').fim, '2026-10-27')
  assert.equal(intervaloFiltro(hoje, '15', '', '').fim, '2026-11-04')
  assert.equal(intervaloFiltro('2026-12-28', '7', '', '').fim, '2027-01-03')
  assert.equal(somarDias('2028-02-28', 1), '2028-02-29')
})

test('período aceita intervalo futuro e rejeita passado, datas ausentes ou invertidas', () => {
  assert.equal(intervaloFiltro(hoje, 'periodo', hoje, '2026-11-30').erro, '')
  for (const [inicio, fim] of [['', ''], ['2026-10-20', hoje], ['2026-10-25', hoje], [hoje, '2026-02-30'], [hoje, 'invalid']]) {
    const intervalo = intervaloFiltro(hoje, 'periodo', inicio, fim)
    assert.ok(intervalo.erro)
    assert.equal(filtrarCancelamentos([registro(1, `${hoje}T10:00:00`)], hoje, intervalo, '', '').length, 0)
  }
})

test('combina nome da cliente, procedimento e período ignorando acentos e maiúsculas', () => {
  const lista = [registro(3, '2026-10-23T12:00:00'), registro(2, '2026-10-22T12:00:00'), registro(1, '2026-10-21T12:00:00'), registro(4, '2026-10-21T13:00:00', 'Maria'), registro(5, '2026-10-22T11:00:00', 'Ana Cláudia', 'Botox')]
  const original = structuredClone(lista)
  const resultado = filtrarCancelamentos(lista, hoje, intervaloFiltro(hoje, 'periodo', hoje, '2026-10-22'), ' CLAUDIA ', ' LIMPEZA ')
  assert.deepEqual(resultado.map(a => a.id), [1, 2])
  assert.deepEqual(lista, original)
})

test('data atual usa Brasília inclusive na virada de dia em UTC', () => {
  assert.equal(hojeLocal(new Date('2026-10-22T02:59:59Z')), hoje)
  assert.equal(hojeLocal(new Date('2026-10-22T03:00:00Z')), '2026-10-22')
})
