import Link from "next/link";

type SearchResultCardProps = {
  result: {
    id: string;
    titulo?: string;
    nome?: string;
    conteudo?: string;
    descricao?: string;
    type: string;
  };
};

const SearchResultCard = ({ result }: SearchResultCardProps) => {
  const title = result.titulo || result.nome;
  const description = result.conteudo || result.descricao || "";
  const link = `/${result.type}s/${result.id}`;

  return (
    <Link
      href={link}
      className="block p-4 mb-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <div className="flex justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className="text-sm text-gray-500 capitalize">{result.type}</span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-2 truncate">{description}</p>
    </Link>
  );
};

export default SearchResultCard;
