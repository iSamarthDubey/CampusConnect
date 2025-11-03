import { forwardRef } from "react";
import { clsx } from "clsx";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, Props>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-md border px-3 py-2 text-sm shadow-sm",
        "border-gray-300 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary",
        className
      )}
      {...props}
    />
  );
});

export default Input;
