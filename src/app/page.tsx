import { redirect } from "next/navigation";

// Redirect root to the owner dashboard for demo purposes
export default function RootPage() {
  redirect("/dashboard");
}
