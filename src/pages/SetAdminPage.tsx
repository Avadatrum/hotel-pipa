// src/pages/SetAdminPage.tsx
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

export function SetAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const setAdminClaim = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const functions = getFunctions();
      const setAdminRole = httpsCallable(functions, 'setAdminRole');
      
      const result = await setAdminRole({ 
        uid: user.id,
        email: user.email,
        name: user.name 
      });
      
      setMessage('✅ Claims de admin setadas com sucesso! Faça logout e login novamente.');
      console.log('Resultado:', result.data);
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
        <h1 className="text-2xl font-bold mb-4">Setar Admin Claims</h1>
        <p className="text-sm text-gray-600 mb-4">
          Usuário atual: {user?.name} ({user?.email})
        </p>
        <button
          onClick={setAdminClaim}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Setar como Admin'}
        </button>
        {message && (
          <p className="mt-4 text-sm p-3 rounded bg-gray-50">{message}</p>
        )}
      </div>
    </div>
  );
}