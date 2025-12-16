import { redirect } from "next/navigation";

// Feedstock is now handled by the Feedstock Delivery form
// Redirect to the unified feedstock delivery page
export default function FeedstockPage() {
  redirect("/data-entry/feedstock-delivery");
}
