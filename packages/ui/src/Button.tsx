import type { ComponentProps, ReactNode } from "react";

export type ButtonProps = ComponentProps<"button"> & {
  asChild?: boolean;
  children: ReactNode;
};

export function Button({ asChild, children, ...props }: ButtonProps) {
  if (asChild && typeof children === "object" && children !== null) {
    return <span className="eh-button" {...props}>{children}</span>;
  }

  return (
    <button className="eh-button" type="button" {...props}>
      {children}
    </button>
  );
}
