import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/pages/legal/legal-page";

const description =
  "Como excluir sua conta do Aquário pelo aplicativo ou por e-mail, e o que acontece com seus dados.";

export const metadata: Metadata = {
  title: "Excluir conta · Aquário",
  description,
  alternates: { canonical: "/excluir-conta" },
  openGraph: { title: "Excluir conta · Aquário", description, url: "/excluir-conta" },
};

const CONTATO = "aquarioufpb@gmail.com";
const assunto = encodeURIComponent("Excluir minha conta do Aquário");
const corpo = encodeURIComponent(
  "Olá! Quero excluir minha conta do Aquário.\n\nE-mail da conta: \n\nEstou enviando este pedido a partir do e-mail da conta."
);

export default function ExcluirContaPage() {
  return (
    <LegalPage title="Excluir sua conta do Aquário" updatedAt="22 de novembro de 2026">
      <p>
        Você pode excluir sua conta do Aquário (site e aplicativo Aquário para Android) a qualquer
        momento. A exclusão é definitiva e não pode ser desfeita.
      </p>

      <h2>Pelo aplicativo</h2>
      <ol>
        <li>Abra o aplicativo Aquário e entre na sua conta.</li>
        <li>
          Vá em <strong>Perfil</strong> e toque em <strong>Excluir conta</strong>.
        </li>
        <li>Confirme. A conta é excluída na hora e você sai do aplicativo.</li>
      </ol>

      <h2>Sem o aplicativo</h2>
      <p>
        Envie um e-mail para{" "}
        <a href={`mailto:${CONTATO}?subject=${assunto}&body=${corpo}`}>{CONTATO}</a> com o assunto
        &quot;Excluir minha conta do Aquário&quot;, a partir do e-mail cadastrado na conta.
        Confirmamos a identidade pelo remetente e excluímos a conta em até 7 dias, avisando por
        e-mail quando terminar.
      </p>

      <h2>O que é apagado</h2>
      <ul>
        <li>Perfil: nome, e-mail, senha, foto, curso e período.</li>
        <li>Disciplinas, horários, calendário pessoal e planejamentos de matrícula.</li>
        <li>Conexão com o SIGAA e todos os dados acadêmicos importados.</li>
        <li>Vínculos com entidades, inclusive o histórico de membro.</li>
        <li>Aparelhos cadastrados para notificações push e sessões abertas.</li>
        <li>Projetos em que você é o único autor.</li>
      </ul>

      <h2>O que continua</h2>
      <ul>
        <li>
          Projetos feitos com outras pessoas ou entidades continuam publicados, sem você como autor.
        </li>
        <li>Vagas que você publicou por uma entidade continuam em nome da entidade.</li>
        <li>
          Registros de auditoria de segurança podem permanecer, sem nome ou e-mail vinculados a
          você.
        </li>
      </ul>
      <p>
        Se quiser apenas apagar os dados do SIGAA ou desligar notificações, sem excluir a conta,
        isso pode ser feito no perfil. Mais detalhes na{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </LegalPage>
  );
}
