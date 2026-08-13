/** @type {import('tailwindcss').Config} */

// Escala de grises NEUTROS (sin tinte azul/frío). Reemplaza el 'gray' por
// defecto de Tailwind, que tiene matiz azulado y NO cumple la marca.
const escalaNeutra = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#0A0A0A',
  900: '#000000',
  950: '#000000',
}

// Escala amarilla corporativa: re-mapea la familia de azules/cianes de
// Tailwind para que NUNCA se pueda generar una utilidad de color azul.
const escalaAmarillaCorporativa = {
  50: '#FFF7CC',
  100: '#FFF1A8',
  200: '#FFE680',
  300: '#FFDB4D',
  400: '#FFD633',
  DEFAULT: '#FFCC00',
  500: '#FFCC00',
  600: '#E6B800',
  700: '#CC9A00',
  800: '#B38600',
  900: '#997300',
  950: '#664D00',
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores corporativos Mundo Motos
        'mm-black': '#000000',
        'mm-yellow': '#FFCC00',
        'mm-yellow-dark': '#E6B800',
        'mm-yellow-light': '#FFD633',
        
        // Escala de grises (neutros, sin tinte azul)
        'mm-gray': escalaNeutra,
        
        // Colores de estado
        'mm-success': '#10B981',
        'mm-error': '#EF4444',
        'mm-warning': '#F59E0B',
        
        // Alias para compatibilidad
        'primary': '#000000',
        'secondary': '#FFCC00',

        // Purga de marca: los grises por defecto de Tailwind pasan a neutros
        // (cero matiz azulado) y la familia de azules/cianes se re-mapea a la
        // escala amarilla corporativa (cero utilidades azules posibles).
        'gray': escalaNeutra,
        'slate': escalaNeutra,
        'zinc': escalaNeutra,
        'stone': escalaNeutra,
        'neutral': escalaNeutra,
        'blue': escalaAmarillaCorporativa,
        'sky': escalaAmarillaCorporativa,
        'cyan': escalaAmarillaCorporativa,
        'indigo': escalaAmarillaCorporativa,
      },
      backgroundColor: {
        'mm-dark': '#000000',
        'mm-light': '#FFFFFF',
      },
      textColor: {
        'mm-primary': '#000000',
        'mm-secondary': '#FFCC00',
      },
      borderColor: {
        'mm-primary': '#000000',
        'mm-secondary': '#FFCC00',
      },
      ringColor: {
        'mm-primary': '#FFCC00',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '0': '0px',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem',
      },
      borderRadius: {
        'none': '0px',
        'sm': '0.25rem',
        'base': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },
      shadows: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [
    // Custom plugins pueden agregarse aquí
  ],
}
