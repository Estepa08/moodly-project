import { cva } from "class-variance-authority";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

/**
 * True, когда запрос упал не от HTTP-статуса (ApiError), а на уровне сети:
 * ERR_CONNECTION_REFUSED / "Failed to fetch" / отказ DNS и т.п. — браузер
 * кидает TypeError. В этом случае операцию можно безопасно перевложить в
 * офлайн-очередь вместо потери данных.
 */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "TypeError") return true;
  return /failed to fetch|networkerror|failed to fetch resource|network/i.test(err.message);
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-[color,background-color,opacity,transform,box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-btn-gradient text-primary shadow-neumorphic-sm hover:shadow-neumorphic hover:brightness-105",
        secondary:
          "bg-secondary text-primary border border-primary/20 shadow-neumorphic-sm hover:shadow-neumorphic",
        ghost: "text-primary hover:bg-secondary",
        outline:
          "border border-primary/70 bg-card text-primary shadow-neumorphic-sm hover:shadow-neumorphic hover:border-primary/70",
        destructive:
          "bg-destructive-strong text-primary shadow-neumorphic-sm hover:shadow-neumorphic hover:brightness-105",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 [&>svg]:w-4 [&>svg]:h-4",
        sm: "h-8 px-3 text-xs [&>svg]:w-4 [&>svg]:h-4",
        lg: "h-11 px-8 text-base [&>svg]:w-5 [&>svg]:h-5",
        icon: "h-10 w-10 [&>svg]:w-4 [&>svg]:h-4",
        "icon-sm": "h-8 w-8 [&>svg]:w-4 [&>svg]:h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
