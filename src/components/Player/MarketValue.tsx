async function getAveragePrice(player) {
  const { ageAtMint, positions, overall } = player.metadata;

  const priceData = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?limit=3&status=BOUGHT&type=PLAYER&ageMin=${
      parseInt(ageAtMint) - 1
    }&ageMax=${parseInt(ageAtMint) + 1}&overallMin=${
      parseInt(overall) - 1
    }&overallMax=${parseInt(overall) + 1}&positions=${
      positions[0]
    }&marketplace=all`
  ).then((res) => res.json());

  if (!priceData.length) return null;

  const averagePrice = Math.ceil(
    priceData.reduce((partialSum, a) => partialSum + a.price, 0) /
      priceData.length
  );

  return averagePrice;
}

export async function MarketValue({ player }) {
  const price = await getAveragePrice(player);
  if (!price) return 'Unavailable';
  return `> $${price}`;
}
