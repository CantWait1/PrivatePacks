import Announcements from "@/app/components/announcements";
import Header from "../components/header";

export default function AnnouncementsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Header></Header>
      <Announcements />
    </div>
  );
}
