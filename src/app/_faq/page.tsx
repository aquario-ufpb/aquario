"use client";

import CourseCard from "@/components/pages/guias/cousers-card";

export default function Guias() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-black">
      <div className="w-[90%] max-w-4xl bg-gradient-to-r from-[#2E18AA] to-[#B207D4] text-white py-16 px-8 text-left rounded-lg mt-16">
        <h1 className="text-3xl font-bold">FAQs, Documentação e Seletor de cadeiras</h1>
        <p className="mt-2 text-lg">
          Veja as dúvidas mais frequentes, documentos mais importantes, guias e o seletor de
          cadeiras de seu curso
        </p>
      </div>

      <section className="w-full max-w-4xl mt-8 px-4 text-left">
        <h3 className="text-lg font-medium mb-8 text-aquario-primary dark:text-gray-200">
          Selecione o curso
        </h3>
        <h2 className="text-xl font-semibold mb-4 text-aquario-primary dark:text-gray-100">
          Centro de informática
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
          <CourseCard iconName="monitor">Ciências da Computação</CourseCard>
          <CourseCard iconName="gear">Engenharia da Computação</CourseCard>
          <CourseCard iconName="lightbulb">Ciência de Dados e Inteligência Artificial</CourseCard>
        </div>
      </section>
    </main>
  );
}
