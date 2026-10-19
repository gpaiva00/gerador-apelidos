const NOME_DA_ABA = 'Sugestões';

function doPost(e) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(NOME_DA_ABA) || planilha.insertSheet(NOME_DA_ABA);
  if (aba.getLastRow() === 0) aba.appendRow(['Apelido', 'Data', 'Status']);
  const dados = JSON.parse(e.postData.contents || '{}');
  aba.appendRow([dados.apelido || '', dados.data || new Date().toISOString(), 'Pendente']);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Gerador de apelidos ativo.');
}
