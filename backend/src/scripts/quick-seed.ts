import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar Campus
  const campus = await prisma.campus.upsert({
    where: { nome: 'Campus I - João Pessoa' },
    update: {},
    create: {
      nome: 'Campus I - João Pessoa',
    },
  });
  console.log('✅ Campus criado:', campus.nome);

  // Criar Centro
  const centro = await prisma.centro.upsert({
    where: { sigla: 'CI' },
    update: {},
    create: {
      nome: 'Centro de Informática',
      sigla: 'CI',
      descricao: 'Centro de Informática da UFPB',
      campusId: campus.id,
    },
  });
  console.log('✅ Centro criado:', centro.nome);

  // Criar Cursos
  const cursos = [
    'Ciência de Dados e IA',
    'Ciência da Computação',
    'Engenharia da Computação'
  ];

  for (const nomeCurso of cursos) {
    await prisma.curso.upsert({
      where: { nome: nomeCurso },
      update: {},
      create: {
        nome: nomeCurso,
        centroId: centro.id,
      },
    });
    console.log('✅ Curso criado:', nomeCurso);
  }

  const todosCursos = await prisma.curso.findMany({
    where: { centroId: centro.id }
  });

  console.log('\n📦 IDs para usar no registro:');
  console.log('Centro ID:', centro.id);
  console.log('Cursos disponíveis:');
  todosCursos.forEach(c => console.log(`  - ${c.nome}: ${c.id}`));

  console.log('\n🎯 Payload de exemplo para registro:');
  console.log(JSON.stringify({
    nome: "João Silva",
    email: "joao@teste.com",
    senha: "12345678",
    papel: "DISCENTE",
    centroId: centro.id,
    cursoId: todosCursos[0].id,
    periodo: 5
  }, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
