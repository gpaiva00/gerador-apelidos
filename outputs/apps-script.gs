const NOME_DA_PASTA = 'Fala aí, meu... - Sugestões';
const NOME_DO_ARQUIVO = 'sugestoes-apelidos.csv';

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents || '{}');
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
  return resposta({ ok: true, mensagem: 'Gerador de apelidos ativo.' });
}

function obterPasta() {
  const pastas = DriveApp.getFoldersByName(NOME_DA_PASTA);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(NOME_DA_PASTA);
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
