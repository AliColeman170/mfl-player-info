import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "MFL Player Card with Stats";
export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

// Image generation
export default async function Image({ params }: { params: { id: string } }) {
  const player = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${params.id}`
  ).then((res) => res.json());

  const {
    firstName,
    lastName,
    ageAtMint,
    height,
    preferredFoot,
    positions,
    pace,
    dribbling,
    passing,
    shooting,
    defense,
    physical,
  } = player.player.metadata;

  const metadata = {
    name: `${firstName} ${lastName}`,
    age: ageAtMint,
    height: `${height}cm`,
    foot: preferredFoot.toLowerCase(),
    position: positions.join(" / "),
  };

  const legendaryStyle = (key) => {
    if (player.player.metadata[key] >= 85) {
      return {
        marginTop: "0.25rem",
        backgroundColor: "#ca1afc",
        color: "#fff",
        borderRadius: "0.5rem",
        fontWeight: 500,
        lineHeight: "1.5rem",
        padding: "0.75rem",
        fontSize: "1.25rem",
      };
    }
    if (player.player.metadata[key] >= 75) {
      return {
        marginTop: "0.25rem",
        backgroundColor: "#016bd5",
        color: "#fff",
        borderRadius: "0.5rem",
        fontWeight: 500,
        lineHeight: "1.5rem",
        padding: "0.75rem",
        fontSize: "1.25rem",
      };
    }
    if (player.player.metadata[key] >= 65) {
      return {
        marginTop: "0.25rem",
        backgroundColor: "#35ae25",
        color: "#fff",
        borderRadius: "0.5rem",
        fontWeight: 500,
        lineHeight: "1.5rem",
        padding: "0.75rem",
        fontSize: "1.25rem",
      };
    }
    return {
      marginTop: "0.25rem",
      backgroundColor: "#e2e8f0",
      color: "#0f172a",
      borderRadius: "0.5rem",
      fontWeight: 500,
      lineHeight: "1.5rem",
      padding: "0.75rem",
      fontSize: "1.25rem",
    };
  };

  // Font
  const interBold = fetch(
    new URL("./assets/fonts/Inter-Bold.ttf", process.env.NEXT_SITE_URL)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      // ImageResponse JSX element
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
        <div tw="flex">
          <div tw="flex w-full py-12 px-32 items-center justify-between">
            <div tw="flex flex-col w-1/2 pr-16 -mt-4">
              <div tw="flex flex-col">
                <div tw="flex text-white">
                  <svg
                    style={{
                      width: "112px",
                      height: "36px",
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
                <div tw="flex mt-1.5 leading-4 text-white text-2xl font-bold tracking-tighter">
                  Player Info
                </div>
              </div>
              <div tw="flex mt-12">
                <div tw="flex flex-col flex-2">
                  <dt tw="text-xl font-semibold leading-none text-slate-400 uppercase">
                    Name
                  </dt>
                  <dd tw="text-2xl leading-none text-slate-200 capitalize">
                    {metadata.name}
                  </dd>
                </div>
                <div tw="flex flex-col flex-1">
                  <dt tw="text-xl font-semibold leading-none text-slate-400 uppercase">
                    Age
                  </dt>
                  <dd tw="text-2xl leading-none text-slate-200 capitalize">
                    {metadata.age}
                  </dd>
                </div>
              </div>
              <div tw="flex py-2 mt-2">
                <div tw="flex flex-col flex-2">
                  <dt tw="text-xl font-semibold leading-none text-slate-400 uppercase mt-2">
                    Height
                  </dt>
                  <dd tw="text-2xl leading-none text-slate-200 capitalize">
                    {metadata.height}
                  </dd>
                </div>
                <div tw="flex flex-col flex-1">
                  <dt tw="text-xl font-semibold leading-none text-slate-400 uppercase mt-2">
                    Foot
                  </dt>
                  <dd tw="text-2xl leading-none text-slate-200 capitalize">
                    {metadata.foot}
                  </dd>
                </div>
              </div>
              <div tw="flex py-2 mt-2">
                <div tw="flex flex-col">
                  <dt tw="text-xl font-semibold leading-none text-slate-400 uppercase mt-2">
                    Position
                  </dt>
                  <dd tw="text-2xl leading-none text-slate-200 capitalize">
                    {metadata.position}
                  </dd>
                </div>
              </div>
              {!positions.includes("GK") && (
                <div tw="flex mt-12">
                  <div tw="flex flex-col items-center justify-center pr-4">
                    <div tw="flex text-xl text-center font-semibold tracking-wide text-slate-400 uppercase">
                      PAC
                    </div>
                    <div tw="flex" style={legendaryStyle("pace")}>
                      {pace}
                    </div>
                  </div>
                  <div tw="flex flex-col items-center justify-center pr-4">
                    <div tw="flex text-xl text-center font-semibold tracking-wide text-slate-400 uppercase">
                      DRI
                    </div>
                    <div tw="flex" style={legendaryStyle("dribbling")}>
                      {dribbling}
                    </div>
                  </div>
                  <div tw="flex flex-col items-center justify-center pr-4">
                    <div tw="flex text-xl text-center font-semibold tracking-wide text-slate-400 uppercase">
                      PAS
                    </div>
                    <div tw="flex" style={legendaryStyle("dribbling")}>
                      {passing}
                    </div>
                  </div>
                  <div tw="flex flex-col items-center justify-center pr-4">
                    <div tw="flex text-xl text-center font-semibold tracking-wide text-slate-400 uppercase">
                      SHO
                    </div>
                    <div tw="flex" style={legendaryStyle("shooting")}>
                      {shooting}
                    </div>
                  </div>
                  <div tw="flex flex-col items-center justify-center pr-4">
                    <div tw="flex text-xl text-center font-semibold tracking-wide text-slate-400 uppercase">
                      DEF
                    </div>
                    <div tw="flex" style={legendaryStyle("defense")}>
                      {defense}
                    </div>
                  </div>
                  <div tw="flex flex-col items-center justify-center">
                    <div tw="flex text-xl text-center font-semibold tracking-wide text-slate-400 uppercase">
                      PHY
                    </div>
                    <div tw="flex" style={legendaryStyle("physical")}>
                      {physical}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div tw="flex">
              <img
                tw="-mt-8"
                width="384"
                height="561"
                src={`https://d13e14gtps4iwl.cloudfront.net/players/${params.id}/card_512.png`}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
      fonts: [
        {
          name: "Inter",
          data: await interBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
