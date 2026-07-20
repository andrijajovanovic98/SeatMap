import { AdminUsers } from "@/components/AdminUsers";
import { LanguageProvider } from "@/context/LanguageContext";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  // Middleware only proves the visitor is signed in; non-admins are bounced here.
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  return (
    <LanguageProvider>
      <AdminUsers />
    </LanguageProvider>
  );
}
