export class CryptoService {
  public static async getHash(value: unknown): Promise<string> {
    const msgUint8 = new TextEncoder().encode(JSON.stringify(value));
    const hashBuffer = await globalThis.crypto.subtle.digest(
      'SHA-256',
      msgUint8,
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  public static async generateRSAKeys(): Promise<CryptoKeyPair> {
    return globalThis.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-512',
      },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  public static importEd25519Key(
    jwkString: string,
    type: 'public' | 'private',
  ): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkString) as JsonWebKey;
    const usages: KeyUsage[] = type === 'public' ? ['verify'] : ['sign'];

    return globalThis.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'Ed25519',
      },
      true,
      usages,
    );
  }

  public static async generateEd25519Keys(
    seedPhrase?: string,
  ): Promise<CryptoKeyPair> {
    if (!seedPhrase) {
      return globalThis.crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
        'sign',
        'verify',
      ]) as unknown as CryptoKeyPair;
    }

    const encoder = new TextEncoder();
    const seedBytes = encoder.encode(seedPhrase);
    const hashBuffer = await globalThis.crypto.subtle.digest(
      'SHA-256',
      seedBytes,
    );
    const privateKeyBytes = new Uint8Array(hashBuffer);

    const pkcs8Buffer = new Uint8Array(16 + privateKeyBytes.length);
    pkcs8Buffer.set(
      [
        0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
        0x04, 0x22, 0x04, 0x20,
      ],
      0,
    );
    pkcs8Buffer.set(privateKeyBytes, 16);

    const privateKey = await globalThis.crypto.subtle.importKey(
      'pkcs8',
      pkcs8Buffer.buffer,
      { name: 'Ed25519' },
      true,
      ['sign'],
    );

    const jwk = await globalThis.crypto.subtle.exportKey('jwk', privateKey);
    delete jwk.d;
    delete jwk.key_ops;

    const publicKey = await globalThis.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'Ed25519' },
      true,
      ['verify'],
    );

    return { publicKey, privateKey };
  }

  public static async exportKey(key: CryptoKey | string): Promise<string> {
    const cryptoKey =
      key instanceof CryptoKey ? key : (JSON.parse(key) as CryptoKey);

    const exportedKey = await globalThis.crypto.subtle.exportKey(
      'jwk',
      cryptoKey,
    );
    exportedKey.alg = undefined;

    return JSON.stringify(exportedKey);
  }

  public static async importRSAKey(
    jwkString: string,
    type: 'public' | 'private',
  ): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkString) as JsonWebKey;
    const usages: KeyUsage[] = type === 'public' ? ['encrypt'] : ['decrypt'];

    return globalThis.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-512',
      },
      true,
      usages,
    );
  }

  public static async signByEd25519(
    key: CryptoKey,
    payload: unknown,
  ): Promise<string | undefined> {
    try {
      const dataToSign = new TextEncoder().encode(JSON.stringify(payload));
      const signature = await globalThis.crypto.subtle.sign(
        {
          name: 'Ed25519',
        },
        key,
        dataToSign,
      );
      return exportEncryptedPayload(signature);
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public static verifyByEd25519(
    key: CryptoKey,
    payload: unknown,
    signatureStr: string,
  ): Promise<boolean> | boolean {
    try {
      const dataToVerify = new TextEncoder().encode(JSON.stringify(payload));
      const signature = importEncryptedPayload(signatureStr);
      return globalThis.crypto.subtle.verify(
        {
          name: 'Ed25519',
        },
        key,
        signature,
        dataToVerify,
      );
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public static async encryptByRSAKey(
    key: CryptoKey,
    payload: unknown,
  ): Promise<string | undefined> {
    try {
      const encryptedData = await globalThis.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        key,
        new TextEncoder().encode(JSON.stringify(payload)),
      );
      return exportEncryptedPayload(encryptedData);
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public static async decryptByRSAKey<T = string>(
    key: CryptoKey,
    payload: string,
  ): Promise<T | undefined> {
    try {
      const decryptedPayload = importEncryptedPayload(payload);
      const decryptedData = await globalThis.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        key,
        decryptedPayload,
      );
      const string = new TextDecoder().decode(decryptedData);
      return JSON.parse(string) as T;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public static async checkEd25519Keys(pair: CryptoKeyPair) {
    const payload = globalThis.crypto.randomUUID();

    const signedPayload = await CryptoService.signByEd25519(
      pair.privateKey,
      payload,
    );

    if (!signedPayload) throw Error('ownerKeyPair.publicKey is not valid');

    return await CryptoService.verifyByEd25519(
      pair.publicKey,
      payload,
      signedPayload,
    );
  }
}

function exportEncryptedPayload(payload: ArrayBuffer): string {
  const uint8Array = new Uint8Array(payload);
  return JSON.stringify(uint8Array.toString());
}

function importEncryptedPayload(payload: string): ArrayBuffer {
  const string = JSON.parse(payload) as string;
  const numbers = string.split(',').map((number) => Number(number));
  return new Uint8Array(numbers).buffer;
}
