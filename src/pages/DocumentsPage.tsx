// src/pages/DocumentsPage.tsx
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../hooks/useToast';
import type { Document } from '../types';

export function DocumentsPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    cat: 'Recepção'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'documents'), orderBy('ts', 'desc')),
      (snapshot) => {
        const items: Document[] = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() } as Document);
        });
        setDocuments(items);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      showToast('⚠️ Arquivo muito grande. Máximo 4MB.', 'warning');
      return;
    }
    setSelectedFile(file);
    setFilePreview(file.name);
  };

  const saveDocument = async () => {
    if (!formData.name) {
      showToast('⚠️ Informe o nome do documento', 'warning');
      return;
    }
    if (!selectedFile) {
      showToast('⚠️ Selecione um arquivo', 'warning');
      return;
    }

    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      
      await addDoc(collection(db, 'documents'), {
        name: formData.name,
        desc: formData.desc,
        cat: formData.cat,
        mime: selectedFile.type,
        filename: selectedFile.name,
        data: base64,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        ts: Date.now()
      });
      
      setFormData({ name: '', desc: '', cat: 'Recepção' });
      setSelectedFile(null);
      setFilePreview('');
      setUploading(false);
      showToast('✅ Documento cadastrado com sucesso!', 'success');
    };
    reader.readAsDataURL(selectedFile);
  };

  const deleteDocument = async (id: string) => {
    if (confirm('⚠️ Tem certeza que deseja excluir este documento?')) {
      await deleteDoc(doc(db, 'documents', id));
      showToast('🗑️ Documento excluído com sucesso!', 'success');
    }
  };

  const viewDocument = (documentItem: Document) => {
    const url = `data:${documentItem.mime};base64,${documentItem.data}`;
    const win = window.open('', '_blank');
    if (documentItem.mime === 'application/pdf') {
      win?.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>${documentItem.name}</title></head>
        <body style="margin:0">
          <iframe src="${url}" style="width:100vw;height:100vh;border:none"></iframe>
        </body>
        </html>
      `);
    } else {
      win?.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>${documentItem.name}</title></head>
        <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0">
          <img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain">
        </body>
        </html>
      `);
    }
    win?.document.close();
  };

  const downloadDocument = (documentItem: Document) => {
    const url = `data:${documentItem.mime};base64,${documentItem.data}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = documentItem.filename || documentItem.name;
    link.click();
    showToast(`📥 Download iniciado: ${documentItem.name}`, 'info');
  };

  const getIcon = (mime: string) => {
    if (mime === 'application/pdf') return '📄';
    if (mime.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Documentos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">📎 Cadastrar Documento</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do documento *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Contrato de prestação de serviços"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <input
                type="text"
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                placeholder="Breve descrição do documento"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
              <select
                value={formData.cat}
                onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>Recepção</option>
                <option>Financeiro</option>
                <option>RH</option>
                <option>Operacional</option>
                <option>Jurídico</option>
                <option>Outro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arquivo *</label>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                onClick={() => document.getElementById('file-input')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileSelect(file);
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <div className="text-3xl mb-2">📎</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Arraste um arquivo ou <strong className="text-blue-600 dark:text-blue-400">clique aqui</strong>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, JPG ou PNG (max 4MB)</p>
                {filePreview && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">✅ {filePreview}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={saveDocument}
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploading ? '⏳ Enviando...' : '💾 Cadastrar Documento'}
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">📂 Documentos Cadastrados</h2>
          
          <div className="mb-3">
            <input
              type="text"
              id="doc-search"
              placeholder="Buscar documento..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onInput={(e) => {
                const search = (e.target as HTMLInputElement).value.toLowerCase();
                const items = document.querySelectorAll('.doc-card');
                items.forEach(item => {
                  const text = item.textContent?.toLowerCase() || '';
                  (item as HTMLElement).style.display = text.includes(search) ? '' : 'none';
                });
              }}
            />
          </div>
          
          {documents.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum documento cadastrado</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {documents.map(documentItem => (
                <div key={documentItem.id} className="doc-card border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getIcon(documentItem.mime)}</div>
                      <div>
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{documentItem.name}</div>
                        {documentItem.desc && <div className="text-xs text-gray-500 dark:text-gray-400">{documentItem.desc}</div>}
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{documentItem.cat}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{documentItem.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => viewDocument(documentItem)}
                        className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 transition-colors"
                        title="Visualizar"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => downloadDocument(documentItem)}
                        className="text-green-500 hover:text-green-700 text-sm px-2 py-1 transition-colors"
                        title="Baixar"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => deleteDocument(documentItem.id!)}
                        className="text-red-500 hover:text-red-700 text-sm px-2 py-1 transition-colors"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}