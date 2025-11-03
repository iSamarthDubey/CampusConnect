import { clsx } from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({ className, variant = "primary", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 focus:ring-primary",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-300",
  } as const;
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
