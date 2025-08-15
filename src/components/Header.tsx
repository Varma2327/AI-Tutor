// src/components/Header.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const session = await getServerSession(authOptions);
  return (
    <header className="h-16 border-b flex items-center justify-between px-4">
      <div className="font-semibold">StudyFetch Tutor</div>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <span className="text-sm text-gray-600 truncate max-w-[320px]">
              id: {(session.user as any).id} · {session.user.email}
            </span>
            <SignOutButton />
          </>
        ) : (
          <a href="/login" className="text-sm rounded border px-3 py-1">Log in</a>
        )}
      </div>
    </header>
  );
}
