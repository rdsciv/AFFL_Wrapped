declare module "cloudflare:workers" {
  // The real binding type is supplied by the Cloudflare build environment.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: Record<string, unknown> & { DB?: any };
}
