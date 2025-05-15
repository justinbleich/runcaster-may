declare module 'next/server' {
  export class NextRequest extends Request {
    json(): Promise<any>;
    text(): Promise<string>;
    formData(): Promise<FormData>;
    blob(): Promise<Blob>;
    arrayBuffer(): Promise<ArrayBuffer>;
    readonly cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      set(name: string, value: string, options?: { path?: string; maxAge?: number; expires?: Date; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }): void;
      delete(name: string): void;
      has(name: string): boolean;
    };
    readonly nextUrl: URL;
  }

  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    static rewrite(destination: string | URL, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
  }
} 