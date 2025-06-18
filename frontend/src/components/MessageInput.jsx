const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!text.trim() && !imagePreview) return;

  try {
    const res = await axiosInstance.get(`/users/${selectedUser._id}/public-key`);
    const { publicKey: base64PublicKey } = res.data;

    const recipientKey = await importPublicKey(base64PublicKey);
    const trimmedText = text.trim();
    let encryptedText = null;
    let encryptedImage = null;
    let imageKey = null;
    let iv = null;

    if (trimmedText) {
      encryptedText = await encryptText(recipientKey, trimmedText);
    }

    if (imagePreview) {
      const aesKey = await generateAESKey();
      const { encryptedImage: encImage, iv: ivStr } = await encryptImageWithAES(aesKey, imagePreview);
      encryptedImage = encImage;
      iv = ivStr;
      imageKey = await encryptAESKeyWithRSA(aesKey, recipientKey);
    }

    await sendMessage({
      text: encryptedText,
      image: encryptedImage,
      imageKey,
      iv,
    });

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  } catch (error) {
    console.error("Send failed", error);
    toast.error("Failed to send message");
  }
};
