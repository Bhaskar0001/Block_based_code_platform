const KEY = "block-platform.project.v1";

export function createProjectStorage() {
  return {
    saveLocal: (json) => localStorage.setItem(KEY, JSON.stringify(json)),
    loadLocal: () => {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    },
  };
}
