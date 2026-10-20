/** @type {import('next').NextConfig} */
export default {
  // Les fichiers du référentiel (générés par build.mjs) sont servis par des routes protégées
  outputFileTracingIncludes: { "/": ["./site/index.html"], "/membres": ["./site/index.html"], "/parametrage": ["./site/index.html"], "/fichier/[...chemin]": ["./site/**/*"] },
  async rewrites() {
    return [
      { source: "/pdf/:f*", destination: "/fichier/pdf/:f*" },
      { source: "/word/:f*", destination: "/fichier/word/:f*" },
      { source: "/fonts/:f*", destination: "/fichier/fonts/:f*" },
      { source: "/source/:f*", destination: "/fichier/source/:f*" },
      { source: "/img/:f*", destination: "/fichier/img/:f*" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Cache-Control", value: "private, no-store" },
    ] }];
  },
};
