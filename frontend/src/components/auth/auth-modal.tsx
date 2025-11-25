"use client";

import React, { useState, useEffect } from "react";
import { authApi, LoginRequest, RegisterRequest } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  // Estados para centros e cursos
  const [centros, setCentros] = useState<Array<{ id: string; nome: string; sigla: string }>>([]);
  const [cursos, setCursos] = useState<Array<{ id: string; nome: string }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({ email: "", senha: "" });

  // Register state
  const [registerData, setRegisterData] = useState<RegisterRequest>({
    nome: "",
    email: "",
    senha: "",
    papel: "DISCENTE",
    centroId: "",
    cursoId: "",
    periodo: undefined,
  });

  // Buscar centros quando o modal abre
  useEffect(() => {
    if (isOpen && activeTab === "register" && centros.length === 0) {
      fetchCentros();
    }
  }, [isOpen, activeTab]);

  // Buscar cursos quando centro é selecionado
  useEffect(() => {
    if (registerData.centroId) {
      fetchCursos(registerData.centroId);
    }
  }, [registerData.centroId]);

  const fetchCentros = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch("http://localhost:3001/centros");
      const data = await response.json();
      setCentros(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar centros:", err);
      setCentros([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchCursos = async (centroId: string) => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`http://localhost:3001/centros/${centroId}/cursos`);
      const data = await response.json();
      setCursos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setCursos([]);
    } finally {
      setIsLoadingData(false);
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.login(loginData);
      login(response.accessToken);
      onClose();
      // Reset form
      setLoginData({ email: "", senha: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.register(registerData);
      login(response.accessToken);
      onClose();
      // Reset form
      setRegisterData({
        nome: "",
        email: "",
        senha: "",
        papel: "DISCENTE",
        centroId: "",
        cursoId: "",
        periodo: undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {activeTab === "login" ? "Entrar" : "Criar Conta"}
          </DialogTitle>
          <DialogDescription>
            {activeTab === "login"
              ? "Entre com suas credenciais"
              : "Preencha os dados para criar sua conta"}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "login" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Login
          </Button>
          <Button
            variant={activeTab === "register" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
          >
            Registrar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-senha">Senha</Label>
              <Input
                id="login-senha"
                type="password"
                placeholder="********"
                value={loginData.senha}
                onChange={(e) =>
                  setLoginData({ ...loginData, senha: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Grid 2 colunas para os campos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="register-nome">Nome Completo</Label>
                <Input
                  id="register-nome"
                  type="text"
                  placeholder="Seu nome"
                  value={registerData.nome}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, nome: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="register-senha">Senha (mín. 8 caracteres)</Label>
                <Input
                  id="register-senha"
                  type="password"
                  placeholder="********"
                  minLength={8}
                  value={registerData.senha}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, senha: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-papel">Você é</Label>
                <Select
                  value={registerData.papel}
                  onValueChange={(value: "DISCENTE" | "DOCENTE") =>
                    setRegisterData({ ...registerData, papel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCENTE">Discente</SelectItem>
                    <SelectItem value="DOCENTE">Docente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Centro e Curso em 2 colunas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="register-centro">Centro</Label>
                <Select
                  value={registerData.centroId}
                  onValueChange={(value) => {
                    setRegisterData({ ...registerData, centroId: value, cursoId: "" });
                    setCursos([]); // Limpa cursos ao mudar centro
                  }}
                  disabled={isLoadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingData ? "Carregando..." : "Selecione o centro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {centros.map((centro) => (
                      <SelectItem key={centro.id} value={centro.id}>
                        {centro.sigla} - {centro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-curso">Curso</Label>
                <Select
                  value={registerData.cursoId}
                  onValueChange={(value) =>
                    setRegisterData({ ...registerData, cursoId: value })
                  }
                  disabled={!registerData.centroId || isLoadingData}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !registerData.centroId 
                          ? "Selecione o centro primeiro" 
                          : isLoadingData 
                          ? "Carregando..." 
                          : "Selecione o curso"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Período (apenas para DISCENTE) */}
            {registerData.papel === "DISCENTE" && (
              <div className="space-y-2">
                <Label htmlFor="register-periodo">Período</Label>
                <Select
                  value={registerData.periodo?.toString() || ""}
                  onValueChange={(value) =>
                    setRegisterData({ ...registerData, periodo: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p}º Período
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
