// src/components/Button.tsx

// Definindo o tipo das propriedades (props) que o botão vai receber
interface ButtonProps {
  children: React.ReactNode;  // o texto dentro do botão
  variant?: 'primary' | 'secondary';  // opcional, padrão será 'primary'
  onClick?: () => void;      // função opcional quando clicar
}

// Componente Button
export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  // Definindo estilos diferentes para cada variante
  const styles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600'
  };

  return (
    <button
      className={`px-4 py-2 rounded ${styles[variant]} transition-colors`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}