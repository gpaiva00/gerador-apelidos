const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET;

function json(res, status, body, methods = 'POST, OPTIONS') {
  res.status(status).setHeader('Access-Control-Allow-Origin', 'https://gpaiva00.github.io');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  return res.status(status).json(body);
}

function validarApelido(valor) {
  const apelido = String(valor || '').trim().replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ');
  if (!apelido) throw new Error('Apelido vazio.');
  if (apelido.length > 50) throw new Error('O apelido deve ter no máximo 50 caracteres.');
  if (/^[=+\-@]/.test(apelido)) throw new Error('Esse formato de apelido não é permitido.');
  if (!/[\p{L}\p{N}]/u.test(apelido)) throw new Error('O apelido precisa conter letras ou números.');
  return apelido;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { ok: false, erro: 'Método não permitido.' });
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) return json(res, 500, { ok: false, erro: 'Servidor não configurado.' });

  try {
    const apelido = validarApelido(req.body?.apelido);
    const resposta = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ apelido, token: APPS_SCRIPT_SECRET })
    });
    const dados = await resposta.json();
    return json(res, dados.ok ? 200 : 400, dados);
  } catch (erro) {
    return json(res, 400, { ok: false, erro: erro.message || 'Sugestão inválida.' });
  }
}
