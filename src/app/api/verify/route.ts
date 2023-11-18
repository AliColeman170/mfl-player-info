import { fcl } from "@/flow/api";
import { checkNonce, removeNonce } from "@/utils/nonces";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const nonce = data.nonce;

  if (!checkNonce(nonce)) {
    return Response.json(
      { verified: false },
      {
        status: 200,
      }
    );
  }

  removeNonce(nonce);

  const verified = await fcl.AppUtils.verifyAccountProof("MFLPlayerInfo", data);

  return Response.json(
    { verified },
    {
      status: 200,
    }
  );
}
