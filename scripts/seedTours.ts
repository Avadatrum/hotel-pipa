// scripts/seedTours.js
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBHxPaxpzS-3BE165zcTSP-XDkMi0tG4GM",
  authDomain: "toalhashotel.firebaseapp.com",
  projectId: "toalhashotel",
  storageBucket: "toalhashotel.firebasestorage.app",
  messagingSenderId: "732760736573",
  appId: "1:732760736573:web:ee7548628f87042524fb54"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const toursSeed = [
  { nome: "Passeio de Jeep", precoBase: 120, unidade: "pessoa", tipo: "Jeep", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio de Quadriciclo em Pipa - Litoral Norte ROTA 1", precoBase: 250, unidade: "quadriciclo", tipo: "Quadriciclo", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio de Quadriciclo em Pipa - Litoral Sul ROTA 2", precoBase: 250, unidade: "quadriciclo", tipo: "Quadriciclo", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio de Buggy - Dunas de Genipabu", precoBase: 180, unidade: "pessoa", tipo: "Buggy", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio de Lancha - Costa dos Corais", precoBase: 300, unidade: "pessoa", tipo: "Lancha", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio a Cavalo - Falésias", precoBase: 150, unidade: "pessoa", tipo: "Cavalo", ativo: true, comissaoPadrao: 10 },
  { nome: "Translado Aeroporto → Hotel", precoBase: 200, unidade: "carro", tipo: "Translado", ativo: true, comissaoPadrao: 10 },
  { nome: "Translado Hotel → Aeroporto", precoBase: 200, unidade: "carro", tipo: "Translado", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio de Helicóptero - Vista Panorâmica", precoBase: 800, unidade: "helicóptero", tipo: "Helicóptero", ativo: true, comissaoPadrao: 15 },
  { nome: "City Tour Natal", precoBase: 90, unidade: "pessoa", tipo: "City Tour", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio das Piscinas Naturais", precoBase: 120, unidade: "pessoa", tipo: "Barco", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio de Caiaque - Mangue", precoBase: 80, unidade: "pessoa", tipo: "Caiaque", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio de Stand Up Paddle", precoBase: 70, unidade: "pessoa", tipo: "SUP", ativo: true, comissaoPadrao: 10 },
  { nome: "Observação de Golfinhos", precoBase: 60, unidade: "pessoa", tipo: "Observação", ativo: true, comissaoPadrao: 10 },
  { nome: "Passeio do Pôr do Sol - Falésias", precoBase: 100, unidade: "pessoa", tipo: "Jeep", ativo: true, comissaoPadrao: 10 }
];

async function seedTours() {
  console.log('🌱 Iniciando seed dos passeios...');
  
  for (const tour of toursSeed) {
    try {
      const docRef = await addDoc(collection(db, 'tours'), {
        ...tour,
        agenciaId: null,
        createdAt: Timestamp.now(),
        createdBy: 'system'
      });
      console.log(`✅ Criado: ${tour.nome} (${docRef.id})`);
    } catch (error) {
      console.error(`❌ Erro ao criar ${tour.nome}:`, error);
    }
  }
  
  console.log('🎉 Seed concluído!');
}

seedTours();