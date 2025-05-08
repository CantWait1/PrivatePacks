export function hasRepeatedCharacters(text: string, threshold = 5): boolean {
  const regex = new RegExp(`(.)\\1{${threshold - 1},}`);
  return regex.test(text);
}

export function isAllCaps(text: string, minLength = 5): boolean {
  if (text.length < minLength) return false;
  return text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function hasExcessiveSpecialChars(
  text: string,
  threshold = 0.3
): boolean {
  const specialChars = text.replace(/[a-zA-Z0-9\s]/g, "");
  return specialChars.length / text.length > threshold;
}

export function hasExcessiveUrls(text: string, threshold = 2): boolean {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  return matches.length >= threshold;
}

export function isSpam(text: string): { isSpam: boolean; reason?: string } {
  if (hasRepeatedCharacters(text)) {
    return { isSpam: true, reason: "Too many repeated characters" };
  }

  if (isAllCaps(text)) {
    return { isSpam: true, reason: "Message is all caps" };
  }

  if (hasExcessiveSpecialChars(text)) {
    return { isSpam: true, reason: "Too many special characters" };
  }

  if (hasExcessiveUrls(text)) {
    return { isSpam: true, reason: "Too many URLs" };
  }

  return { isSpam: false };
}
