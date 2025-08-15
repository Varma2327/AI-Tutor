// src/app/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UploadBox from "@/components/UploadBox";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New upload</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Select a PDF to start chatting. You can always find your previous uploads on the dashboard.
        </p>
      </div>
      <UploadBox />
    </main>
  );
}
