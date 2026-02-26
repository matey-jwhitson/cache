import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, image } = session.user;

  return (
    <div className="flex h-screen bg-zinc-950">
      <SidebarNav userName={name} userImage={image} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={name} userImage={image} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
