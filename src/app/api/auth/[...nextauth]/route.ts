import { auth } from "@/lib/auth";
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

export async function getSession() {
  return auth();
}
