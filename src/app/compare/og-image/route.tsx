import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const player1 = searchParams.get("player1");
  const player2 = searchParams.get("player2");
  const width = searchParams.get("width");
  const height = searchParams.get("height");

  // Font
  const interBold = fetch(
    new URL("./assets/fonts/Inter-Bold.ttf", process.env.NEXT_SITE_URL)
  ).then((res) => res.arrayBuffer());

  const defaultImage = await fetch(
    new URL("./assets/images/placeholder.png", process.env.NEXT_SITE_URL)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "#020617",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div tw="flex w-full h-full flex-col justify-between items-start pt-12 pb-16 px-16">
          <div tw="flex w-full justify-between items-center">
            <div tw="flex items-center">
              <div tw="flex text-white">
                <svg
                  style={{
                    width: "56px",
                    height: "18px",
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 55.541065 17.780001"
                  fill="currentColor"
                >
                  <g transform="translate(227.49086,-63.017615)">
                    <path
                      d="m -202.64966,63.017615 -3.5052,17.78 h -5.461 l 1.5748,-8.1026 -5.0038,6.5024 h -2.6416 l -2.7432,-6.4008 -1.6002,8.001 h -5.461 l 3.556,-17.78 h 4.8768 l 3.8608,9.4488 7.4422,-9.4488 z"
                      strokeWidth="0.26458332"
                    ></path>
                    <path
                      d="m -194.64548,67.538815 -0.6096,3.048 h 7.4168 l -0.9144,4.5212 h -7.3914 l -1.143,5.6896 h -5.9944 l 3.556,-17.78 h 14.4526 l -0.9144,4.5212 z"
                      strokeWidth="0.26458332"
                    ></path>
                    <path
                      d="m -183.35439,63.017615 h 5.9944 l -2.6162,13.1318 h 8.0264 l -0.9398,4.6482 h -14.0208 z"
                      strokeWidth="0.26458332"
                    ></path>
                  </g>
                </svg>
              </div>
              <div tw="flex leading-4 text-white text-xl font-bold tracking-tighter ml-2 pl-2 border-l border-white">
                Player Info
              </div>
            </div>
            <div tw="flex leading-4 text-white text-xl font-bold tracking-tighter">
              Player Comparison
            </div>
          </div>
          <div tw="flex w-full items-end justify-between px-24">
            <div tw="flex relative">
              <img
                tw={`${player1 ? "-mt-8" : ""}`}
                width={`${player1 ? "328" : "314"}`}
                height={`${player1 ? "480" : "436"}`}
                // @ts-ignore
                src={
                  player1
                    ? `https://d13e14gtps4iwl.cloudfront.net/players/${player1}/card_512.png`
                    : defaultImage
                }
              />
              {!player1 && (
                <div tw="absolute bottom-4 left-1/2 -ml-12 text-white text-6xl shadow-xs font-bold">
                  ???
                </div>
              )}
            </div>
            <div tw="flex items-center h-full text-white text-7xl">v</div>
            <div tw="flex relative">
              <img
                tw={`${player2 ? "-mt-8" : ""}`}
                width={`${player2 ? "328" : "314"}`}
                height={`${player2 ? "480" : "436"}`}
                // @ts-ignore
                src={
                  player2
                    ? `https://d13e14gtps4iwl.cloudfront.net/players/${player2}/card_512.png`
                    : defaultImage
                }
              />
              {!player2 && (
                <div tw="absolute bottom-4 left-1/2 -ml-12 text-white text-6xl shadow-xs font-bold">
                  ???
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: width ? parseInt(width, 10) : 1200,
      height: height ? parseInt(height, 10) : 630,
      fonts: [
        {
          name: "Inter-Bold",
          data: await interBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
