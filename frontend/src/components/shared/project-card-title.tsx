import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TypeBadge from "@/components/shared/badges";

type User = {
  name: string;
  image: string;
  type: "laboratorios" | "pessoa" | "ufpb" | "grupos" | "externo";
};

type PostCardTitle = {
  postName: string;
  postImage: string;
  numVotes: string;
};

type PostCardTitleProps = {
  postTitle: string;
  numVotes: number;
  numMinutes: number;
  numComments: number;
  postUser: User;
};

export default function PostCardTitle({ postTitle, numMinutes, postUser }: PostCardTitleProps) {
  let dateText: string;
  if (numMinutes < 60) {
    if (numMinutes > 1) {
      dateText = "Postado " + numMinutes + " minutos atrás";
    } else {
      dateText = "Postado " + numMinutes + " minuto atrás";
    }
  } else if (numMinutes < 1440) {
    const hours = Math.floor(numMinutes / 60);
    if (hours > 1) {
      dateText = "Postado " + hours + " horas atrás";
    } else {
      dateText = "Postado " + hours + " hora atrás";
    }
  } else {
    const days = Math.floor(numMinutes / 1440);
    if (days > 1) {
      dateText = "Postado " + days + " dias atrás";
    } else {
      dateText = "Postado " + days + " dia atrás";
    }
  }
  return (
    <div className="flex flex-col justify-around min-w-[450px] max-w-[800px]">
      <h3 className="h-4 mb-4 font-medium">{postTitle}</h3>
      <div className="grid grid-cols-12">
        <div className="col-span-3 flex justify-around items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={postUser.image} alt={postUser.name} />
            <AvatarFallback>{postUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h4 className="text-md font-medium">{postUser.name}</h4>
          {/* <Badge variant="default" className="h-5 bg-blue-600 hover:bg-blue-700">{postUser.type}</Badge> */}
          <TypeBadge type={postUser.type} size="small"></TypeBadge>
        </div>
        <div className="col-start-5 col-span-8 flex justify-between items-center">
          {/* <p className="text-gray-600 text-xs dark:text-zinc-400">• {numVotes} votos</p>
          <p className="text-gray-600 text-xs dark:text-zinc-400">• {numComments} comentários</p> */}
          <p className="text-gray-600 text-xs dark:text-zinc-400">• {dateText}</p>
        </div>
      </div>
    </div>
  );
}
