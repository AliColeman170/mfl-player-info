async function getMarketData(player) {
    const { ageAtMint, positions, overall } = player.metadata;
    const res = await fetch(`https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?limit=1&type=PLAYER&ageAtMintMin=${parseInt(ageAtMint)-1}&ageAtMintMax=${parseInt(ageAtMint)+1}&overallMin=${parseInt(overall)-1}&overallMax=${parseInt(overall)+1}&positions=${positions[0]}&status=AVAILABLE&sorts=listing.price&sortsOrders=ASC&view=full`)
    return res.json()
}

export async function MarketValue({player}) {
    const marketData = await getMarketData(player);
    if (!marketData[0]) return 'Unavailable' 
    return `> $${marketData[0].price}`
}