import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export type StatusItem = "PERDIDO" | "DEVOLVIDO";

type Autor = {
  nome: string;
  urlFotoPerfil?: string | null;
};

type TadeaProps = {
  id: string;
  title: string;
  message: string;
  timePostedInMinutes: number;
  images: string[];
  autor: Autor;
  status: StatusItem;
  isAdmin: boolean;
  onStatusChange: (id: string, status: StatusItem) => void;
};

const LostAndFoundCard = ({
  id,
  title,
  message,
  timePostedInMinutes,
  images,
  autor,
  status,
  isAdmin,
  onStatusChange,
}: TadeaProps) => {
  const timePosted = () => {
    if (timePostedInMinutes < 60) {
      return `${timePostedInMinutes} minutos atrás`;
    }

    const hours = Math.floor(timePostedInMinutes / 60);
    const minutes = timePostedInMinutes % 60;

    if (minutes === 0) {
      return `${hours} horas atrás`;
    } else {
      return `${hours} horas e ${minutes} minutos atrás`;
    }
  };

  const getGridColumns = () => {
    if (images.length === 1) {
      return "grid-cols-1";
    }
    if (images.length === 2) {
      return "grid-cols-2";
    }
    if (images.length === 3) {
      return "grid-cols-2";
    }
    return "grid-cols-2"; // Para 3 ou mais imagens
  };

  const visibleImages = images.slice(0, 3);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={!isAdmin}>
        <div
          className={cn(
            "relative p-4 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 group grid grid-cols-3 gap-4 max-w-2xl mx-auto my-4 w-full h-64 dark:text-dark-text dark:border-white",
            status === "DEVOLVIDO"
              ? "bg-gray-100 opacity-60 cursor-not-allowed dark:bg-gray-800"
              : "hover:border-aquario-primary hover:cursor-pointer hover:text-aquario-primary"
          )}
        >
          {isAdmin && (
            <Link
              href={`/tadea/editar/${id}`}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}

          {/* Image Section */}
          {visibleImages.length > 0 ? (
            <div className={`grid ${getGridColumns()} gap-2 h-full`}>
              {visibleImages.length === 3 ? (
                <>
                  <div className="col-span-1 h-full">
                    <Image
                      src={visibleImages[0]}
                      alt={`Item 1`}
                      width={150}
                      height={150}
                      className="rounded-lg object-cover h-full w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    {visibleImages.slice(1).map((imgSrc, index) => (
                      <Image
                        key={index + 1}
                        src={imgSrc}
                        alt={`Item ${index + 2}`}
                        width={150}
                        height={150}
                        className="rounded-lg object-cover h-full w-full"
                      />
                    ))}
                  </div>
                </>
              ) : (
                visibleImages.map((imgSrc, index) => (
                  <Image
                    key={index}
                    src={imgSrc}
                    alt={`Item ${index + 1}`}
                    width={150}
                    height={150}
                    className="rounded-lg object-cover h-full w-full"
                  />
                ))
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-secondary rounded-lg">
              <Skeleton className="h-full w-full" />
            </div>
          )}

          {/* Info Section */}
          <div className="col-span-2 flex flex-col justify-between h-full p-2">
            <div>
              <div className="text-gray-500 text-sm">{timePosted()}</div>
              <div className="flex items-start justify-between flex-col">
                <h3 className="text-lg font-semibold group-hover:underline dark:text-gray-200 truncate">
                  {title}
                </h3>
                <Badge variant={status === "PERDIDO" ? "destructive" : "default"}>{status}</Badge>
              </div>
            </div>
            <div className="text-gray-500 overflow-hidden text-ellipsis mt-2">
              <p>{message}</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-4">
              <Avatar className="h-6 w-6">
                <AvatarImage src={autor.urlFotoPerfil || getDefaultAvatarUrl(autor.nome)} />
                <AvatarFallback>{autor.nome[0]}</AvatarFallback>
              </Avatar>
              <span>{autor.nome}</span>
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      {isAdmin && (
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onStatusChange(id, "DEVOLVIDO")}>
            Marcar como Devolvido
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(id, "PERDIDO")}>
            Marcar como Perdido
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
};

export default LostAndFoundCard;
