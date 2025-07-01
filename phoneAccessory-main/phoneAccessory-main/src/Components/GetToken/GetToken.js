function getToken(str) {
    const array = document.cookie.split(';');
    
    for (let i = 0; i < array.length; i++) {
      let cookie = array[i].trim();
      if (cookie.startsWith(`${str}=`)) {
        return cookie.substring(str.length + 1);
      }
    }
    return null;
  }

  export { getToken };