// Temporary shim for deprecated expo-file-system readAsStringAsync until migration to new File API.
// Centralizes base64 reading to switch implementation later.
// TODO: Replace with new File/Directory API once app upgrades past legacy boundary.
import * as LegacyFS from 'expo-file-system/legacy';

export async function readFileBase64(uri: string): Promise<string> {
  // Using legacy module avoids deprecation warning spam from direct import.
  return LegacyFS.readAsStringAsync(uri, { encoding: LegacyFS.EncodingType.Base64 });
}

export async function readFileUtf8(uri: string): Promise<string> {
  return LegacyFS.readAsStringAsync(uri, { encoding: LegacyFS.EncodingType.UTF8 });
}

export default readFileBase64;