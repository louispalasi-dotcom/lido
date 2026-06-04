import type { NextConfig } from "next";

// Quand on construit pour GitHub Pages (script "build:pages"), le site est servi
// sous /lido. En local, on reste à la racine pour ne pas compliquer.
const isGitHubPages = process.env.GH_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export", // génère un site 100 % statique (dossier "out/")
  images: { unoptimized: true }, // requis pour l'export statique
  basePath: isGitHubPages ? "/lido" : undefined,
  assetPrefix: isGitHubPages ? "/lido/" : undefined,
  trailingSlash: true, // URLs propres sur GitHub Pages
  // Exposé au client pour enregistrer le service worker / manifest au bon chemin.
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/lido" : "" },
};

export default nextConfig;
