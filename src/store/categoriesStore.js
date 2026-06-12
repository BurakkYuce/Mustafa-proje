// Kategori store'u + takvim renk filtresi.
import { create } from 'zustand';
import * as repo from '../db/categoriesRepo';

export const useCategoriesStore = create((set, get) => ({
  categories: [],
  activeFilter: null, // null = hepsi; aksi halde seçili kategori id'si

  load: (userId) => set({ categories: repo.listByUser(userId) }),

  add: (userId, name, color) => {
    repo.createCategory({ user_id: userId, name, color });
    get().load(userId);
  },

  update: (userId, id, name, color) => {
    repo.updateCategory(id, { name, color });
    get().load(userId);
  },

  remove: (userId, id) => {
    repo.deleteCategory(id);
    if (get().activeFilter === id) set({ activeFilter: null });
    get().load(userId);
  },

  // Aynı kategoriye tekrar dokununca filtreyi temizle (toggle).
  setFilter: (id) =>
    set((s) => ({ activeFilter: s.activeFilter === id ? null : id })),

  clearFilter: () => set({ activeFilter: null }),
}));
