export function getIconForLanguageExtension(language: string) {
  const iconClass = getDeviconClass(language);

  return <i className={`${iconClass} text-sm opacity-70`} aria-hidden="true" />;
}

function getDeviconClass(language: string): string {
  switch (language) {
    // JavaScript / TypeScript
    case "js":
    case "javascript":
      return "devicon-javascript-plain";
    case "ts":
    case "typescript":
      return "devicon-typescript-plain";
    case "jsx":
      return "devicon-react-original";
    case "tsx":
      return "devicon-react-original";

    // Web
    case "html":
      return "devicon-html5-plain";
    case "css":
      return "devicon-css3-plain";
    case "scss":
    case "sass":
      return "devicon-sass-original";
    case "less":
      return "devicon-less-plain-wordmark";

    // Data formats
    case "json":
    case "jsonc":
      return "devicon-json-plain";
    case "yaml":
    case "yml":
      return "devicon-yaml-plain";
    case "xml":
      return "devicon-xml-plain";
    case "markdown":
    case "md":
    case "mdx":
      return "devicon-markdown-original";

    // Programming languages
    case "python":
    case "py":
      return "devicon-python-plain";
    case "rust":
    case "rs":
      return "devicon-rust-original";
    case "go":
      return "devicon-go-original-wordmark";
    case "java":
      return "devicon-java-plain";
    case "kotlin":
    case "kt":
      return "devicon-kotlin-plain";
    case "swift":
      return "devicon-swift-plain";
    case "c":
      return "devicon-c-plain";
    case "cpp":
    case "c++":
      return "devicon-cplusplus-plain";
    case "csharp":
    case "cs":
      return "devicon-csharp-plain";
    case "php":
      return "devicon-php-plain";
    case "ruby":
    case "rb":
      return "devicon-ruby-plain";
    case "lua":
      return "devicon-lua-plain";
    case "r":
      return "devicon-r-plain";
    case "scala":
      return "devicon-scala-plain";
    case "elixir":
    case "ex":
      return "devicon-elixir-plain";
    case "haskell":
    case "hs":
      return "devicon-haskell-plain";
    case "clojure":
    case "clj":
      return "devicon-clojure-plain";

    // Shell / Terminal
    case "bash":
    case "shell":
    case "sh":
    case "zsh":
    case "terminal":
      return "devicon-bash-plain";
    case "powershell":
    case "ps1":
      return "devicon-powershell-plain";

    // Databases
    case "sql":
    case "mysql":
      return "devicon-mysql-plain";
    case "postgresql":
    case "postgres":
      return "devicon-postgresql-plain";
    case "mongodb":
      return "devicon-mongodb-plain";
    case "redis":
      return "devicon-redis-plain";

    // Config files
    case "docker":
    case "dockerfile":
      return "devicon-docker-plain";
    case "nginx":
      return "devicon-nginx-original";
    case "graphql":
    case "gql":
      return "devicon-graphql-plain";

    // Other
    case "vim":
      return "devicon-vim-plain";
    case "git":
      return "devicon-git-plain";

    // Default - generic code icon
    default:
      return "devicon-devicon-plain";
  }
}
