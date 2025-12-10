"use server";

import { db } from "@/db";
import { formulations } from "@/db/schema";

export async function getBiocharProductOptions() {
  const formulationsData = await db.select().from(formulations);

  return {
    formulations: formulationsData.map((f) => ({
      id: f.id,
      name: f.name,
    })),
  };
}
