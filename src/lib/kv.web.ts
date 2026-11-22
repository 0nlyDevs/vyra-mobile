// Le stockage de l'application dans un navigateur (aperçu web) : localStorage. SecureStore et les
// fichiers n'existent pas sur le web ; sur un téléphone, c'est `kv.ts` qui s'applique.
const read = (key: string): string | null => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Navigation privée ou stockage plein : la session reste en mémoire le temps de la visite.
  }
};

const remove = (key: string): void => {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // rien à faire
  }
};

export const kv = {
  getItem: read,
  setItem: write,
  async getItemAsync(key: string): Promise<string | null> {
    return read(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    write(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    remove(key);
  },
};
