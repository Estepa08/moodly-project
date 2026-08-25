/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          strong: 'hsl(var(--primary-strong))',
          muted: 'hsl(var(--primary-muted))',
          dim: 'hsl(var(--primary-dim))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          strong: 'hsl(var(--accent-strong))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          strong: 'hsl(var(--destructive-strong))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        pet: {
          1: 'hsl(var(--pet-1))',
          2: 'hsl(var(--pet-2))',
          3: 'hsl(var(--pet-3))',
          4: 'hsl(var(--pet-4))',
          5: 'hsl(var(--pet-5))',
          6: 'hsl(var(--pet-6))',
          7: 'hsl(var(--pet-7))',
          8: 'hsl(var(--pet-8))',
          9: 'hsl(var(--pet-9))',
          10: 'hsl(var(--pet-10))',
          11: 'hsl(var(--pet-11))',
          12: 'hsl(var(--pet-12))',
          13: 'hsl(var(--pet-13))',
          14: 'hsl(var(--pet-14))',
          15: 'hsl(var(--pet-15))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '3xl': '1rem',
        '4xl': '1.25rem',
      },
      fontFamily: {
        sans: ['Golos Text', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Source Serif 4', 'system-ui', '-apple-system', 'serif'],
        serif: ['Source Serif 4', 'system-ui', '-apple-system', 'serif'],
        heading: ['Source Serif 4', 'system-ui', '-apple-system', 'serif'],
        // Третий, служебный регистр — только для мета-данных (даты, счётчики,
        // подписи периода), см. components/ui/eyebrow.tsx. Не используется
        // для основного текста.
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        /* Тихий кабинет: ни одной настоящей смеси цветов — плоская заливка через токен.
           card-gradient несёт ещё едва заметное бумажное зерно (alpha-шум,
           не влияет на контраст текста, который рендерится отдельным слоем поверх). */
        'card-gradient':
          "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMDAnIGhlaWdodD0nMjAwJz4KPGZpbHRlciBpZD0nbic+PGZlVHVyYnVsZW5jZSB0eXBlPSdmcmFjdGFsTm9pc2UnIGJhc2VGcmVxdWVuY3k9JzAuOScgbnVtT2N0YXZlcz0nMicgc3RpdGNoVGlsZXM9J3N0aXRjaCcvPjxmZUNvbG9yTWF0cml4IHR5cGU9J3NhdHVyYXRlJyB2YWx1ZXM9JzAnLz48L2ZpbHRlcj4KPHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsdGVyPSd1cmwoI24pJyBvcGFjaXR5PScwLjAzNScvPgo8L3N2Zz4='), linear-gradient(180deg, hsl(var(--card)), hsl(var(--card)))",
        'btn-gradient': 'linear-gradient(180deg, hsl(var(--primary)), hsl(var(--primary)))',
        'btn-gradient-hot': 'linear-gradient(180deg, hsl(var(--accent)), hsl(var(--accent)))',
      },
      boxShadow: {
        'neumorphic-sm': 'var(--elevation-1)',
        neumorphic: 'var(--elevation-2)',
        'neumorphic-lg': 'var(--elevation-3)',
        'neumorphic-xl': 'var(--elevation-4)',
        'neumorphic-inset': 'var(--elevation-inset)',
        'elevation-1': 'var(--elevation-1)',
        'elevation-2': 'var(--elevation-2)',
        'elevation-3': 'var(--elevation-3)',
        'elevation-4': 'var(--elevation-4)',
        'elevation-inset': 'var(--elevation-inset)',
        clay: 'var(--clay-shadow)',
        'clay-lg': 'var(--clay-shadow-lg)',
      },
      transitionTimingFunction: {
        // Сигнатурный тайминг интерфейсной "хромы" (карточки, кнопки, чипы):
        // элементы оседают на место, а не подпрыгивают — pet-* keyframes
        // (bounce/spring) намеренно остаются другим, "живым" регистром
        // компаньона и этим правилом не покрываются.
        settle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
