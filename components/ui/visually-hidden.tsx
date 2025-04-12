import type * as React from "react";

import { cn } from "@/lib/utils";

const VisuallyHidden = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("sr-only", className)} {...props} />;
};

export { VisuallyHidden };
