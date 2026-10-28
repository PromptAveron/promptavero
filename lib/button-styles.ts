import { cva, type VariantProps } from 'class-variance-authority'

export const btn = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-brand-soft text-brand-text hover:bg-brand-soft/70 dark:hover:bg-primary/25',
        outline: 'border border-border bg-card text-foreground hover:border-primary/40 hover:bg-brand-soft',
        ghost: 'text-foreground hover:bg-muted',
        light: 'bg-white text-[#3d2fb0] hover:bg-white/90',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export type BtnProps = VariantProps<typeof btn>
