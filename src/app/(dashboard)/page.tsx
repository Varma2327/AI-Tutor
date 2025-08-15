// src/app/(dashboard)/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;

  const docs = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, pageCount: true, createdAt: true },
  });

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your PDFs</h1>
        {/* Upload button goes to the home uploader (adjust if yours is elsewhere) */}
        <Link href="/?upload=1" className="btn-ghost">Upload</Link>
      </div>

      {docs.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No documents yet — upload one to get started.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => (
            <Link
              key={d.id}
              href={`/doc/${d.id}`}
              className="card p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{d.title || "(untitled)"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {d.pageCount} pages ·{" "}
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 dark:text-brand-300">
                  📄
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
