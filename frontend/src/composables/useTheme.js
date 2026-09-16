import { computed, ref } from "vue";

const STORAGE_KEY = "stockwell-theme";

const getInitialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const theme = ref(getInitialTheme());

const applyTheme = () => {
  document.documentElement.classList.toggle("dark-mode", theme.value === "dark");
  document.documentElement.classList.toggle("light-mode", theme.value === "light");
};

const setTheme = (value) => {
  theme.value = value;
  localStorage.setItem(STORAGE_KEY, value);
  applyTheme();
};

const toggleTheme = () => setTheme(theme.value === "dark" ? "light" : "dark");

applyTheme();

export const useTheme = () => ({
  theme,
  isDark: computed(() => theme.value === "dark"),
  setTheme,
  toggleTheme,
});
