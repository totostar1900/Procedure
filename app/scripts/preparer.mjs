// Prépare l'application : copie la sortie de build.mjs (../dist) dans site/, et assemble le module de liaison.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(APP, "..", "dist");
const SITE = path.join(APP, "site");
if (!fs.existsSync(path.join(DIST, "index.html"))) { console.error("dist/index.html introuvable : lancer d'abord node build.mjs à la racine."); process.exit(1); }
fs.rmSync(SITE, { recursive: true, force: true });
fs.cpSync(DIST, SITE, { recursive: true });
fs.mkdirSync(path.join(APP, "public"), { recursive: true });
fs.copyFileSync(path.join(DIST, "i18n.js"), path.join(APP, "public/i18n.js"));
await build({ entryPoints: [path.join(APP, "shim/shim.js")], bundle: true, minify: true, format: "iife", target: "es2020", outfile: path.join(APP, "public/shim.js") });
console.log("site/ prêt :", fs.readdirSync(path.join(SITE, "pdf")).length, "PDF,", fs.readdirSync(path.join(SITE, "word")).length, "Word ; shim.js assemblé");
