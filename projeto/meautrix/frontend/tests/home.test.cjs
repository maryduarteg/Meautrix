const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const file = path.join(__dirname, '../app/home/page.tsx')
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const context = vm.createContext({ Intl, Date, AbortSignal, API_URL: 'http://localhost:5139' })
for (const name of ['dataAtual', 'procedimentosDoDia', 'carregarDadosHome']) {
  const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
  assert.ok(declaration, name)
  vm.runInContext(ts.transpileModule(declaration.getText(source), {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText, context)
}

test('home mostra apenas o dia atual, em ordem de horário, sem alterar a lista original', () => {
  const lista = [
    { id: 1, dataAgendadoPara: '2026-10-21T18:00:00' },
    { id: 2, dataAgendadoPara: '2026-10-20T23:59:00' },
    { id: 3, dataAgendadoPara: '2026-10-22T00:00:00' },
    { id: 4, dataAgendadoPara: '2026-10-21T00:00:00' },
    { id: 5, dataAgendadoPara: '2026-10-21T09:30:00' },
  ]
  const original = structuredClone(lista)
  const resultado = context.procedimentosDoDia(lista, '2026-10-21')
  assert.deepEqual(resultado.map(a => a.id), [4, 5, 1])
  assert.deepEqual(lista, original)
  assert.equal(context.procedimentosDoDia(lista, '2026-10-23').length, 0)
})

test('home usa a data de Brasília durante a virada do dia em UTC', () => {
  const NativeDate = Date
  context.Date = class extends NativeDate {
    constructor() { super('2026-10-22T02:59:59Z') }
  }
  assert.equal(context.dataAtual(), '2026-10-21')
  context.Date = class extends NativeDate {
    constructor() { super('2026-10-22T03:00:00Z') }
  }
  assert.equal(context.dataAtual(), '2026-10-22')
  context.Date = NativeDate
})


test('falha na rota do nome não descarta os procedimentos retornados', async () => {
  const lista = [{ id: 1, dataAgendadoPara: '2026-10-21T09:00:00', procedimentoNome: 'Limpeza de pele' }]
  context.fetch = async (url, options) => {
    assert.equal(options.credentials, 'include')
    return url.endsWith('/me')
      ? { ok: false, status: 400 }
      : { ok: true, status: 200, json: async () => lista }
  }
  const [usuario, agenda] = await context.carregarDadosHome(new AbortController().signal)
  assert.equal(usuario.status, 'rejected')
  assert.equal(agenda.status, 'fulfilled')
  assert.deepEqual(agenda.value, lista)
})

test('falha na agenda não descarta o nome do usuário autenticado', async () => {
  context.fetch = async url => url.endsWith('/me')
    ? { ok: true, status: 200, json: async () => ({ usuNome: 'Maria' }) }
    : { ok: false, status: 500 }
  const [usuario, agenda] = await context.carregarDadosHome(new AbortController().signal)
  assert.equal(usuario.status, 'fulfilled')
  assert.equal(usuario.value.usuNome, 'Maria')
  assert.equal(agenda.status, 'rejected')
})

test('recebe nome e agenda e identifica sessão expirada', async () => {
  context.fetch = async url => ({ ok: true, status: 200, json: async () => url.endsWith('/me') ? { usuNome: 'Maria' } : [] })
  const resultados = await context.carregarDadosHome(new AbortController().signal)
  assert.ok(resultados.every(r => r.status === 'fulfilled'))
  context.fetch = async () => ({ ok: false, status: 401 })
  const expirados = await context.carregarDadosHome(new AbortController().signal)
  assert.ok(expirados.every(r => r.status === 'rejected' && r.reason.message === 'sessao-expirada'))
})

test('home omite os cancelados do dia', () => {
  const lista = [
    { id: 1, dataAgendadoPara: '2026-10-21T09:00:00', cancelado: 'S' },
    { id: 2, dataAgendadoPara: '2026-10-21T10:00:00', cancelado: 'N' },
  ]
  assert.deepEqual(context.procedimentosDoDia(lista, '2026-10-21').map(a => a.id), [2])
})
