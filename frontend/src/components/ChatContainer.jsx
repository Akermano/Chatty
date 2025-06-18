{message.text && privateKey ? (
  <p>{decryptText(privateKey, message.text).then(t => t)}</p>
) : (
  <p>{message.text}</p>
)}

{message.image && message.imageKey && message.iv && privateKey && (
  <img
    src=""
    alt="Encrypted Image"
    onLoad={async (e) => {
      const aesKey = await decryptAESKeyWithRSA(message.imageKey, privateKey);
      const decrypted = await decryptImageWithAES(aesKey, message.image, message.iv);
      e.target.src = decrypted;
    }}
    style={{ width: "200px", borderRadius: "8px" }}
  />
)}
