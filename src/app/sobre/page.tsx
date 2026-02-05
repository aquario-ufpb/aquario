import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Mail, Users, Search, Zap } from "lucide-react";
import { ContributeOnGitHub } from "@/components/shared/contribute-on-github";
import { HeroSection } from "@/components/pages/sobre/hero-section";

const problemsBefore = [
  { icon: AlertCircle, text: "Falta de informação centralizada" },
  { icon: Search, text: "Excesso de locais para buscar informações" },
  { icon: Users, text: "Dificuldade de comunicação entre alunos, professores e laboratórios" },
  { icon: Mail, text: "Vagas perdidas em e-mails" },
  { icon: Zap, text: "Projetos sem visibilidade" },
];

const problemsAfter = [
  { icon: Zap, text: "Informações centralizadas em um só lugar" },
  { icon: Users, text: "Comunicação eficiente e organizada" },
  { icon: Search, text: "Facilidade de acesso a oportunidades" },
  { icon: Mail, text: "Melhor organização de vagas e projetos" },
  { icon: CheckCircle2, text: "Comunidade conectada e colaborativa" },
];

export default function SobrePage() {
  return (
    <main className="relative pt-0">
      {/* Hero Section - Client Component for water ripple effect */}
      <HeroSection />

      {/* Rest of the content */}
      <div className="space-y-0">
        {/* Problem Statement */}
        <section className="w-full p-12 md:p-20 bg-white dark:bg-white/5">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-[#0e3a6c] dark:text-[#C8E6FA]">
                O Problema que Resolvemos
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Before Card */}
              <div>
                <h3 className="text-xl font-semibold mb-8 text-slate-500 dark:text-white/60">
                  Antes do Aquário
                </h3>
                <ul className="space-y-5">
                  {problemsBefore.map((item, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <item.icon className="w-5 h-5 mt-1 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="text-lg leading-relaxed text-slate-700 dark:text-white/90">
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* After Card */}
              <div>
                <h3 className="text-xl font-semibold mb-8 text-slate-500 dark:text-white/60">
                  Com o Aquário
                </h3>
                <ul className="space-y-5">
                  {problemsAfter.map((item, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <item.icon className="w-5 h-5 mt-1 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-lg leading-relaxed text-slate-700 dark:text-white/90">
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="w-full p-12 md:py-16"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--features-bg-start) 0%, var(--features-bg-end) 100%)",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
              :root {
                --features-bg-start: #DCF0FF;
                --features-bg-end: #C8E6FA;
              }
              .dark {
                --features-bg-start: #1a3a5c;
                --features-bg-end: #0f2338;
              }
            `,
            }}
          />
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-display font-bold mb-8 text-center text-[#0e3a6c] dark:text-[#C8E6FA]">
              Funcionalidades
            </h2>
            <div className="space-y-6">
              <p className="text-lg md:text-xl leading-relaxed text-center text-[#0e3a6c] dark:text-[#E5F6FF]">
                O Aquário é uma plataforma em constante evolução, desenvolvida para centralizar e
                organizar informações essenciais para a comunidade acadêmica do Centro de
                Informática da UFPB. Nosso objetivo é facilitar o acesso a oportunidades, projetos,
                laboratórios e recursos educacionais, criando um hub completo onde alunos,
                professores e laboratórios possam se conectar e colaborar.
              </p>
              <p className="text-lg md:text-xl leading-relaxed text-center text-[#0e3a6c] dark:text-[#E5F6FF]">
                A versão atual, lançada no semestre <strong>2025.2</strong>, já conta com as
                funcionalidades de <strong>Guias</strong> e <strong>Entidades</strong> totalmente
                disponíveis. Estes módulos permitem que os alunos encontrem orientações sobre cursos
                e disciplinas, além de explorarem o diretório completo de laboratórios, grupos de
                pesquisa, ligas acadêmicas e outras entidades do CI.
              </p>
              <p className="text-lg md:text-xl leading-relaxed text-center text-[#0e3a6c] dark:text-[#E5F6FF]">
                Estamos trabalhando continuamente para expandir as funcionalidades da plataforma,
                incluindo sistema de vagas, blog e publicações, achados e perdidos, e muito mais. O
                Aquário é um projeto open source e novas contribuições são sempre bem-vindas!
              </p>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="w-full p-12 md:py-16 bg-white dark:bg-white/5">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 text-center rounded-3xl border-slate-200 bg-white/80 dark:bg-white/5 dark:border-2 dark:border-[rgba(208,239,255,0.7)]">
              <CardHeader>
                <CardTitle className="text-4xl font-display font-bold mb-6 text-[#0e3a6c] dark:text-[#C8E6FA]">
                  Projeto Open Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto text-[#0e3a6c] dark:text-[#E5F6FF]">
                  O Aquário é um projeto open source licenciado sob a Licença MIT, e as
                  contribuições são muito bem-vindas! Acreditamos que qualquer pessoa pode
                  contribuir para tornar esta plataforma melhor - seja você um estudante novato no
                  CI, um veterano, ou mesmo alguém de fora da comunidade acadêmica.
                </p>
                <p className="text-base md:text-lg leading-relaxed max-w-3xl mx-auto text-[#0e3a6c] dark:text-[#E5F6FF]">
                  Para começar a contribuir, basta seguir o tutorial detalhado disponível nos
                  arquivos README do repositório. O processo é simples: faça um fork do projeto,
                  crie suas alterações e abra uma Pull Request. Todas as contribuições são revisadas
                  e muito valorizadas!
                </p>

                {/* GitHub Contributors */}
                <div className="pt-6">
                  <p className="text-lg md:text-xl font-semibold mb-6 text-[#0e3a6c] dark:text-[#C8E6FA]">
                    Nossos Contribuidores
                  </p>
                  <a
                    href="https://github.com/aquario-ufpb/aquario/graphs/contributors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform hover:scale-105"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://contrib.rocks/image?repo=aquario-ufpb/aquario"
                      alt="Contributors"
                      className="w-full max-w-2xl mx-auto rounded-xl"
                    />
                  </a>
                  <p className="text-sm mt-4 opacity-70 text-[#0e3a6c] dark:text-[#C8E6FA]">
                    Clique para ver todos os contribuidores no GitHub
                  </p>
                </div>

                <div className="flex justify-center gap-4 flex-wrap pt-4">
                  <ContributeOnGitHub
                    url="https://github.com/aquario-ufpb/aquario"
                    variant="outline"
                    size="lg"
                  />
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <a href="mailto:ralf.ferreira@academico.ufpb.br">Entrar em Contato</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
