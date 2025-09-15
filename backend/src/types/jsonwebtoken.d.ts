declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
  }

  export function sign(payload: any, secret: string, options?: SignOptions): string;
  export function verify(token: string, secret: string): any;

  const _default: {
    sign: typeof sign;
    verify: typeof verify;
  };
  export default _default;
}

