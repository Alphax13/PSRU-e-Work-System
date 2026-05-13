import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    department?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      department: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    department: string;
  }
}
