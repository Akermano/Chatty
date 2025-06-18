// RSA KEY UTILITIES

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

// MESSAGE ENCRYPTION

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
  try {
    const encryptedBytes = Uint8Array.from(atob(base64Text), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBytes
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "[decryption error]";
  }
}

// AES UTILITIES FOR IMAGE ENCRYPTION

export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptImageWithAES(key, imageData) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(imageData);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return {
    encryptedImage: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptImageWithAES(key, encryptedImage, ivBase64) {
  const encryptedBytes = Uint8Array.from(atob(encryptedImage), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBytes
  );
  return new TextDecoder().decode(decrypted);
}

export async function encryptAESKeyWithRSA(aesKey, rsaPublicKey) {
  const raw = await crypto.subtle.exportKey("raw", aesKey);
  return await encryptText(rsaPublicKey, btoa(String.fromCharCode(...new Uint8Array(raw))));
}

export async function decryptAESKeyWithRSA(encryptedKey, rsaPrivateKey) {
  const decryptedBase64 = await decryptText(rsaPrivateKey, encryptedKey);
  const raw = Uint8Array.from(atob(decryptedBase64), c => c.charCodeAt(0));
  return await crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["decrypt"]);
}

// LOCAL STORAGE

export async function getOrCreateKeyPair() {
  const cachedPublic = localStorage.getItem("publicKey");
  const cachedPrivate = localStorage.getItem("privateKey");

  if (cachedPublic && cachedPrivate) {
    const privateKey = await importPrivateKey(cachedPrivate);
    const publicKey = await importPublicKey(cachedPublic);
    return { publicKey, privateKey };
  } else {
    const keyPair = await generateKeyPair();
    const pub = await exportPublicKey(keyPair.publicKey);
    const priv = await exportPrivateKey(keyPair.privateKey);
    localStorage.setItem("publicKey", pub);
    localStorage.setItem("privateKey", priv);
    return keyPair;
  }
}

export function getStoredPublicKey() {
  return localStorage.getItem("publicKey") || null;
}

export function getStoredPrivateKey() {
  return localStorage.getItem("privateKey") || null;
}
