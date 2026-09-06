import { computed, ref } from "vue";

const STORAGE_KEY = "stockwell-theme";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const theme = ref(getInitialTheme());

const applyTheme = () => {
  document.documentElement.classList.toggle(
    "dark-mode",
    theme.value === "dark"
  );

  document.documentElement.classList.toggle(
    "light-mode",
    theme.value === "light"
  );
};

const setTheme = (newTheme) => {
  theme.value = newTheme;

  localStorage.setItem(STORAGE_KEY, newTheme);

  applyTheme();
};

const toggleTheme = () => {
  setTheme(theme.value === "dark" ? "light" : "dark");
};

applyTheme();

export const useTheme = () => {
  const isDark = computed(() => theme.value === "dark");

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
};