const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const file = path.join(__dirname, '../app/procedimentos/page.tsx')
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const functions = new Map()
function visit(node) {
  if (ts.isFunctionDeclaration(node) && ['duracaoValida', 'valorValido', 'validateCreate', 'validateEdit'].includes(node.name?.text))
    functions.set(node.name.text, node.getText(source))
  ts.forEachChild(node, visit)
}
visit(source)
function form(value) {
  const data = { procNome: 'Sobrancelha', procDescricao: 'Design', procDuracaoMinutos: value, procValor: '150,00' }
  const context = {
    newProcedimento: { ...data }, editData: { ...data }, selected: { procId: 1 },
    descricaoDuplicada: () => false,
    createErrors: {}, editErrors: {},
    setCreateErrors(errors) { context.createErrors = errors },
    setEditErrors(errors) { context.editErrors = errors },
  }
  vm.createContext(context)
  vm.runInContext(ts.transpileModule([...functions.values()].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context)
  return context
}
test('duração é obrigatória, inteira e positiva no cadastro e na edição', () => {
  for (const value of ['', '0', '-1', '1.5', 'abc', '2147483648']) {
    const context = form(value)
    assert.equal(context.validateCreate(), false)
    assert.equal(context.validateEdit(), false)
    assert.match(context.createErrors.procDuracaoMinutos, /minutos inteiros/)
    assert.match(context.editErrors.procDuracaoMinutos, /minutos inteiros/)
  }
})
test('permite duração em minutos no cadastro e na edição', () => {
  for (const value of ['1', '30', '60', '90']) {
    const context = form(value)
    assert.equal(context.validateCreate(), true)
    assert.equal(context.validateEdit(), true)
  }
})


test('valor obrigatório aceita reais com vírgula ou ponto e até duas casas decimais', () => {
  for (const value of ['0', '0,00', '0.01', '150,50', '99999999.99']) {
    const context = form('60')
    context.newProcedimento.procValor = value
    context.editData.procValor = value
    assert.equal(context.validateCreate(), true, value)
    assert.equal(context.validateEdit(), true, value)
  }
})

test('recusa valor vazio, negativo, inválido, acima do limite ou com casas decimais extras', () => {
  for (const value of ['', ' ', '-0.01', 'abc', 'Infinity', '1e3', '1,234', '100000000', '1.000,00']) {
    const context = form('60')
    context.newProcedimento.procValor = value
    context.editData.procValor = value
    assert.equal(context.validateCreate(), false, value)
    assert.equal(context.validateEdit(), false, value)
    assert.ok(context.createErrors.procValor)
    assert.ok(context.editErrors.procValor)
  }
})
