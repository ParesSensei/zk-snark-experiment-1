

# New guide zk snark project 3

--- 

## 📦 PHASE 1 — CIRCUIT → PROOF

## 📦 1 Compile circuit
Command: 
```bash 
circom password.circom --r1cs --wasm
```
Output:
```bash 
password.r1cs       →constraintsystem
password_js/        → wasm + witness generator
```

Makna: 

| file | fungsi                          |
|:----|:--------------------------------|
| .r1cs   | representasi matematika circuit |
| .wasm   | engine pembuat witness          |
| generate_witness.js | helper buat witness             |

---

## 2 Setup trusted setup (Powers of Tau)
Create ceremony file
```bash 
snarkjs powersoftau new bn128 12 pot12_0000.ptau
```
Makna:
- bn128 → curve Groth16
- 12 → size circuit (~2^12 constraints) 

Contribute entropy
```bash 
snarkjs powersoftau contribute pot12_0000.ptau pot12_final.ptau
```
fungsi: 
- mengamankan toxic waste
- membuat parameter publik final

--- 

## 3 Circuit-specific setup (Groth16)
```bash 
snarkjs groth16 setup password.r1cs pot12_final.ptau password.zkey
```
Output:
```bash 
password.zkey
```
ini file paling penting -> Berisi proving key + verifying key

---

## 4 Export verification key
```bash 
snarkjs zkeyexport verificationkey password.zkey verification_key.json
```
Dipakai untuk:
- generate Solidity verifier
- offchain verify

---

## 5 Generate Solidity verifier
```bash 
snarkjs zkeyexport solidityverifier password.zkey Verifier.sol
```
Output:
```bash
 Verifier.sol
 ```
ini yang akan dipakai dicopy ke hardhat

---

# INPUT & WITNESS

---

## 6️ Generate input.json (commitment)
dari: 
```bash
node genInput.js
```
Output:
```bash
input.json
Commitment: XXXXX
```
isinya:
```bash 
password
salt
commitment
```
ini harus konsisten dengan circuit

--- 

## 7 Generate witness
Masuk folder wasm:
```bash
cd password_js
```
Run:
```bash
node generate_witness.js password.wasm ../input.json ../witness.wtns
```
Output:
```bash
witness.wtns
```
Makna:
- witness = semua nilai intermediate circuit

---
## 8 Generate proof