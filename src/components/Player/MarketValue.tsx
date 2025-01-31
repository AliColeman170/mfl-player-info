import { getMarketPriceListingsForPlayer } from '@/data/listings';
import { Player } from '@/types/global.types';

async function getAveragePrice(player: Player) {
  const priceData = await getMarketPriceListingsForPlayer(player);

  if (!priceData.length) return null;

  const averagePrice = Math.ceil(
    priceData.reduce((partialSum, a) => partialSum + a.price, 0) /
      priceData.length
  );

  return averagePrice;
}

export async function MarketValue({ player }: { player: Player }) {
  const price = await getAveragePrice(player);
  if (!price) return 'Unavailable';
  return `> $${price}`;
}
