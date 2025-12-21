import React, { useState, useEffect } from "react";
import TypeBadge from "./badges";
import ProjectCard, { Projeto } from "./project-card";
import Image from "next/image";

type User = {
  name: string;
  image: string;
  type: "laboratorios" | "pessoa" | "ufpb" | "grupos" | "externo";
};

type Project = {
  projectName: string;
  projectImage: string;
  users: User[];
};

type UserCardProjectsProps = {
  name: string;
  profilePicture: string;
  description: string;
  type: "laboratorios" | "pessoa" | "ufpb" | "grupos" | "externo";
  site: string;
  projects: Project[];
};

const UserCardProjects: React.FC<UserCardProjectsProps> = ({
  name,
  profilePicture,
  description,
  type,
  projects,
}) => {
  const [maxProjects, setMaxProjects] = useState(2);

  useEffect(() => {
    const updateMaxProjects = () => {
      const width = typeof window !== "undefined" ? window.innerWidth : 0;
      if (width >= 1024) {
        setMaxProjects(3);
      } else if (width >= 768) {
        setMaxProjects(4);
      } else {
        setMaxProjects(2);
      }
    };

    updateMaxProjects();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateMaxProjects);
      return () => window.removeEventListener("resize", updateMaxProjects);
    }
  }, []);

  return (
    <div className="bg-white dark:bg-transparent dark:border-neutral-800 rounded-lg p-5 h-auto w-full shadow-md border-neutral-100 border-[1px]">
      <div className="flex-row justify-between pt-6 px-6">
        <div className="flex flex-row gap-3 items-center">
          <Image
            className="w-24 h-24 object-cover rounded-full aspect-square"
            src={profilePicture}
            alt="profile picture"
          />
          <div className="pl-4">
            <div className="flex flex-row gap-2 items-center pb-1">
              <p className="text-3xl font-inter">{name}</p>
              <TypeBadge type={type} size="small" />
            </div>
            <p className="text-lg text-neutral-500 font-inter">{description}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-10">
          {projects.slice(0, maxProjects).map((project, index) => (
            <ProjectCard key={index} projeto={project as unknown as Projeto} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserCardProjects;
