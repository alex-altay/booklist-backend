function base64urlToBuffer(base64url: string) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  return Buffer.from(padded, 'base64')
}

function bufferToBase64url(buffer: Buffer | Uint8Array | ArrayBuffer): string {
  const base64 = Buffer.from(buffer as WithImplicitCoercion<ArrayBufferLike>).toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function assertToBase64Url(
  s: string | ArrayBuffer | Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>,
) {
  return typeof s === 'string' ? s : bufferToBase64url(s)
}

export { base64urlToBuffer, bufferToBase64url, assertToBase64Url }
