import { redirect } from "next/navigation";

/** The inventory lives in Profile Studio now. */
export default function InventoryPage() {
  redirect("/studio");
}
