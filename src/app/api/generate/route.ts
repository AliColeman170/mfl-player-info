import { addNonce } from "@/utils/nonces";
import { randomBytes } from "crypto";

export function GET() {
  const nonce = randomBytes(32).toString("hex");
  addNonce(nonce);

  return Response.json(
    { nonce },
    {
      status: 200,
    }
  );
}
