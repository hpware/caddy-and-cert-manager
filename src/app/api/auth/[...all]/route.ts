import { auth } from "@/components/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET, PATCH, DELETE, PUT } = toNextJsHandler(auth);
