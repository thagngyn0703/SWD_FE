function encoder64(value) {
  try {
    // Convert the value to a base64 encoded string
    return btoa(unescape(encodeURIComponent(value)));
  } catch (error) {
    console.error('Failed to encode string:', error);
    return null;
  }
}

function decoder64(value) {
  try {
    // Validate that the input string is base64
    if (!value || !/^[A-Za-z0-9+/=]+$/.test(value)) {
      throw new Error('Invalid base64 string');
    }
    // Decode the base64 string back to a normal string
    return decodeURIComponent(escape(atob(value)));
  } catch (error) {
    console.error('Failed to decode string:', error);
    return null;
  }
}
export { encoder64, decoder64 };
