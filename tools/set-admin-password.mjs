#!/usr/bin/env node
// Sets the /admin login for mansbestfriendmiami.com.
// Asks for the email and a new password (typing is hidden), stores only a scrypt hash
// in the Vercel project's production environment. Run from the project folder:
//   node tools/set-admin-password.mjs
import readline from "node:readline";
import { scryptSync, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

const SCOPE = "lazs-projects-04b09be7";

function ask(question, { hidden = false, fallback = "" } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else rl.output.write(""); };
    rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(answer.trim() || fallback); });
  });
}

function setEnv(name, value) {
  try { execFileSync("vercel", ["env", "rm", name, "production", "-y", "--scope", SCOPE], { stdio: "ignore" }); } catch {}
  execFileSync("vercel", ["env", "add", name, "production", "--scope", SCOPE], { input: value, stdio: ["pipe", "ignore", "inherit"] });
}

const email = (await ask("Admin email [lazaro@marketingsvc.com]: ", { fallback: "lazaro@marketingsvc.com" })).toLowerCase();
const pw1 = await ask("New admin password (hidden): ", { hidden: true });
const pw2 = await ask("Type it again: ", { hidden: true });
if (pw1 !== pw2) { console.error("Passwords don't match. Nothing was changed."); process.exit(1); }
if (pw1.length < 10) { console.error("Use at least 10 characters. Nothing was changed."); process.exit(1); }

const salt = randomBytes(16);
const hash = `scrypt$${salt.toString("base64")}$${scryptSync(pw1, salt, 64).toString("base64")}`;
setEnv("ADMIN_EMAIL", email);
setEnv("ADMIN_PASSWORD_HASH", hash);
console.log(`\nDone. Admin login set for ${email}. Only a scrambled version of the password was saved.`);
console.log("Tell Claude it's done so the site is redeployed with the new login.");
