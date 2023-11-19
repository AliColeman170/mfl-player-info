export let nonces = [];

export function addNonce(nonce) {
  nonces.push(nonce);
  console.log("Nonces after adding: ", nonces);
}

export function checkNonce(nonce) {
  console.log("Nonce check: ", nonces.includes(nonce));
  return nonces.includes(nonce);
}

export function removeNonce(nonce) {
  nonces = nonces.filter((ele) => {
    return ele != nonce;
  });
  console.log("Nonces after removing: ", nonces);
}
