"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { useEntidades } from "@/lib/client/hooks/use-entidades";
import { vagasService } from "@/lib/client/api/vagas";
import { mapImagePath } from "@/lib/client/api/entidades";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { VagaStepper, VagaProgress } from "@/components/pages/vagas/nova-vaga/vaga-stepper";
import { StepInformacoes } from "@/components/pages/vagas/nova-vaga/step-informacoes";
import { StepDescricao } from "@/components/pages/vagas/nova-vaga/step-descricao";
import { StepProcesso } from "@/components/pages/vagas/nova-vaga/step-processo";
import { StepRevisao } from "@/components/pages/vagas/nova-vaga/step-revisao";
import type { VagaFormData, VagaFormUpdater } from "@/components/pages/vagas/nova-vaga/types";

export default function NovaVagaPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: memberships = [], isLoading: isMembershipsLoading } = useMyMemberships();
  const { data: allEntidades = [], isLoading: isEntidadesLoading } = useEntidades();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<VagaFormData>({
    titulo: "",
    descricao: "",
    tipoVaga: "",
    entidadeId: "",
    areas: [],
    linkInscricao: "",
    dataFinalizacao: "",
    salario: "",
    sobreEmpresa: "",
    responsabilidades: [],
    requisitos: [],
    etapasProcesso: [],
    informacoesAdicionais: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMasterAdmin = user?.papelPlataforma === "MASTER_ADMIN";
  const adminEntidades = useMemo(() => {
    return memberships
      .filter(m => m.papel === "ADMIN" && !m.endedAt)
      .map(m => ({
        id: m.entidade.id,
        nome: m.entidade.nome,
        imagePath: mapImagePath(m.entidade.urlFoto),
      }));
  }, [memberships]);

  const entidadeOptions = isMasterAdmin
    ? allEntidades.map(e => ({ id: e.id, nome: e.name, imagePath: e.imagePath }))
    : adminEntidades;

  const canPostJob = isMasterAdmin || adminEntidades.length > 0;
  const isDataLoading =
    isAuthLoading || isUserLoading || isMembershipsLoading || (isMasterAdmin && isEntidadesLoading);

  useEffect(() => {
    if (!isDataLoading && !canPostJob) {
      router.push("/vagas");
    }
  }, [isDataLoading, canPostJob, router]);

  useEffect(() => {
    if (entidadeOptions.length === 1 && !formData.entidadeId) {
      setFormData(prev => ({ ...prev, entidadeId: entidadeOptions[0].id }));
    }
  }, [entidadeOptions, formData.entidadeId]);

  const handleChange: VagaFormUpdater = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0: {
        if (!formData.titulo.trim()) {
          return "Título é obrigatório.";
        }
        if (!formData.tipoVaga) {
          return "Selecione o tipo de vaga.";
        }
        if (!formData.entidadeId) {
          return "Selecione a entidade.";
        }
        if (!formData.linkInscricao.trim()) {
          return "Link para inscrição é obrigatório.";
        }
        if (!formData.dataFinalizacao) {
          return "Data de encerramento é obrigatória.";
        }
        const hoje = new Date().toISOString().slice(0, 10);
        if (formData.dataFinalizacao < hoje) {
          return "A data de finalização deve ser futura.";
        }
        return null;
      }
      case 1: {
        if (!formData.descricao.trim()) {
          return "Descrição é obrigatória.";
        }
        return null;
      }
      default:
        return null;
    }
  };

  const handleNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    const dataFim = new Date(formData.dataFinalizacao);

    setIsSubmitting(true);
    setError(null);

    try {
      await vagasService.create(
        {
          titulo: formData.titulo.trim(),
          descricao: formData.descricao.trim(),
          tipoVaga: formData.tipoVaga as Exclude<typeof formData.tipoVaga, "">,
          entidadeId: formData.entidadeId,
          areas: formData.areas,
          linkInscricao: formData.linkInscricao.trim(),
          dataFinalizacao: dataFim.toISOString(),
          salario: formData.salario.trim() || null,
          sobreEmpresa: formData.sobreEmpresa.trim() || null,
          responsabilidades: formData.responsabilidades,
          requisitos: formData.requisitos,
          etapasProcesso: formData.etapasProcesso,
          informacoesAdicionais: formData.informacoesAdicionais.trim() || null,
        },
        token
      );
      router.push("/vagas");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro ao publicar a vaga.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDataLoading || !canPostJob) {
    return <Skeleton className="h-screen w-full" />;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepInformacoes
            data={formData}
            onChange={handleChange}
            entidadeOptions={entidadeOptions}
          />
        );
      case 1:
        return <StepDescricao data={formData} onChange={handleChange} />;
      case 2:
        return <StepProcesso data={formData} onChange={handleChange} />;
      case 3:
        return (
          <StepRevisao data={formData} onChange={handleChange} entidadeOptions={entidadeOptions} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-24">
      <div className="container mx-auto max-w-4xl px-6">
        {/* Back button */}
        <div className="pt-8 pb-4">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        {/* Progress bar */}
        <div className="pb-6">
          <VagaProgress currentStep={currentStep} />
        </div>

        {/* Title */}
        <div className="pb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Divulgar Nova Vaga</h1>
          <p className="text-muted-foreground mt-2">
            Preencha as informações abaixo para publicar uma oportunidade no mural.
          </p>
        </div>

        {/* Stepper */}
        <div className="pb-16">
          <VagaStepper
            currentStep={currentStep}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          >
            {renderStep()}
          </VagaStepper>
        </div>
      </div>
    </div>
  );
}
