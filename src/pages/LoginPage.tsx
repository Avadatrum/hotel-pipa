// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Footer } from '../components/Footer';
import { auth } from '../services/firebase'; // Importação adicionada
import { 
  Waves, 
  Umbrella, 
  Percent,  
  MessageCircle, 
  ChevronRight,
  TrendingUp,
  Users,
  Key
} from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Preencha todos os campos', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      
      // AGUARDAR O TOKEN ESTAR DISPONÍVEL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar se o usuário está realmente autenticado
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdToken(true);
        console.log('✅ Token obtido com sucesso');
      }
      
      showToast('Bem-vindo de volta! 🌴', 'success');
      navigate('/');
    } catch (error) {
      console.error('❌ Erro de autenticação:', error);
      showToast(error instanceof Error ? error.message : 'Credenciais inválidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Umbrella className="w-5 h-5" />,
      title: "Passeios & Tours",
      description: "Gestão completa de passeios e excursões",
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: <Percent className="w-5 h-5" />,
      title: "Comissões",
      description: "Controle de vendas e comissionamento",
      color: "from-emerald-500 to-green-500"
    },
    {
      icon: <Waves className="w-5 h-5" />,
      title: "Tábua de Maré",
      description: "Previsão atualizada das marés",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "WhatsApp Integrado",
      description: "Compartilhamento automático de informações",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const stats = [
    { icon: <TrendingUp className="w-4 h-4" />, value: "+34%", label: "Vendas este mês" },
    { icon: <Users className="w-4 h-4" />, value: "12", label: "Passeios ativos" },
    { icon: <Key className="w-4 h-4" />, value: "24/7", label: "Gestão integrada" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl dark:bg-blue-600/5"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl dark:bg-cyan-600/5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-6xl">
          {/* Grid Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Lado Esquerdo - Informações */}
            <div className="hidden lg:block space-y-8 animate-fade-in">
              {/* Logo e Título */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-75"></div>
                    <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-4 rounded-2xl shadow-xl">
                      <Waves className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      H<span className="text-blue-600 dark:text-blue-500">Panel</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
                      Sistema de Gestão - Hotel da Pipa
                    </p>
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                  Gerencie seu hotel com inteligência. Controle de passeios, comissões, 
                  e compartilhe informações via WhatsApp com apenas um clique.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800/60 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`}></div>
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} p-2.5 text-white mb-3 shadow-md`}>
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex gap-6 pt-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lado Direito - Formulário */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-slide-up">
                {/* Header do Card */}
                <div className="p-8 pb-6 text-center border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="lg:hidden flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-75"></div>
                      <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-4 rounded-2xl shadow-xl">
                        <Waves className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Acesse sua conta
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Sistema interno - apenas funcionários autorizados
                  </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
                  {/* Campo Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span>E-mail corporativo</span>
                      {focusedField === 'email' && (
                        <span className="text-xs text-blue-500 animate-pulse">digite seu e-mail</span>
                      )}
                    </label>
                    <div className={`relative transition-all duration-300 ${
                      focusedField === 'email' ? 'scale-[1.02]' : ''
                    }`}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl focus:outline-none transition-all duration-300 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        style={{
                          borderColor: focusedField === 'email' 
                            ? 'rgb(59, 130, 246)' 
                            : email 
                              ? 'rgb(34, 197, 94)' 
                              : 'rgb(226, 232, 240)'
                        }}
                        placeholder="seu.nome@hoteldapipa.com"
                        autoFocus
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <svg className={`w-5 h-5 transition-colors duration-300 ${
                          email ? 'text-green-500' : 'text-slate-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Campo Senha */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span>Senha</span>
                      {focusedField === 'password' && (
                        <span className="text-xs text-blue-500 animate-pulse">digite sua senha</span>
                      )}
                    </label>
                    <div className={`relative transition-all duration-300 ${
                      focusedField === 'password' ? 'scale-[1.02]' : ''
                    }`}>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl focus:outline-none transition-all duration-300 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        style={{
                          borderColor: focusedField === 'password' 
                            ? 'rgb(59, 130, 246)' 
                            : password 
                              ? 'rgb(34, 197, 94)' 
                              : 'rgb(226, 232, 240)'
                        }}
                        placeholder="••••••••"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <svg className={`w-5 h-5 transition-colors duration-300 ${
                          password ? 'text-green-500' : 'text-slate-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      {password && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão Login */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Autenticando...
                        </>
                      ) : (
                        <>
                          Entrar no Sistema
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </form>

                {/* Footer do Card */}
                <div className="px-8 pb-6">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      Sistema seguro
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Criptografia SSL
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                      v1.0.1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}