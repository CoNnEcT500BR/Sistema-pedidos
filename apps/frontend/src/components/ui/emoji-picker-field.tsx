import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { useState } from 'react';

interface EmojiPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  buttonLabel: string;
}

export function EmojiPickerField({ value, onChange, buttonLabel }: EmojiPickerFieldProps) {
  const [open, setOpen] = useState(false);

  function handleEmojiClick(emojiData: EmojiClickData) {
    onChange(emojiData.emoji);
    setOpen(false);
  }

  return (
    <div className="relative w-full min-w-0 overflow-visible">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-700 outline-none transition hover:bg-stone-50"
      >
        <span className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span className="text-lg">{value || '🙂'}</span>
          <span className="truncate">{buttonLabel}</span>
        </span>
        <Smile size={16} />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 max-w-[90vw] sm:left-auto sm:right-0">
          <EmojiPicker onEmojiClick={handleEmojiClick} width={280} height={340} />
        </div>
      ) : null}
    </div>
  );
}
