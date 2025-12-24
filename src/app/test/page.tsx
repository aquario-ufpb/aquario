"use client";

import { useState } from "react";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/shared/editor/editor"), { ssr: false });

export default function Test() {
  const [_content, setContent] = useState("");
  const handleContentChange = (content: string) => {
    console.log("Content updated:", content);
    setContent(content);
  };

  return (
    <div className="container mx-auto p-4 pt-40">
      <Editor defaultContent="" onContentChange={handleContentChange} characterLimit={1000} />
    </div>
  );
}
