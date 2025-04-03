export async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
    return keyPair;
  }
  
  export async function exportPublicKey(key) {
    const spki = await crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(spki)));
  }
  
  export async function exportPrivateKey(key) {
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", key);
    return btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
  }
  
  export async function importPublicKey(base64Key) {
    const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "spki",
      binary,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );
  }
  
  export async function importPrivateKey(base64Key) {
    const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "pkcs8",
      binary,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
  }
  
  export async function encryptText(publicKey, text) {
    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }
  
  export async function decryptText(privateKey, base64Text) {
    const encryptedBytes = Uint8Array.from(atob(base64Text), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBytes
    );
    return new TextDecoder().decode(decrypted);
  }
  