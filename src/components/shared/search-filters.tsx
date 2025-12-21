import React from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchFiltersProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  activeButton: string;
  setActiveButton: (value: string) => void;
  tagTerm: string;
  setTagTerm: (value: string) => void;
  collaborators: string;
  setCollaborators: (value: string) => void;
  clearFilters: () => void;
};

export default function SearchFilters({
  searchTerm,
  setSearchTerm,
  activeButton,
  setActiveButton,
  tagTerm,
  setTagTerm,
  collaborators,
  setCollaborators,
  clearFilters,
}: SearchFiltersProps) {
  const { theme } = useTheme();

  const isActive = (button: string) => activeButton === button;

  const handleClear = () => {
    clearFilters();
  };

  // Determine icons according to the theme (dark or light)
  const searchIcon = theme === "dark" ? "lupa_Dark.png" : "lupa.png";

  return (
    <>
      <div className="flex flex-row justify-between text-neutral-800">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-68">
            <span className="absolute inset-y-0 flex items-center pl-3">
              <Image src={`/${searchIcon}`} alt="icon search" width={16} height={16} />
            </span>
            <Input
              className="pl-10 text-xs h-8 bg-gray-50 border-[1.3px] border-gray-400 dark:bg-transparent dark:text-gray-200"
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            className={`rounded-full w-24 h-8 text-xs ${isActive("Todos") ? "bg-gray-200" : "bg-transparent border-transparent dark:text-gray-200 "}`}
            onClick={() => setActiveButton("Todos")}
          >
            Todos
          </Button>

          <Button
            variant="outline"
            className={`rounded-full w-28 h-8 text-xs ${isActive("Pessoais") ? "bg-gray-200" : "bg-transparent  dark:text-gray-200 border-transparent"}`}
            onClick={() => setActiveButton("Pessoais")}
          >
            Pessoais
          </Button>

          <Button
            variant="outline"
            className={`rounded-full w-32 h-8 text-xs ${isActive("Laboratórios") ? "bg-gray-200" : "bg-transparent dark:text-gray-200 border-transparent"}`}
            onClick={() => setActiveButton("Laboratórios")}
          >
            Laboratórios
          </Button>

          <Button
            variant="outline"
            className={`rounded-full w-32 h-8 text-xs ${isActive("Grupos e Ligas") ? "bg-gray-200" : "bg-transparent dark:text-gray-200 border-transparent"}`}
            onClick={() => setActiveButton("Grupos e Ligas")}
          >
            Grupos e Ligas
          </Button>
        </div>

        {/* <Button
          variant="outline" 
          className="bg-transparent w-24 h-8 flex gap-2 text-xs rounded-full border-gray-400 dark:bg-transparent dark:text-gray-200 dark:hover:bg-neutral-800"
          onClick={toggleFilters}>
          <Image src={`/${filterIcon}`} alt="icon filter" width={16} height={16} />
          Filtros
        </Button> */}
      </div>

      <div className="grid transition-[grid-template-rows] duration-300 ease-out [grid-template-rows:1fr] mt-4 rounded-lg">
        <div className="overflow-hidden">
          <div className="flex flex-row gap-3">
            <div className="relative h-8">
              <span className="absolute inset-y-0 left-3 flex items-center">
                <Image src={`/${searchIcon}`} alt="icon search" width={16} height={16} />
              </span>
              <Input
                id="tag"
                type="text"
                placeholder="Pesquise por Tag"
                className="pl-10 text-xs h-8 bg-transparent border-[1.3px] border-gray-400 w-46 dark:bg-transparent dark:text-gray-200"
                value={tagTerm}
                onChange={e => setTagTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={collaborators} onValueChange={setCollaborators}>
                <SelectTrigger className="text-xs text-gray-500 h-8 bg-transparent border-gray-400 w-46 dark:bg-transparent dark:text-gray-200">
                  <SelectValue placeholder="Número de colaboradores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-xs">
                    1
                  </SelectItem>
                  <SelectItem value="2" className="text-xs">
                    2
                  </SelectItem>
                  <SelectItem value="3" className="text-xs">
                    3
                  </SelectItem>
                  <SelectItem value="4" className="text-xs">
                    4
                  </SelectItem>
                  <SelectItem value="5" className="text-xs">
                    5+
                  </SelectItem>
                  <SelectItem value="10" className="text-xs">
                    10+
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                onClick={handleClear}
                className="rounded-full w-28 h-8 text-xs  border-[0.5px] bg-gray-200 text-aquario-primary dark:border-white dark:bg-transparent dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 "
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
