// functions/index.js
const {
  firestore: fsV2,
  https: httpsV2,
  scheduler: schedulerV2,
  setGlobalOptions,
} = require('firebase-functions/v2');

const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: 'us-central1' });

// =================================================================
// ATENÇÃO: Função de cálculo desativada.
// O cálculo de comissão agora é feito pelo Frontend (SalesRegister.tsx).
// =================================================================

/*
exports.calculateCommission = fsV2.onDocumentCreated('sales/{saleId}', async (event) => {
  const sale = event.data.data();

  const customCommissionsSnapshot = await db
    .collection('customCommissions')
    .where('passeioId', '==', sale.passeioId)
    .where('dataFim', '==', null)
    .get();

  let commissionRate = null;

  if (!customCommissionsSnapshot.empty) {
    const custom = customCommissionsSnapshot.docs[0].data();
    if (custom.tipoComissao === 'percentual') {
      commissionRate = custom.valor;
    } else {
      await event.data.ref.update({ comissaoCalculada: custom.valor });
      return;
    }
  }

  if (!commissionRate) {
    const tourSnap = await db.collection('tours').doc(sale.passeioId).get();
    const tour = tourSnap.data();
    if (tour?.agenciaId) {
      const agencySnap = await db.collection('agencies').doc(tour.agenciaId).get();
      const agency = agencySnap.data();
      if (agency?.taxaComissaoPersonalizada) commissionRate = agency.taxaComissaoPersonalizada;
    }
  }

  if (!commissionRate) {
    const tourSnap = await db.collection('tours').doc(sale.passeioId).get();
    const tour = tourSnap.data();
    commissionRate = tour?.comissaoPadrao || 10;
  }

  const commission = (sale.valorTotal * commissionRate) / 100;
  await event.data.ref.update({ comissaoCalculada: commission });
});
*/

// =================================================================
// Registrar auditoria quando comissão é alterada
// =================================================================
exports.commissionAudit = fsV2.onDocumentUpdated('tours/{tourId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.comissaoPadrao !== after.comissaoPadrao) {
    await db.collection('commissionAudit').add({
      passeioId: event.params.tourId,
      valorAntigo: before.comissaoPadrao,
      valorNovo: after.comissaoPadrao,
      alteradoPor: after.updatedBy || 'system',
      alteradoPorNome: after.updatedByName || 'Sistema',
      dataAlteracao: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

// =================================================================
// Gerar relatório mensal (execução agendada)
// =================================================================
exports.generateMonthlyReport = schedulerV2.onSchedule(
  { schedule: '0 0 1 * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const salesSnapshot = await db
      .collection('sales')
      .where('dataVenda', '>=', lastMonth)
      .where('status', '==', 'confirmada')
      .get();

    const salesByVendor = {};
    salesSnapshot.forEach((doc) => {
      const sale = doc.data();
      if (!salesByVendor[sale.vendedorId]) {
        salesByVendor[sale.vendedorId] = {
          nome: sale.vendedorNome,
          totalVendas: 0,
          totalComissao: 0,
        };
      }
      salesByVendor[sale.vendedorId].totalVendas += sale.valorTotal;
      salesByVendor[sale.vendedorId].totalComissao += sale.comissaoCalculada;
    });

    await db.collection('reports').add({
      type: 'monthly_commission',
      period: lastMonth.toISOString().slice(0, 7),
      data: salesByVendor,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Relatório mensal gerado com sucesso');
  }
);

// =================================================================
// PROXY — Tábua de Marés API
// Resolve o bloqueio de CORS ao chamar a API externa diretamente
// do frontend. O frontend chama esta function, e ela repassa a
// requisição para a API real (sem restrição de CORS server-side).
// =================================================================

const TABUA_MARE_BASE = 'https://tabuamare.devtu.qzz.io/api/v2';

function fetchExterno(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: 'application/json' } }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            reject(new Error('Resposta inválida da API de marés'));
          }
        });
      })
      .on('error', reject);
  });
}

exports.tabuaMareProxy = httpsV2.onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const path = req.query.path;

  if (!path) {
    res.status(400).json({ error: 'Parâmetro "path" obrigatório. Ex: ?path=states' });
    return;
  }

  if (path.includes('..') || path.includes('//')) {
    res.status(400).json({ error: 'Path inválido' });
    return;
  }

  const url = `${TABUA_MARE_BASE}/${path}`;

  try {
    const { status, data } = await fetchExterno(url);
    res.status(status).json(data);
  } catch (err) {
    console.error('Erro no proxy tabuaMare:', err.message);
    res.status(502).json({ error: 'Falha ao conectar com a API de marés. Tente novamente.' });
  }
});