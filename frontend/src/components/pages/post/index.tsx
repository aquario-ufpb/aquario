"use client";

import React, { useState } from "react";
import TypeBadge from "@/components/shared/badges";
import Image from "next/image";

type PostComponentProps = {
  title: string;
  text: string;
  user: {
    image: string;
    name: string;
    type: "laboratorios" | "pessoa" | "ufpb" | "grupos" | "externo";
  };
  timePublished: number;
};

const PostComponent: React.FC<PostComponentProps> = ({ title, text, user, timePublished }) => {
  const [votes, setVotes] = useState(0);

  const handleUpvote = () => {
    setVotes(prevVotes => (prevVotes < 1000 ? prevVotes + 1 : 1000));
  };

  const handleDownvote = () => {
    setVotes(prevVotes => (prevVotes > 0 ? prevVotes - 1 : 0));
  };

  const paragraphs = text.split("\n").filter(paragraph => paragraph.trim() !== "");

  const timePosted = () => {
    if (timePublished < 60) {
      return `${timePublished} minutos atrás`;
    }

    const hours = Math.floor(timePublished / 60);
    const minutes = timePublished % 60;

    if (minutes === 0) {
      return `${hours} horas atrás`;
    } else {
      return `${hours} horas e ${minutes} minutos atrás`;
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100">
      <div className="flex flex-col pt-24 p-6 bg-white rounded-lg shadow-md max-w-3xl relative">
        <div className="flex">
          <div className="flex flex-col items-center pr-4">
            <button className="text-gray-500 hover:text-blue-500" onClick={handleUpvote}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-700">{votes}</span>
            <button className="text-gray-500 hover:text-red-500" onClick={handleDownvote}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="absolute top-[11.5rem] bottom-[7.5rem] w-px ml-3 bg-gray-300"></div>

          <div className="pl-4 w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Image src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <span className="text-sm text-gray-500">
                  <TypeBadge type={user.type} size="small" />
                </span>
                <span className="text-sm text-gray-500">{timePosted()}</span>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">{title}</h1>
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* <div className="flex justify-between items-center text-sm text-gray-500 border-2 mt-4 p-5 rounded-lg">
          <button className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Responder
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default PostComponent;
