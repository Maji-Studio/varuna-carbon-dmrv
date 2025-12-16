import { redirect } from "next/navigation";

// Feedstock is now handled by the Feedstock Delivery form
// Redirect to the main data-entry page
export default function EditFeedstockPage() {
  redirect("/data-entry");
}
