/**
 * Join Code Utility for EduShare Multi-device Connection
 * Converts standard entity IDs into alphanumeric, short shareable codes, e.g.
 * - USR-AL881 (User code)
 * - GRP-CS101 (Study group code)
 * - CH-CS221 (Chat channel code)
 * - NOT-BI963 (Lecture Note code)
 */

export function getJoinCode(prefix: 'USR' | 'GRP' | 'CH' | 'NOT', id: string): string {
  // Return consistent code based on the ID string
  const val = id.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  const numericSuffix = (val % 9000 + 1000).toString(); // Always 4 digits: 1000 - 9999
  
  // Extract 2 uppercase chars from the ID name
  let cleanId = id.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (cleanId.length < 2) {
    cleanId = (cleanId + 'XX').slice(0, 2);
  } else {
    cleanId = cleanId.slice(0, 2);
  }
  
  return `${prefix}-${cleanId}${numericSuffix}`;
}

export function parseJoinCode(code: string): { prefix: string; cleanPart: string } | null {
  const trimmed = code.trim().toUpperCase();
  const match = trimmed.match(/^(USR|GRP|CH|NOT)-([A-Z]{2}\d{4})$/);
  if (!match) return null;
  return {
    prefix: match[1],
    cleanPart: match[2],
  };
}
