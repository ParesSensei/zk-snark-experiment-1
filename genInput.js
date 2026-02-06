import { buildPoseidon } from "circomlibjs";
import fs from "fs";

const DOMAIN = 123456n;


const password = 540146636505681459n;
const salt = 777777n;

async function main() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // Poseidon(domain, password, salt)
  const commitment = F.toString(
    poseidon([DOMAIN, password, salt])
  );

  const input = {
    password: password.toString(),
    salt: salt.toString(),
    commitment: commitment
  };

  fs.writeFileSync("input.json", JSON.stringify(input, null, 2));
  console.log("input.json generated");
  console.log("commitment:", commitment);
}

main();
