import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

type FullScreenTextareaProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onEnterPress: () => void;
};

const FullScreenTextarea = forwardRef<HTMLTextAreaElement, FullScreenTextareaProps>(
  ({ value, onChange, onEnterPress }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const adjustTextareaHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    useEffect(() => {
      adjustTextareaHeight();
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onEnterPress();
      }
    };

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="w-[100%] box-border min-h-2 h-auto text-2xl resize-none overflow-hidden dark:bg-black"
      />
    );
  }
);

FullScreenTextarea.displayName = "FullScreenTextarea";

export default FullScreenTextarea;
