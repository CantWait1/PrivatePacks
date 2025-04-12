import AdminPanel from "@/app/components/admin-panel";
import Header from "../components/header";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Header></Header>
      <AdminPanel />
    </div>
  );
}
