import { addNonce } from "@/utils/nonces";
import crypto from "crypto";

export function GET() {
  const nonce = crypto.randomBytes(32).toString("hex");
  addNonce(nonce);

  return Response.json(
    { nonce },
    {
      status: 200,
    }
  );
}
