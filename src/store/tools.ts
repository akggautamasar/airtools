"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UploadedFile } from "@/types";

interface ToolsStore {
  recentFiles: { name: string; slug: string; date: string }[];
  favorites: string[];
  addRecentFile: (name: string, slug: string) => void;
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
}

export const useToolsStore = create<ToolsStore>()(
  persist(
    (set, get) => ({
      recentFiles: [],
      favorites: [],
      addRecentFile: (name, slug) => {
        const entry = { name, slug, date: new Date().toISOString() };
        set((state) => ({
          recentFiles: [entry, ...state.recentFiles.filter((f) => f.slug !== slug)].slice(0, 20),
        }));
      },
      toggleFavorite: (slug) => {
        set((state) => ({
          favorites: state.favorites.includes(slug)
            ? state.favorites.filter((f) => f !== slug)
            : [...state.favorites, slug],
        }));
      },
      isFavorite: (slug) => get().favorites.includes(slug),
    }),
    { name: "airtools-store" }
  )
);

interface UploadStore {
  files: UploadedFile[];
  addFiles: (files: UploadedFile[]) => void;
  updateFile: (id: string, update: Partial<UploadedFile>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  files: [],
  addFiles: (files) => set((state) => ({ files: [...state.files, ...files] })),
  updateFile: (id, update) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...update } : f)),
    })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  clearFiles: () => set({ files: [] }),
}));
