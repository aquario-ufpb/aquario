"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function EntidadeBackButton() {
  const router = useRouter();

  return (
    <div className="px-6 md:px-8 lg:px-16 pt-8 pb-4">
      <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>
    </div>
  );
}
