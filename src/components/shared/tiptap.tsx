"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Strikethrough,
  Code,
  Link as LinkIcon,
} from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { uploadProjetoImage } from "@/lib/client/api/projetos";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type TiptapProps = {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (url: string) => void;
};

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
        // The service throws ApiError with the server's actual message
        // ("Tipo de arquivo não permitido", size errors, etc.) instead of
        // collapsing to a generic "Falha no upload".
        const url = await uploadProjetoImage(file);

        if (onImageUpload) {
          onImageUpload(url);
        }

        toast.success("Upload concluído com sucesso!", { id: loadingToastId });
        return url;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao fazer upload da imagem";
        toast.error(message, { id: loadingToastId });
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
        // No base64 — images go through the upload endpoint and are referenced
        // by URL. Inline base64 bloats the markdown toward the 50K cap.
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Restrict to safe protocols — block javascript:/data: as a defense layer
        // even though we now render via react-markdown (which won't emit raw
        // HTML anyway).
        protocols: ["http", "https", "mailto"],
      }),
      // Serialize editor state to markdown on update; parse markdown when
      // hydrating with `value`. Keeps storage as plain markdown end-to-end.
      Markdown.configure({
        html: false,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none m-5 focus:outline-none border rounded-b-md p-4 min-h-[300px]",
      },
      handlePaste: function (view, event, _slice) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter(item => item.type.startsWith("image"));
        if (imageItems.length === 0) {
          return false;
        }

        const handleImages = async () => {
          for (const item of imageItems) {
            const file = item.getAsFile();
            if (!file) {
              continue;
            }

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
      handleDrop: function (view, event, _slice, moved) {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const files = event.dataTransfer.files;
          const handleImages = async () => {
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            let offset = 0;
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file.type.startsWith("image")) {
                const url = await handleImageUpload(file);
                if (url && coordinates) {
                  const node = view.state.schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.insert(coordinates.pos + offset, node);
                  view.dispatch(transaction);
                  offset += node.nodeSize;
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

    // Belt and suspenders — Link.configure already filters protocols, but
    // validating here gives the user immediate feedback instead of silently dropping.
    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      window.alert("Apenas links http(s) ou mailto: são permitidos.");
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
