import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Note: Run 'npm install @supabase/supabase-js' to resolve the missing module
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 [AUTH] Iniciando proceso de autenticación");
        console.log("📧 [AUTH] Email recibido:", credentials?.email);
        console.log(
          "🔑 [AUTH] Password recibido:",
          credentials?.password ? "[PRESENTE]" : "[AUSENTE]"
        );
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ [AUTH] Credenciales faltantes");
          return null;
        }

        try {
          console.log("🔍 [AUTH] Buscando usuario en Supabase...");
          // Get user from Supabase
          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .single();

          if (error) {
            console.log("❌ [AUTH] Error de Supabase:", error);
            return null;
          }
          if (!user) {
            console.log(
              "❌ [AUTH] Usuario no encontrado para email:",
              credentials.email
            );
            return null;
          }
          console.log("✅ [AUTH] Usuario encontrado:", {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            password_hash_length: user.password_hash?.length || 0,
          });

          // Verify password
          console.log("🔐 [AUTH] Verificando contraseña...");
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );
          console.log(
            "🔐 [AUTH] Resultado verificación contraseña:",
            isValidPassword
          );

          if (!isValidPassword) {
            console.log("❌ [AUTH] Contraseña inválida");
            return null;
          }

          // User authenticated successfully
          console.log("✅ [AUTH] Autenticación exitosa para:", user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          };
        } catch (error) {
          console.error("💥 [AUTH] Error en autenticación:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Función para verificar JWT y obtener usuario autenticado
export async function verifyJWT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name!,
      role: session.user.role,
      avatar: session.user.avatar,
    };
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}

// Función para verificar roles
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Función para verificar si es admin
export function isAdmin(userRole: string): boolean {
  return userRole === "ADMIN";
}

// Función para verificar si es manager o admin
export function isManagerOrAdmin(userRole: string): boolean {
  return ["ADMIN", "MANAGER"].includes(userRole);
}
