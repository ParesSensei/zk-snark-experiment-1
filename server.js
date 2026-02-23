import express from "express";
import cors from "cors";
import fs from "fs";
import * as snarkjs from "snarkjs";
import { buildPoseidon } from "circomlibjs";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DOMAIN = 123456n;

// BLOCKCHAIN
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const verifierArtifact = JSON.parse(
  fs.readFileSync(
    "./blockchain/artifacts/contracts/Verifier.sol/Groth16Verifier.json"
  )
);

const verifier = new ethers.Contract(
  process.env.VERIFIER_ADDRESS,
  verifierArtifact.abi,
  wallet
);

// STORAGE 
function loadDB() {
  if (!fs.existsSync("commitments.json")) return {};
  return JSON.parse(fs.readFileSync("commitments.json"));
}

function saveDB(db) {
  fs.writeFileSync("commitments.json", JSON.stringify(db, null, 2));
}

// REGISTER 
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username & password required" });

    const db = loadDB();
    if (db[username])
      return res.status(400).json({ error: "user already exists" });

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const passwordBig = BigInt(password);
    const salt = BigInt(Math.floor(Math.random() * 1_000_000));

    const commitment = F.toString(
      poseidon([DOMAIN, passwordBig, salt])
    );

    db[username] = {
      salt: salt.toString(),
      commitment
    };

    saveDB(db);

    res.json({
      message: "REGISTER SUCCESS",
      username,
      commitment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "register failed" });
  }
});

// LOGIN 
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username & password required" });

    const db = loadDB();
    if (!db[username])
      return res.status(400).json({ error: "user not registered" });

    const salt = BigInt(db[username].salt);
    const commitment = db[username].commitment;

    const input = {
      password: password.toString(),
      salt: salt.toString(),
      commitment
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "./password_js/password.wasm",
      "./password.zkey"
    );

    const vKey = JSON.parse(
      fs.readFileSync("./verification_key.json")
    );

    const verified = await snarkjs.groth16.verify(
      vKey,
      publicSignals,
      proof
    );

    if (!verified)
      return res.status(400).json({ error: "invalid proof" });

    const calldata = await snarkjs.groth16.exportSolidityCallData(
      proof,
      publicSignals
    );

    const argv = calldata.replace(/["[\]\s]/g, "").split(",");

    const a = [argv[0], argv[1]];
    const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
    const c = [argv[6], argv[7]];
    const inputSol = [argv[8]];

    const onChainResult = await verifier.verifyProof(
      a,
      b,
      c,
      inputSol
    );

    res.json({
      message: "LOGIN SUCCESS",
      verified,
      onChainResult
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "login failed" });
  }
});

// SERVER 
app.listen(3000, () => {
  console.log("ZK Server running at http://localhost:3000");
});