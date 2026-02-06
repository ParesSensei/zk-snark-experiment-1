pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

template PasswordVerifier() {

    // PRIVATE
    signal input password;
    signal input salt;

    // PUBLIC
    signal input commitment;

    // Optional: basic range constraint (e.g. password < 2^64)
    component pwBits = Num2Bits(64);
    pwBits.in <== password;

    component saltBits = Num2Bits(64);
    saltBits.in <== salt;

    // Poseidon with domain separation
    component hash = Poseidon(3);

    hash.inputs[0] <== 123456; // domain separator
    hash.inputs[1] <== password;
    hash.inputs[2] <== salt;

    hash.out === commitment;
}

component main { public [commitment] } = PasswordVerifier();
