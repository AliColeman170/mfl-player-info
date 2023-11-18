import airtable from "@/utils/airtable";

async function getAveragePrice(player) {
  const { ageAtMint, positions, overall } = player.metadata;

  const result = await airtable
    .select({
      maxRecords: 3,
      filterByFormula: `AND(OR(Age = ${
        ageAtMint - 1
      }, Age = ${ageAtMint},Age = ${ageAtMint + 1}),OR(Overall = ${
        overall - 1
      },Overall = ${overall},Overall = ${overall + 1}),FIND("${
        positions[0]
      }", Postions))`,
      fields: [
        "id",
        "Price",
        "DateTime Purchase",
        "Player Name",
        "Overall",
        "Age",
        "Postions",
      ],
      sort: [{ field: "DateTime Purchase", direction: "desc" }],
    })
    .all()
    .then((records) => {
      return records.map((record) => {
        return record.get("Price");
      });
    });

  //  This is the old code to fetch marketplace data
  //   const res = await fetch(
  //     `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?limit=1&type=PLAYER&ageAtMintMin=${
  //       parseInt(ageAtMint) - 1
  //     }&ageAtMintMax=${parseInt(ageAtMint) + 1}&overallMin=${
  //       parseInt(overall) - 1
  //     }&overallMax=${parseInt(overall) + 1}&positions=${
  //       positions[0]
  //     }&status=AVAILABLE&sorts=listing.price&sortsOrders=ASC&view=full`
  //   );
  if (!result.length) return null;
  return Math.ceil(
    (result as number[]).reduce((partialSum, a) => partialSum + a, 0) /
      result.length
  );
}

export async function MarketValue({ player }) {
  const price = await getAveragePrice(player);
  if (!price) return "Unavailable";
  return `> $${price}`;
}
