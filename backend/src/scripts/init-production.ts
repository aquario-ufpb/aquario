import { PrismaClient, TipoEntidade } from '@prisma/client';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { nomeToSlug } from '../shared/utils/slug';

const prisma = new PrismaClient();

// Map JSON tipo values to database TipoEntidade enum
function mapTipo(jsonTipo: string): TipoEntidade {
  const tipoMap: Record<string, TipoEntidade> = {
    LABORATORIO: TipoEntidade.LABORATORIO,
    GRUPO: TipoEntidade.GRUPO,
    GRUPO_PESQUISA: TipoEntidade.GRUPO,
    GRUPO_ESTUDANTIL: TipoEntidade.GRUPO,
    LIGA_ACADEMICA: TipoEntidade.LIGA_ACADEMICA,
    LIGA_ESTUDANTIL: TipoEntidade.LIGA_ACADEMICA,
    EMPRESA: TipoEntidade.EMPRESA,
    ATLETICA: TipoEntidade.ATLETICA,
    CENTRO_ACADEMICO: TipoEntidade.CENTRO_ACADEMICO,
    OUTRO: TipoEntidade.OUTRO,
  };

  return tipoMap[jsonTipo] || TipoEntidade.OUTRO;
}

interface EntityJson {
  name: string;
  subtitle?: string;
  description?: string;
  tipo: string;
  imagePath?: string;
  contato_email?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  founding_date?: string; // ISO date string or date string
  order?: number;
  people?: Array<{
    name: string;
    email: string;
    role: string;
    profession: string;
  }>;
}

// Define centros and cursos structure
// Add more centros and cursos here as needed
interface CentroConfig {
  nome: string;
  sigla: string;
  cursos: string[];
  folderName: string; // Folder name in aquario-entidades (e.g., "centro-de-informatica")
}

const CENTROS_CONFIG: CentroConfig[] = [
  {
    nome: 'Centro de Informática',
    sigla: 'CI',
    cursos: [
      'Ciência da Computação',
      'Engenharia da Computação',
      'Ciências de Dados e Inteligência Artificial',
    ],
    folderName: 'centro-de-informatica',
  },
  // Add more centros here as needed
  // Example:
  // {
  //   nome: 'Centro de Engenharia',
  //   sigla: 'CE',
  //   cursos: ['Engenharia Civil', 'Engenharia Elétrica'],
  //   folderName: 'centro-de-engenharia',
  // },
];

