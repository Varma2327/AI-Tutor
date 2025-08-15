// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// IMPORTANT: export both GET and POST from a single catch-all route
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
