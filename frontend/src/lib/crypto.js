// 🔐 RSA KEY UTILITIES

export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
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
  if (!publicKey || !text) return null;
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoded
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptText(privateKey, base64Text) {
  if (!privateKey || !base64Text) return null;
  try {
    const encryptedBytes = Uint8Array.from(atob(base64Text), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBytes
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Decryption error]";
  }
}

// 🔐 LOCAL KEY STORAGE

export async function getOrCreateKeyPair() {
  const cachedPublic = localStorage.getItem("publicKey");
  const cachedPrivate = localStorage.getItem("privateKey");

  if (cachedPublic && cachedPrivate) {
    return {
      publicKey: await importPublicKey(cachedPublic),
      privateKey: await importPrivateKey(cachedPrivate),
    };
  }

  const keyPair = await generateKeyPair();
  const pub = await exportPublicKey(keyPair.publicKey);
  const priv = await exportPrivateKey(keyPair.privateKey);

  localStorage.setItem("publicKey", pub);
  localStorage.setItem("privateKey", priv);

  return keyPair;
}

export function getStoredPublicKey() {
  return localStorage.getItem("publicKey") || null;
}

export function getStoredPrivateKey() {
  return localStorage.getItem("privateKey") || null;
}

// 🔐 AES IMAGE ENCRYPTION + RSA KEY WRAPPING

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function encryptImageData(publicKey, base64Image) {
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const imageBytes = new TextEncoder().encode(base64Image);

  const encryptedImage = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    imageBytes
  );

  const exportedAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    exportedAesKey
  );

  return {
    encryptedImage: arrayBufferToBase64(encryptedImage),
    encryptedKey: arrayBufferToBase64(encryptedAesKey),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptImageData(privateKey, encryptedImage, encryptedKey, iv) {
  const aesKeyRaw = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0))
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyRaw,
    { name: "AES-GCM" },
    true,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)),
    },
    aesKey,
    Uint8Array.from(atob(encryptedImage), c => c.charCodeAt(0))
  );

  return new TextDecoder().decode(decrypted);
}
