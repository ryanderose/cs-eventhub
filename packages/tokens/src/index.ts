export const colors = {
  primary: '#1d4ed8',
  secondary: '#14b8a6',
  surface: '#ffffff',
  text: '#0f172a'
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px'
};

export const tailwindConfig = {
  content: ['./apps/**/*.{ts,tsx}', './packages/**/*.{ts,tsx}'],
  preflight: false,
  theme: {
    extend: {
      colors,
      spacing
    }
  }
};
