// scripts/migrateUsersToAuth.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBHxPaxpzS-3BE165zcTSP-XDkMi0tG4GM",
  authDomain: "toalhashotel.firebaseapp.com",
  projectId: "toalhashotel",
  storageBucket: "toalhashotel.firebasestorage.app",
  messagingSenderId: "732760736573",
  appId: "1:732760736573:web:ee7548628f87042524fb54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Senha padrão temporária para todos os usuários migrados
const SENHA_TEMPORARIA = 'HotelPipa2024@';

async function migrateUsers() {
  console.log('🔄 Iniciando migração de usuários...\n');
  
  // Buscar todos os usuários do Firestore
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`📊 Total de usuários encontrados: ${users.length}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of users) {
    try {
      console.log(`👤 Processando: ${user.email} (${user.name})`);
      
      // Tentar criar o usuário no Firebase Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          user.email, 
          SENHA_TEMPORARIA
        );
        
        // Atualizar o perfil com o nome
        await updateProfile(userCredential.user, {
          displayName: user.name
        });
        
        // Atualizar o documento no Firestore com o UID do Auth
        await updateDoc(doc(db, 'users', user.id), {
          authUid: userCredential.user.uid,
          migratedAt: new Date().toISOString(),
          tempPassword: SENHA_TEMPORARIA // Remover depois em produção!
        });
        
        console.log(`   ✅ Usuário criado no Auth: ${userCredential.user.uid}`);
        successCount++;
        
      } catch (createError: any) {
        // Se o usuário já existe, tentar fazer login para pegar o UID
        if (createError.code === 'auth/email-already-in-use') {
          console.log(`   ⚠️ Usuário já existe no Auth, vinculando...`);
          
          // Fazer login para pegar o UID
          const signInResult = await signInWithEmailAndPassword(
            auth,
            user.email,
            SENHA_TEMPORARIA
          ).catch(async () => {
            // Se a senha não funcionar, não podemos fazer nada
            console.log(`   ❌ Não foi possível fazer login com senha temporária`);
            return null;
          });
          
          if (signInResult) {
            await updateDoc(doc(db, 'users', user.id), {
              authUid: signInResult.user.uid,
              migratedAt: new Date().toISOString()
            });
            console.log(`   ✅ Vinculado ao UID: ${signInResult.user.uid}`);
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          throw createError;
        }
      }
      
      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`   ❌ Erro ao migrar ${user.email}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 RESULTADO DA MIGRAÇÃO:');
  console.log(`✅ Sucesso: ${successCount} usuários`);
  console.log(`❌ Erros: ${errorCount} usuários`);
  console.log('\n🔐 SENHA TEMPORÁRIA PARA TODOS: ' + SENHA_TEMPORARIA);
  console.log('⚠️ IMPORTANTE: Os usuários devem trocar a senha no primeiro login!');
  
  process.exit(0);
}

// Executar migração
migrateUsers().catch(error => {
  console.error('❌ Erro fatal na migração:', error);
  process.exit(1);
});