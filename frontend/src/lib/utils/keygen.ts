export function generateUniqueKey(length: number = 10): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 to avoid confusion
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  // Format as PG-XXXX-XXXX
  return `PG-${result.substring(0, 4)}-${result.substring(4, 8)}`;
}
