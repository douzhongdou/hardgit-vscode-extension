(function () {
  const storageKey = "hardgit-site-language";
  const defaultLanguage = "zh-CN";
  const translations = window.HARDGIT_TRANSLATIONS ?? {};

  function getLanguageFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");

    if (lang && translations[lang]) {
      return lang;
    }

    return null;
  }

  function getStoredLanguage() {
    try {
      const lang = window.localStorage.getItem(storageKey);
      return lang && translations[lang] ? lang : null;
    } catch {
      return null;
    }
  }

  function setStoredLanguage(lang) {
    try {
      window.localStorage.setItem(storageKey, lang);
    } catch {}
  }

  function translate(key, language) {
    return translations[language]?.[key] ?? translations[defaultLanguage]?.[key] ?? key;
  }

  function applyLanguage(language) {
    document.documentElement.lang = language;
    document.title = translate("meta.title", language);

    const descriptionMeta = document.getElementById("page-description");

    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", translate("meta.description", language));
    }

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");

      if (!key) {
        return;
      }

      node.textContent = translate(key, language);
    });

    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const key = node.getAttribute("data-i18n-html");

      if (!key) {
        return;
      }

      node.innerHTML = translate(key, language);
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((node) => {
      const instructions = (node.getAttribute("data-i18n-attr") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      instructions.forEach((instruction) => {
        const [attribute, key] = instruction.split(":").map((value) => value.trim());

        if (attribute && key) {
          node.setAttribute(attribute, translate(key, language));
        }
      });
    });

    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      const isActive = button.getAttribute("data-lang-switch") === language;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function resolveInitialLanguage() {
    return getLanguageFromQuery() ?? getStoredLanguage() ?? defaultLanguage;
  }

  function bindLanguageSwitch() {
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.addEventListener("click", () => {
        const lang = button.getAttribute("data-lang-switch");

        if (!lang || !translations[lang]) {
          return;
        }

        applyLanguage(lang);
        setStoredLanguage(lang);
      });
    });
  }

  applyLanguage(resolveInitialLanguage());
  bindLanguageSwitch();
})();
