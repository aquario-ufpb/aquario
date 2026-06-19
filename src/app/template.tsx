import { PageTransition } from "@/components/shared/page-transition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
