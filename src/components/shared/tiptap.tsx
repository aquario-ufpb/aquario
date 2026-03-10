"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { tokenManager } from "@/lib/client/api/token-manager";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (url: string) => void;
}

const Tiptap = ({ value, onChange, onImageUpload }: TiptapProps) => {
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem.");
        return null;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error("A imagem selecionada é muito grande (máximo 5MB).");
        return null;
      }

      const loadingToastId = toast.loading("Fazendo upload da imagem...");
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/projeto-image", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenManager.getToken()}`
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Falha no upload");
        }

        const data = await response.json();
        const url = data.url;

        if (onImageUpload) {
          onImageUpload(url);
        }

        toast.success("Upload concluído com sucesso!", { id: loadingToastId });
        return url;
      } catch (error) {
        toast.error("Erro ao fazer upload da imagem", { id: loadingToastId });
        return null;
      }
    },
    [onImageUpload]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none border rounded-b-md p-4 min-h-[300px]",
      },
      handlePaste: function (view, event, slice) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter((item) => item.type.startsWith("image"));
        if (imageItems.length === 0) return false;

        const handleImages = async () => {
          for (const item of imageItems) {
            const file = item.getAsFile();
            if (!file) continue;

            const url = await handleImageUpload(file);
            if (url) {
              const node = view.state.schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            }
          }
        };

        handleImages();
        return true; // Prevents default behavior
      },
      handleDrop: function (view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const files = event.dataTransfer.files;
          const handleImages = async () => {
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file.type.startsWith("image")) {
                const url = await handleImageUpload(file);
                if (url && coordinates) {
                  const node = view.state.schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.insert(coordinates.pos, node);
                  view.dispatch(transaction);
                }
              }
            }
          };
          handleImages();
          return true; // Prevents default behavior
        }
        return false;
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div>
      <div className="border rounded-t-md p-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("bold") ? "bg-muted" : ""}`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("italic") ? "bg-muted" : ""}`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("underline") ? "bg-muted" : ""}`}
        >
          <UnderlineIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("strike") ? "bg-muted" : ""}`}
        >
          <Strikethrough className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("codeBlock") ? "bg-muted" : ""}`}
        >
          <Code className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("link") ? "bg-muted" : ""}`}
        >
          <LinkIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("bulletList") ? "bg-muted" : ""}`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1 rounded hover:bg-muted ${editor.isActive("orderedList") ? "bg-muted" : ""}`}
        >
          <ListOrdered className="w-5 h-5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
