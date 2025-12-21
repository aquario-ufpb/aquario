import Image from "next/image";

type Membro = {
  id: string;
  papel: "ADMIN" | "MEMBRO";
  usuario: {
    id: string;
    nome: string;
    urlFotoPerfil?: string | null;
  };
};

type Entidade = {
  id: string;
  nome: string;
  descricao?: string | null;
  urlFoto?: string | null;
  contato?: string | null;
  membros: Membro[];
};

type LabHeaderProps = {
  entidade: Entidade;
};

export default function LabHeader({ entidade }: LabHeaderProps) {
  const { nome, descricao, urlFoto, membros, contato } = entidade;
  const numeroColaboradores = membros?.length || 0;

  return (
    <div className="flex w-full justify-between h-auto my-20 pt-5 px-[100px] items-center">
      <div className="flex flex-col max-w-[400px] gap-5 pt-[50px]">
        <Image
          className="w-32 h-32 rounded-full object-cover shadow-lg"
          src={urlFoto || ""}
          alt={`Foto de ${nome}`}
        />
        <h1 className="text-4xl font-bold">{nome}</h1>
        {descricao && <p className="text-lg font-light text-muted-foreground">{descricao}</p>}
        <div>
          <div className="flex gap-10 text-sm text-muted-foreground">
            <p>{numeroColaboradores} Membro(s)</p>
            {/* Outras estatísticas podem ser adicionadas aqui */}
          </div>
        </div>
        {contato && (
          <div className="pt-5">
            <a
              href={contato}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 py-2 px-6 flex justify-center rounded-full cursor-pointer"
            >
              Contato
            </a>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center">
        {/* Imagem de banner pode ser adicionada no futuro */}
      </div>
    </div>
  );
}
