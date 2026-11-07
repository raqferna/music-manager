"use client";

import type { LibraryFolder } from "@/lib/types";
import { UNFILED_FOLDER_LABEL } from "@/lib/libraryFoldersShared";

type Props = {
  folders: LibraryFolder[];
  value: string | null;
  onChange: (folderId: string | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export default function FolderSelect({
  folders,
  value,
  onChange,
  disabled = false,
  className = "",
  label = "Carpeta",
}: Props) {
  return (
    <label className={`block text-xs text-white/50 ${className}`}>
      <span className="mb-1 block font-medium uppercase tracking-wide">{label}</span>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400/50 disabled:opacity-60"
      >
        <option value="">{UNFILED_FOLDER_LABEL}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
    </label>
  );
}
