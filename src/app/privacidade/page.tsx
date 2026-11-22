import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/pages/legal/legal-page";

const description =
  "Como o Aquário (site e aplicativo) coleta, usa, guarda e exclui dados pessoais dos estudantes do Centro de Informática da UFPB.";

export const metadata: Metadata = {
  title: "Política de Privacidade · Aquário",
  description,
  alternates: { canonical: "/privacidade" },
  openGraph: { title: "Política de Privacidade · Aquário", description, url: "/privacidade" },
};

const CONTATO = "aquarioufpb@gmail.com";

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade" updatedAt="22 de novembro de 2026">
      <p>
        O Aquário é uma plataforma open source mantida por estudantes do Centro de Informática (CI)
        da Universidade Federal da Paraíba (UFPB). Esta política vale para o site{" "}
        <Link href="/">aquarioufpb.com</Link> e para o aplicativo Aquário para Android. O Aquário
        não é um sistema oficial da UFPB e não substitui o SIGAA nem outros sistemas da
        universidade.
      </p>
      <p>
        Tratamos dados pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Para
        qualquer dúvida ou pedido sobre seus dados, escreva para{" "}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>

      <h2>Quais dados coletamos</h2>
      <h3>Conta</h3>
      <ul>
        <li>Nome, e-mail institucional (domínio ufpb.br), centro e curso.</li>
        <li>
          Senha, guardada apenas como hash criptográfico. Ninguém da equipe consegue ler sua senha.
        </li>
        <li>Opcionais: foto de perfil, período atual e link do perfil (slug).</li>
      </ul>
      <h3>Vida acadêmica que você informa</h3>
      <ul>
        <li>Disciplinas concluídas e em curso, horários e salas que você cadastra.</li>
        <li>Planejamentos de matrícula que você salva no planejador.</li>
        <li>Vínculos com entidades (laboratórios, ligas, grupos), vagas e projetos que publica.</li>
      </ul>
      <h3>Integração com o SIGAA (opcional)</h3>
      <p>
        Se você conectar sua conta do SIGAA, usamos seu usuário e senha do SIGAA somente durante a
        consulta, sem guardá-los. Guardamos o resultado normalizado: matrícula, currículo,
        coeficiente de rendimento (CRA), notas, turmas, provas e atividades. Esses dados ficam até
        você desconectar o SIGAA, apagar os dados importados ou excluir a conta. O registro técnico
        de cada sincronização (data e resultado, sem conteúdo acadêmico) é apagado após 90 dias.
      </p>
      <h3>Aplicativo</h3>
      <ul>
        <li>
          Notificações push: todas começam desligadas. Se você ligar alguma categoria (prazos, vagas
          ou novidades das entidades), guardamos o identificador de notificação do aparelho, a
          plataforma (Android) e as categorias escolhidas. Sair da conta ou desligar todas as
          categorias remove o aparelho.
        </li>
        <li>Lembretes do calendário e dados para uso sem internet ficam apenas no seu aparelho.</li>
      </ul>
      <h3>Uso e segurança</h3>
      <ul>
        <li>
          No site em produção, usamos o PostHog para estatísticas de uso, registro de erros e
          gravação de sessões de navegação, com o conteúdo dos campos de formulário mascarado.
        </li>
        <li>
          Ações administrativas (como alterar papéis ou excluir contas) ficam num registro de
          auditoria com endereço IP e navegador de quem fez a ação.
        </li>
      </ul>

      <h2>Para que usamos os dados</h2>
      <ul>
        <li>Criar e manter sua conta e mostrar seu perfil público, se você tiver um.</li>
        <li>
          Montar sua grade, calendário, planejador e progresso no curso, inclusive com dados do
          SIGAA, se você conectar.
        </li>
        <li>Mostrar entidades, vagas e projetos e permitir que você publique os seus.</li>
        <li>Enviar e-mails de verificação e recuperação de senha.</li>
        <li>Enviar as notificações push que você ativou.</li>
        <li>Manter a plataforma segura, corrigir erros e entender quais recursos são usados.</li>
      </ul>
      <p>Não vendemos dados pessoais e não os usamos para publicidade.</p>

      <h2>Com quem compartilhamos</h2>
      <p>Somente com os serviços necessários para o Aquário funcionar:</p>
      <ul>
        <li>Vercel: hospedagem do site, da API e de imagens enviadas.</li>
        <li>Provedor de banco de dados PostgreSQL gerenciado, onde ficam as contas e os dados.</li>
        <li>Resend: envio de e-mails transacionais.</li>
        <li>PostHog: estatísticas de uso do site.</li>
        <li>
          Expo e Google Firebase Cloud Messaging: entrega das notificações push do aplicativo.
        </li>
        <li>SIGAA da UFPB: consultado em seu nome, só quando você pede a sincronização.</li>
      </ul>
      <p>
        Seu nome, foto, curso e o que você publica (projetos, vínculos com entidades) podem aparecer
        para outros usuários. Dados acadêmicos e do SIGAA são privados e só você os vê.
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Mantemos os dados enquanto sua conta existir. Ao excluir a conta, os dados pessoais são
        apagados na hora. Registros de auditoria podem permanecer, mas sem nome ou e-mail vinculados
        a você.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode acessar e corrigir seus dados no perfil, desconectar o SIGAA e apagar os dados
        importados a qualquer momento, desligar as notificações e{" "}
        <Link href="/excluir-conta">excluir sua conta</Link>. Para outros pedidos previstos na LGPD
        (confirmação de tratamento, portabilidade, informação sobre compartilhamento), escreva para{" "}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>

      <h2>Crianças</h2>
      <p>
        O Aquário é destinado a estudantes universitários e não é direcionado a menores de 13 anos.
      </p>

      <h2>Mudanças nesta política</h2>
      <p>
        Quando esta política mudar, atualizamos a data no topo da página. Mudanças importantes serão
        avisadas no site ou no aplicativo.
      </p>
    </LegalPage>
  );
}
