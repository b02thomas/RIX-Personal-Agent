/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // Existing shadcn/ui colors
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                
                // RIX Design System Colors
                rix: {
                    // Primary brand colors
                    'bg-primary': 'var(--rix-bg-primary)',
                    'bg-secondary': 'var(--rix-bg-secondary)',
                    'surface': 'var(--rix-surface)',
                    'accent-primary': 'var(--rix-accent-primary)',
                    'accent-hover': 'var(--rix-accent-hover)',
                    
                    // Text hierarchy
                    'text-primary': 'var(--rix-text-primary)',
                    'text-secondary': 'var(--rix-text-secondary)',
                    'text-tertiary': 'var(--rix-text-tertiary)',
                    'text-quaternary': 'var(--rix-text-quaternary)',
                    
                    // Borders
                    'border-primary': 'var(--rix-border-primary)',
                    'border-secondary': 'var(--rix-border-secondary)',
                    
                    // Semantic colors
                    'success': 'var(--rix-success)',
                    'warning': 'var(--rix-warning)',
                    'error': 'var(--rix-error)',
                    'info': 'var(--rix-info)',
                    
                    // AI personality colors
                    'ai-primary': 'var(--rix-ai-primary)',
                    'ai-success': 'var(--rix-ai-success)',
                    'ai-insight': 'var(--rix-ai-insight)',
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            spacing: {
                'sidebar-expanded': 'var(--sidebar-width-expanded)',
                'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
            },
            transitionDuration: {
                'fast': 'var(--animation-fast)',
                'normal': 'var(--animation-normal)',
                'slow': 'var(--animation-slow)',
            },
            transitionTimingFunction: {
                'ease': 'var(--easing-ease)',
                'spring': 'var(--easing-spring)',
            },
            boxShadow: {
                'rix-sm': 'var(--rix-shadow-sm)',
                'rix-md': 'var(--rix-shadow-md)',
                'rix-lg': 'var(--rix-shadow-lg)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms"), require("@tailwindcss/typography")],
} 