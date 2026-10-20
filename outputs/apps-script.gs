const NOME_DA_PASTA = 'Fala aí, meu... - Sugestões';
const NOME_DO_ARQUIVO = 'sugestoes-apelidos.csv';

function doPost(e) {
  const dados = JSON.parse(e.postData.contents || '{}');
  const apelido = String(dados.apelido || '').trim();
  if (!apelido) return resposta({ ok: false, erro: 'Apelido vazio.' });

  const pasta = obterPasta();
  const arquivos = pasta.getFilesByName(NOME_DO_ARQUIVO);
  const linha = [apelido, dados.data || new Date().toISOString(), 'Pendente', ''].map(csv);
  if (arquivos.hasNext()) {
    const arquivo = arquivos.next();
    arquivo.setContent(arquivo.getBlob().getDataAsString() + linha.join(',') + '\n');
  } else {
    pasta.createFile(NOME_DO_ARQUIVO, 'Apelido,Data,Status,Observação\n' + linha.join(',') + '\n', MimeType.CSV);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return resposta({ ok: true, mensagem: 'Gerador de apelidos ativo.' });
}

function obterPasta() {
  const pastas = DriveApp.getFoldersByName(NOME_DA_PASTA);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(NOME_DA_PASTA);
}

function csv(valor) {
  return '"' + String(valor).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
}

function resposta(dados) {
  return ContentService.createTextOutput(JSON.stringify(dados)).setMimeType(ContentService.MimeType.JSON);
}
