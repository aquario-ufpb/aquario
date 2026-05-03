import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Mail, Users, Search, Zap, Github } from "lucide-react";
import Image from "next/image";
import { ContributeOnGitHub } from "@/components/shared/contribute-on-github";
import { HeroSection } from "@/components/pages/sobre/hero-section";
import { ContactButton } from "@/components/pages/sobre/contact-button";
import { WaterTransitionSection } from "@/components/pages/landing/water-transition-section";

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
    <main className="relative overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <HeroSection />

      <WaterTransitionSection>
        {/* Problem Statement */}
        <section>
          <div className="mx-auto max-w-6xl">
            <header className="mb-12 text-center">
              <h2 className="font-display text-4xl font-bold text-white md:text-5xl">
                O problema que resolvemos
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sky-100">
                O Aquário nasceu para diminuir ruído, aproximar pessoas e transformar informação
                espalhada em caminhos claros para estudantes do CI.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Before Card */}
              <Card className="border-white/10 bg-white/[0.04] shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <h3 className="mb-6 text-xl font-semibold text-white/80">Antes do Aquário</h3>
                  <ul className="space-y-5">
                    {problemsBefore.map(item => (
                      <li key={item.text} className="flex items-start gap-4">
                        <item.icon className="mt-1 h-5 w-5 flex-shrink-0 text-sky-200" />
                        <span className="text-base leading-relaxed text-sky-50">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* After Card */}
              <Card className="border-white/10 bg-white/[0.07] shadow-sm">
                <CardContent className="p-6 md:p-8">
                  <h3 className="mb-6 text-xl font-semibold text-white">Com o Aquário</h3>
                  <ul className="space-y-5">
                    {problemsAfter.map(item => (
                      <li key={item.text} className="flex items-start gap-4">
                        <item.icon className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-200" />
                        <span className="text-base leading-relaxed text-sky-50">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="pt-20">
          <Card className="mx-auto max-w-4xl border-white/10 bg-white text-slate-800 shadow-sm dark:bg-white/[0.05] dark:text-sky-50">
            <CardContent className="space-y-6 p-6 text-center md:p-10">
              <h2 className="font-display text-4xl font-bold text-aquario-primary dark:text-white">
                Funcionalidades
              </h2>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-sky-100 md:text-xl">
                O Aquário é uma plataforma em constante evolução, desenvolvida para centralizar e
                organizar informações essenciais para a comunidade acadêmica do Centro de
                Informática da UFPB. Nosso objetivo é facilitar o acesso a oportunidades, projetos,
                laboratórios e recursos educacionais, criando um hub completo onde alunos,
                professores e laboratórios possam se conectar e colaborar.
              </p>
              <p className="text-base leading-relaxed text-slate-600 dark:text-sky-100 md:text-lg">
                Já no ar no semestre <strong>2026.1</strong>: <strong>Guias</strong> com orientações
                sobre cursos e disciplinas, <strong>Entidades</strong> com o diretório completo de
                laboratórios, grupos de pesquisa e ligas acadêmicas, <strong>Projetos</strong> com
                portfólio publicado pela própria comunidade, <strong>Vagas</strong> de estágio e
                pesquisa, <strong>Minhas Disciplinas</strong> para montar seu calendário pessoal a
                partir das turmas do semestre, <strong>Grades Curriculares</strong> interativas,{" "}
                <strong>Calendário Acadêmico</strong> da UFPB, <strong>Mapas</strong> dos prédios do
                CI e <strong>busca global</strong> (Ctrl+K) que cobre toda a plataforma.
              </p>
              <p className="text-base leading-relaxed text-slate-600 dark:text-sky-100 md:text-lg">
                Continuamos trabalhando para expandir o Aquário, com novidades como blog e
                publicações, achados e perdidos, e muito mais a caminho. O Aquário é um projeto open
                source e novas contribuições são sempre bem-vindas!
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Open Source Section */}
        <section className="pt-8">
          <div className="mx-auto max-w-4xl">
            <Card className="rounded-3xl border-white/10 bg-white/[0.05] text-center shadow-sm">
              <CardContent className="space-y-8 p-6 md:p-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-100">
                  <Github className="h-6 w-6" />
                </div>
                <h2 className="font-display text-4xl font-bold text-white">Projeto Open Source</h2>
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-sky-100 md:text-xl">
                  O Aquário é um projeto open source licenciado sob a Licença MIT, e as
                  contribuições são muito bem-vindas! Acreditamos que qualquer pessoa pode
                  contribuir para tornar esta plataforma melhor - seja você um estudante novato no
                  CI, um veterano, ou mesmo alguém de fora da comunidade acadêmica.
                </p>
                <p className="mx-auto max-w-3xl text-base leading-relaxed text-sky-100 md:text-lg">
                  Para começar a contribuir, basta seguir o tutorial detalhado disponível nos
                  arquivos README do repositório. O processo é simples: faça um fork do projeto,
                  crie suas alterações e abra uma Pull Request. Todas as contribuições são revisadas
                  e muito valorizadas!
                </p>

                {/* GitHub Contributors */}
                <div className="pt-6">
                  <p className="mb-6 text-lg font-semibold text-white md:text-xl">
                    Nossos Contribuidores
                  </p>
                  <a
                    href="https://github.com/aquario-ufpb/aquario/graphs/contributors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform hover:scale-105"
                  >
                    <Image
                      src="https://contrib.rocks/image?repo=aquario-ufpb/aquario"
                      alt="Contributors"
                      width={640}
                      height={128}
                      className="mx-auto w-full max-w-2xl rounded-xl"
                    />
                  </a>
                  <p className="mt-4 text-sm text-sky-100/75">
                    Clique para ver todos os contribuidores no GitHub
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <ContributeOnGitHub
                    url="https://github.com/aquario-ufpb/aquario"
                    variant="outline"
                    size="lg"
                    className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  />
                  <ContactButton />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </WaterTransitionSection>
    </main>
  );
}