async function main() {
  console.log('🚀 Iniciando inicialização de dados de produção...\n');

  // Step 1: Create/ensure Campus exists
  console.log('📍 Criando/verificando Campus...');
  const campus = await prisma.campus.upsert({
    where: { nome: 'Campus I - João Pessoa' },
    update: {},
    create: {
      nome: 'Campus I - João Pessoa',
    },
  });
  console.log(`✅ Campus: ${campus.nome} (ID: ${campus.id})\n`);

  // Step 2: Create/update Centros and Cursos
  console.log('🏛️  Criando/atualizando Centros e Cursos...');
  const centroMap = new Map<string, { id: string; nome: string }>();

  for (const centroConfig of CENTROS_CONFIG) {
    // Upsert Centro
    const centro = await prisma.centro.upsert({
      where: { sigla: centroConfig.sigla },
      update: {
        nome: centroConfig.nome,
        campusId: campus.id,
      },
      create: {
        nome: centroConfig.nome,
        sigla: centroConfig.sigla,
        campusId: campus.id,
      },
    });

    centroMap.set(centroConfig.folderName, { id: centro.id, nome: centro.nome });
    console.log(`  ✅ Centro: ${centro.nome} (${centro.sigla})`);

    // Upsert Cursos for this Centro
    for (const cursoNome of centroConfig.cursos) {
      const curso = await prisma.curso.upsert({
        where: {
          nome: cursoNome,
        },
        update: {
          centroId: centro.id, // Update centroId if curso exists but in different centro
        },
        create: {
          nome: cursoNome,
          centroId: centro.id,
        },
      });
      console.log(`    ✅ Curso: ${curso.nome}`);
    }
  }

  console.log(`\n✅ ${CENTROS_CONFIG.length} centros e seus cursos criados/atualizados.\n`);

  // Step 3: Load entidades from all centro folders
  console.log('🏢 Carregando entidades de aquario-entidades...\n');

  const entitiesBaseDir = join(process.cwd(), '../frontend/content/aquario-entidades');

  let totalEntitiesCreated = 0;
  let totalEntitiesSkipped = 0;

  // Iterate through all folders in aquario-entidades
  const folders = readdirSync(entitiesBaseDir).filter(item => {
    const itemPath = join(entitiesBaseDir, item);
    return statSync(itemPath).isDirectory() && item !== 'assets';
  });

  for (const folder of folders) {
    const folderPath = join(entitiesBaseDir, folder);
    const jsonFiles = readdirSync(folderPath).filter(file => file.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.log(`  ⚠️  Pasta '${folder}' não contém arquivos JSON, pulando...`);
      continue;
    }

    // Find matching centro for this folder
    const centroInfo = centroMap.get(folder);
    if (!centroInfo) {
      console.log(`  ⚠️  Pasta '${folder}' não tem centro correspondente configurado, pulando...`);
      continue;
    }

    console.log(`  📁 Processando pasta: ${folder} (${jsonFiles.length} arquivos)`);

    for (const file of jsonFiles) {
      try {
        const filePath = join(folderPath, file);
        const fileContent = readFileSync(filePath, 'utf-8');
        const entityJson: EntityJson = JSON.parse(fileContent);

        // Map JSON to database structure
        const tipo = mapTipo(entityJson.tipo);
        const subtitle = entityJson.subtitle || null;
        const descricao = entityJson.description || null;
        const contato = entityJson.contato_email || null;
        const instagram = entityJson.instagram || null;
        const linkedin = entityJson.linkedin || null;
        const website = entityJson.website || null;
        const location = entityJson.location || null;

        // Parse founding_date if provided
        let foundingDate: Date | null = null;
        if (entityJson.founding_date) {
          const parsed = new Date(entityJson.founding_date);
          if (!isNaN(parsed.getTime())) {
            foundingDate = parsed;
          }
        }

        // Generate slug from filename (e.g., "aria.json" -> "aria")
        const filenameSlug = file.replace(/\.json$/, '');

        // Build metadata object (contains order and slug)
        const metadata: { order?: number; slug?: string } = {};
        if (entityJson.order !== undefined && entityJson.order !== null) {
          metadata.order = entityJson.order;
        }
        // Store slug in metadata (use filename as slug, or generate from name if different)
        const generatedSlug = nomeToSlug(entityJson.name);
        // Prefer filename slug if it's different from generated (custom slug), otherwise use generated
        metadata.slug = filenameSlug !== generatedSlug ? filenameSlug : generatedSlug;

        // Extract image filename from imagePath (e.g., "./assets/ARIA.png" -> "ARIA.png")
        let urlFoto = null;
        if (entityJson.imagePath) {
          const imageMatch = entityJson.imagePath.match(/assets\/(.+)$/);
          if (imageMatch) {
            urlFoto = imageMatch[1];
          }
        }

        // Upsert entidade (using unique constraint on nome + tipo)
        try {
          await prisma.entidade.upsert({
            where: {
              nome_tipo: {
                nome: entityJson.name,
                tipo: tipo,
              },
            },
            update: {
              subtitle,
              descricao,
              urlFoto,
              contato,
              instagram,
              linkedin,
              website,
              location,
              foundingDate,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
              centroId: centroInfo.id,
            },
            create: {
              nome: entityJson.name,
              subtitle,
              descricao,
              tipo,
              urlFoto,
              contato,
              instagram,
              linkedin,
              website,
              location,
              foundingDate,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
              centroId: centroInfo.id,
            },
          });
          totalEntitiesCreated++;
          console.log(`    ✅ ${entityJson.name}`);
        } catch (error) {
          // If upsert fails due to unique constraint, try to find and update
          const existing = await prisma.entidade.findFirst({
            where: {
              nome: entityJson.name,
              tipo: tipo,
            },
          });

          if (existing) {
            await prisma.entidade.update({
              where: { id: existing.id },
              data: {
                subtitle,
                descricao,
                urlFoto,
                contato,
                instagram,
                linkedin,
                website,
                location,
                foundingDate,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                centroId: centroInfo.id,
              },
            });
            totalEntitiesCreated++;
            console.log(`    ✅ ${entityJson.name} (atualizado)`);
          } else {
            throw error;
          }
        }
      } catch (error) {
        totalEntitiesSkipped++;
        console.error(`    ❌ Erro ao processar ${file}:`, error);
      }
    }
  }

  console.log(`\n✅ Inicialização concluída!`);
  console.log(`   - Entidades criadas/atualizadas: ${totalEntitiesCreated}`);
  if (totalEntitiesSkipped > 0) {
    console.log(`   - Entidades com erro: ${totalEntitiesSkipped}`);
  }
}

main()
  .catch(e => {
    console.error('❌ Erro durante inicialização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
