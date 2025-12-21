"use client";

import { useState } from "react";
import RichTextEditor, {
  BaseKit,
  Bold,
  BulletList,
  OrderedList,
  Heading,
  Italic,
  Link,
  Code,
  Image,
  History,
  HorizontalRule,
  Emoji,
  SlashCommand,
  Blockquote,
  CodeBlock,
} from "reactjs-tiptap-editor";
import "reactjs-tiptap-editor/style.css";

// eslint-disable-next-line no-duplicate-imports
import { locale } from "reactjs-tiptap-editor";

type EditorProps = {
  defaultContent?: string;
  onContentChange?: (value: string) => void;
  characterLimit?: number;
};

const Editor: React.FC<EditorProps> = ({
  defaultContent = "",
  onContentChange,
  characterLimit = 50_000,
}) => {
  locale.setLang("pt_BR");

  const [content, setContent] = useState(defaultContent);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (onContentChange) {
      onContentChange(value);
    }
  };

  const extensions = [
    BaseKit.configure({
      placeholder: { showOnlyCurrent: true },
      characterCount: { limit: characterLimit },
    }),
    History,
    Heading.configure({ spacer: true }),
    Italic,
    Bold,
    BulletList,
    OrderedList,
    Link,
    Code,
    Blockquote.configure({ spacer: true }),
    Code.configure({ toolbar: false }),
    CodeBlock.configure({ defaultTheme: "dracula" }),
    HorizontalRule,
    Image.configure({
      upload: (files: File) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(URL.createObjectURL(files));
          }, 500);
        });
      },
    }),
    Emoji,
    SlashCommand,
  ];

  return (
    <>
      <RichTextEditor
        output="html"
        content={content}
        onChangeContent={handleContentChange}
        extensions={extensions}
      />
    </>
  );
};

export default Editor;
