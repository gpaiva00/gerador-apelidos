const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET;

function json(res, status, body) {
  res.status(status).setHeader('Access-Control-Allow-Origin', 'https://gpaiva00.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('Vary', 'Origin');
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'GET') return json(res, 405, { ok: false, erro: 'Método não permitido.' });
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) return json(res, 500, { ok: false, erro: 'Servidor não configurado.' });

  try {
    const resposta = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ acao: 'listar-aprovados', token: APPS_SCRIPT_SECRET }),
      signal: AbortSignal.timeout(5000)
    });
    const dados = await resposta.json();
    if (!resposta.ok || !dados.ok || !Array.isArray(dados.apelidos)) {
      return json(res, 502, { ok: false, erro: 'Não foi possível carregar os apelidos aprovados.' });
    }
    return json(res, 200, {
      ok: true,
      apelidos: dados.apelidos,
      atualizadoEm: dados.atualizadoEm || new Date().toISOString()
    });
  } catch (erro) {
    console.error('Falha ao carregar apelidos aprovados:', erro);
    return json(res, 502, { ok: false, erro: 'Não foi possível carregar os apelidos aprovados.' });
  }
}
