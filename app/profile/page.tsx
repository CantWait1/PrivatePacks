"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function ProfileIndexPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.username) {
      // Redirect to the user's profile page
      router.push(`/profile/${session.user.username}`);
    } else if (status === "unauthenticated") {
      // Redirect to sign in if not authenticated
      router.push("/sign-in");
    }
  }, [session, status, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="animate-spin text-white" size={32} />
      <span className="ml-2 text-white">Redirecting to your profile...</span>
    </div>
  );
}
