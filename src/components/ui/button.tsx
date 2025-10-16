import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden",
  {
    variants: {
      variant: {
        // Primary - main action buttons
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95 hover:-translate-y-0.5",

        // Destructive - dangerous actions
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 hover:-translate-y-0.5",

        // Secondary - less prominent actions
        secondary: "bg-secondary text-secondary-foreground border border-border shadow-sm hover:bg-secondary/80 active:bg-secondary/90",

        // Outline - subtle emphasis
        outline: "border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/90 dark:bg-input/10 dark:border-input dark:hover:bg-input/30",

        // Ghost - minimal visual weight
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/90 dark:hover:bg-accent/30",

        // Link - text-only actions
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0 focus-visible:underline",

        // Header specific variants
        headerPrimary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95",
        headerSecondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 active:bg-secondary/90",
        headerGhost: "text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:bg-secondary/90",
        headerOutline: "border border-border text-secondary-foreground hover:bg-secondary/50 active:bg-secondary/70",

        // Success variant - uses your success color
        success: "bg-success text-white shadow-sm hover:opacity-90 active:opacity-95 hover:-translate-y-0.5",

        // Warning variant - uses your warning color
        warning: "bg-warning text-white shadow-sm hover:opacity-90 active:opacity-95 hover:-translate-y-0.5",

        // Info variant - uses your info color
        info: "bg-info text-white shadow-sm hover:opacity-90 active:opacity-95 hover:-translate-y-0.5"
      },
      size: {
        xs: "h-7 rounded px-2 text-xs gap-1 has-[>svg]:px-1.5",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 text-base",
        xl: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-lg gap-3",
        icon: "size-9",
        iconSm: "size-8",
        iconLg: "size-10",
        iconXl: "size-12"
      },
      loading: {
        true: "cursor-not-allowed",
        false: ""
      },
      fullWidth: {
        true: "w-full",
        false: ""
      },
      morphLoading: {
        true: "",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
      fullWidth: false,
      morphLoading: false
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  tooltip?: string
  morphLoading?: boolean
}

const LoadingSpinner = ({ size = "sm" }: { size?: "xs" | "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    xs: "size-3",
    sm: "size-4",
    md: "size-5",
    lg: "size-6"
  }

  return (
    <svg
      className={cn("animate-spin", sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

const MorphingLoadingSpinner = ({ colorClass = "border-current opacity-30 border-t-current opacity-75" }: { colorClass?: string }) => {
  return (
    <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
      <div className={cn("absolute inset-0 rounded-full border-2", colorClass.split(' ')[0] || "border-current opacity-25")}></div>
      <div className={cn("absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin", colorClass.split(' ')[1] || "opacity-75")}></div>
    </div>
  );
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    tooltip,
    morphLoading = false,
    fullWidth,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    // Morphing animation classes
    const morphClasses = morphLoading && loading
      ? "!w-12 !h-12 !rounded-full !px-0 shadow-md"
      : ""

    const buttonContent = (
      <>
        {loading && morphLoading ? (
          <MorphingLoadingSpinner />
        ) : loading ? (
          <LoadingSpinner size={size === "xs" ? "xs" : size === "sm" ? "sm" : size === "lg" || size === "xl" ? "lg" : "sm"} />
        ) : leftIcon ? (
          leftIcon
        ) : null}

        {(!loading || !morphLoading) && (
          <span className={cn(loading && "opacity-70")}>
            {loading && loadingText ? loadingText : children}
          </span>
        )}

        {!loading && rightIcon && rightIcon}
      </>
    )

    const button = (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, loading, fullWidth, morphLoading, className }),
          morphClasses,
          morphLoading && loading && "disabled:transform-none"
        )}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    )

    if (tooltip && !isDisabled) {
      return (
        <div className="relative group">
          {button}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {tooltip}
          </div>
        </div>
      )
    }

    return button
  }
)

Button.displayName = "Button"

export { Button, buttonVariants, type ButtonProps }