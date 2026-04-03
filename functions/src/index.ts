// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// =================================================================
// ATENÇÃO: Função de cálculo desativada.
// O cálculo de comissão agora é feito pelo Frontend (SalesRegister.tsx).
// Se ativar isso novamente, ela vai sobrescrever o valor calculado pelo app.
// =================================================================

/*
exports.calculateCommission = functions.firestore
  .document('sales/{saleId}')
  .onCreate(async (snap, context) => {
    const sale = snap.data();
    
    // Buscar comissão personalizada
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
        await snap.ref.update({ comissaoCalculada: custom.valor });
        return;
      }
    }
    
    // Buscar comissão da agência
    if (!commissionRate) {
      const tourSnap = await db.collection('tours').doc(sale.passeioId).get();
      const tour = tourSnap.data();
      
      if (tour?.agenciaId) {
        const agencySnap = await db.collection('agencies').doc(tour.agenciaId).get();
        const agency = agencySnap.data();
        
        if (agency?.taxaComissaoPersonalizada) {
          commissionRate = agency.taxaComissaoPersonalizada;
        }
      }
    }
    
    // Comissão padrão do passeio
    if (!commissionRate) {
      const tourSnap = await db.collection('tours').doc(sale.passeioId).get();
      const tour = tourSnap.data();
      commissionRate = tour?.comissaoPadrao || 10;
    }
    
    const commission = (sale.valorTotal * commissionRate) / 100;
    await snap.ref.update({ comissaoCalculada: commission });
  });
*/

// Registrar auditoria quando comissão é alterada
exports.commissionAudit = functions.firestore
  .document('tours/{tourId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.comissaoPadrao !== after.comissaoPadrao) {
      await db.collection('commissionAudit').add({
        passeioId: context.params.tourId,
        valorAntigo: before.comissaoPadrao,
        valorNovo: after.comissaoPadrao,
        alteradoPor: after.updatedBy || 'system',
        alteradoPorNome: after.updatedByName || 'Sistema',
        dataAlteracao: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Gerar relatório mensal (execução agendada)
exports.generateMonthlyReport = functions.pubsub
  .schedule('0 0 1 * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const salesSnapshot = await db
      .collection('sales')
      .where('dataVenda', '>=', lastMonth)
      .where('status', '==', 'confirmada')
      .get();
    
    const salesByVendor = {};
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      if (!salesByVendor[sale.vendedorId]) {
        salesByVendor[sale.vendedorId] = {
          nome: sale.vendedorNome,
          totalVendas: 0,
          totalComissao: 0
        };
      }
      salesByVendor[sale.vendedorId].totalVendas += sale.valorTotal;
      salesByVendor[sale.vendedorId].totalComissao += sale.comissaoCalculada;
    });
    
    await db.collection('reports').add({
      type: 'monthly_commission',
      period: lastMonth.toISOString().slice(0, 7),
      data: salesByVendor,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Relatório mensal gerado com sucesso');
  });