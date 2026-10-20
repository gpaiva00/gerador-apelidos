const NOME_DA_PASTA = 'Fala aí, meu... - Sugestões';
const NOME_DO_ARQUIVO = 'sugestoes-apelidos.csv';

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents || '{}');
    const segredo = PropertiesService.getScriptProperties().getProperty('VERCEL_SHARED_SECRET');
    if (!segredo || dados.token !== segredo) return resposta({ ok: false, erro: 'Não autorizado.' });
    if (dados.acao === 'listar-aprovados') return listarAprovados();
    const apelido = validarApelido(dados.apelido);
    const cache = CacheService.getScriptCache();
    if (cache.get('ultima-sugestao')) return resposta({ ok: false, erro: 'Aguarde alguns segundos antes de enviar outra sugestão.' });
    cache.put('ultima-sugestao', '1', 5);

    const pasta = obterPasta();
    const arquivos = pasta.getFilesByName(NOME_DO_ARQUIVO);
    const linha = [apelido, new Date().toISOString(), 'Pendente', ''].map(csv);
    if (arquivos.hasNext()) {
      const arquivo = arquivos.next();
      const conteudo = arquivo.getBlob().getDataAsString();
      if (conteudo.toLowerCase().includes(csv(apelido).toLowerCase())) return resposta({ ok: false, erro: 'Esse apelido já foi sugerido.' });
      arquivo.setContent(conteudo + linha.join(',') + '\n');
    } else {
      pasta.createFile(NOME_DO_ARQUIVO, 'Apelido,Data,Status,Observação\n' + linha.join(',') + '\n', MimeType.CSV);
    }
    return resposta({ ok: true });
  } catch (erro) {
    return resposta({ ok: false, erro: erro.message || 'Sugestão inválida.' });
  }
}

function doGet() {
  return resposta({ ok: false, erro: 'Método não permitido.' });
}

function listarAprovados() {
  const arquivo = obterArquivo();
  if (!arquivo) return resposta({ ok: true, apelidos: [], atualizadoEm: new Date().toISOString() });

  const linhas = parseCsv(arquivo.getBlob().getDataAsString());
  const apelidos = [];
  const vistos = {};
  linhas.slice(1).forEach(linha => {
    const apelido = String(linha[0] || '').trim();
    const status = String(linha[2] || '').trim().toLowerCase();
    const chave = apelido.toLocaleLowerCase('pt-BR');
    if (apelido && status === 'aprovado' && !vistos[chave]) {
      vistos[chave] = true;
      apelidos.push(apelido);
    }
  });
  return resposta({ ok: true, apelidos, atualizadoEm: new Date().toISOString() });
}

function obterPasta() {
  const pastas = DriveApp.getFoldersByName(NOME_DA_PASTA);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(NOME_DA_PASTA);
}

function obterArquivo() {
  const pasta = obterPasta();
  const arquivos = pasta.getFilesByName(NOME_DO_ARQUIVO);
  return arquivos.hasNext() ? arquivos.next() : null;
}

function parseCsv(conteudo) {
  const linhas = [];
  let linha = [];
  let campo = '';
  let entreAspas = false;
  for (let i = 0; i < conteudo.length; i += 1) {
    const caractere = conteudo[i];
    if (caractere === '"') {
      if (entreAspas && conteudo[i + 1] === '"') { campo += '"'; i += 1; }
      else entreAspas = !entreAspas;
    } else if (caractere === ',' && !entreAspas) {
      linha.push(campo); campo = '';
    } else if ((caractere === '\n' || caractere === '\r') && !entreAspas) {
      if (caractere === '\r' && conteudo[i + 1] === '\n') i += 1;
      linha.push(campo); campo = '';
      if (linha.some(valor => valor !== '')) linhas.push(linha);
      linha = [];
    } else campo += caractere;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

function validarApelido(valor) {
  const apelido = String(valor || '').trim().replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ');
  if (!apelido) throw new Error('Apelido vazio.');
  if (apelido.length > 50) throw new Error('O apelido deve ter no máximo 50 caracteres.');
  if (/^[=+\-@]/.test(apelido)) throw new Error('Esse formato de apelido não é permitido.');
  if (!/[\p{L}\p{N}]/u.test(apelido)) throw new Error('O apelido precisa conter letras ou números.');
  return apelido;
}

function csv(valor) {
  return '"' + String(valor).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
}

function resposta(dados) {
  return ContentService.createTextOutput(JSON.stringify(dados)).setMimeType(ContentService.MimeType.JSON);
}
