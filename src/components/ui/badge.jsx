import * as React from "react"
    import { cva } from "class-variance-authority";

    import { cn } from "@/lib/utils"

    const badgeVariants = cva(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      {
        variants: {
          variant: {
            default:
              "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            secondary:
              "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive:
              "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            outline: "text-foreground",
            green: "border-transparent bg-green-500 text-green-50",
            yellow: "border-transparent bg-yellow-500 text-yellow-50",
            blue: "border-transparent bg-blue-500 text-blue-50",
            gray: "border-transparent bg-gray-500 text-gray-50",
          },
        },
        defaultVariants: {
          variant: "default",
        },
      }
    )

    function Badge({ className, variant, ...props }) {
      return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
    }

    export { Badge, badgeVariants }