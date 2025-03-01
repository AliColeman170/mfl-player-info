import { getCareerStatsByPlayer } from '@/data/players';
import { Player, PlayerCompetitionStats } from '@/types/global.types';

function CareerStatItemTitle({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <dt
      title={title}
      className='text-muted-foreground py-2 text-xs leading-none font-semibold uppercase @[16rem]/inner:text-base'
    >
      {children}
    </dt>
  );
}
function CareerStatItemValue({ children }: { children: React.ReactNode }) {
  return (
    <dd className='py-3 text-right text-sm leading-none capitalize @[16rem]/inner:text-base @sm/main:py-4 @sm/main:text-center'>
      {children}
    </dd>
  );
}

function CareerStatItem({ children }: { children: React.ReactNode }) {
  return (
    <div className='@sm/main:divide-border grid grid-cols-[2fr_1fr] items-center @sm/main:grid-cols-1 @sm/main:divide-y'>
      {children}
    </div>
  );
}

export async function CareerStats({ player }: { player: Player }) {
  const careerStats: PlayerCompetitionStats[] =
    await getCareerStatsByPlayer(player);

  const competitionStats = careerStats.map((competition) => competition.stats);

  const nbMatches = competitionStats.reduce(
    (accumulator, currentValue) => accumulator + currentValue.nbMatches,
    0
  );

  const goals = competitionStats.reduce(
    (accumulator, currentValue) => accumulator + currentValue.goals,
    0
  );

  const assists = competitionStats.reduce(
    (accumulator, currentValue) => accumulator + currentValue.assists,
    0
  );

  const wins = competitionStats.reduce(
    (accumulator, currentValue) => accumulator + currentValue.wins,
    0
  );

  const minutes = competitionStats.reduce(
    (accumulator, currentValue) => accumulator + currentValue.time / 60,
    0
  );

  const saves = competitionStats.reduce(
    (accumulator, currentValue) => accumulator + currentValue.saves,
    0
  );

  const goalsConceded = competitionStats.reduce(
    (accumulator, currentValue) => accumulator + currentValue.goalsConceded,
    0
  );

  const stats = {
    nbMatches,
    goals,
    assists,
    goalContributions: goals + assists,
    minutesPerGoal: Math.round(minutes / goals),
    minutesPerGoalContribution: Math.round(minutes / (goals + assists)),
    wins,
    minutes,
    saves,
    goalsConceded,
    savesPerGame:
      Math.round((saves / (minutes / 90) + Number.EPSILON) * 100) / 100,
    minutesPerGoalAgainst: Math.round(minutes / goalsConceded),
  };

  const isGoalkeeper = player.metadata.positions.includes('GK');

  if (stats.nbMatches === 0)
    return (
      <div className='col-span-3 col-start-1 place-content-center'>
        <p className='py-8 text-center'>No games played</p>
      </div>
    );
  return (
    <div className='col-span-3 col-start-1'>
      <h2 className='mb-1 text-lg font-bold @sm/main:hidden'>Career Stats</h2>
      <dl className='divide-border @sm/main:ring-border @container/inner grid grid-cols-1 divide-y @sm/main:grid-flow-col-dense @sm/main:grid-cols-none @sm/main:divide-y-0 @sm/main:rounded-lg @sm/main:text-center @sm/main:ring-1'>
        <CareerStatItem>
          <CareerStatItemTitle title='Matches Played'>
            <span className='@sm/main:hidden'>Matches Played</span>
            <span className='hidden @sm/main:inline-block'>MP</span>
          </CareerStatItemTitle>
          <CareerStatItemValue>{stats.nbMatches}</CareerStatItemValue>
        </CareerStatItem>
        {isGoalkeeper ? (
          <>
            <CareerStatItem>
              <CareerStatItemTitle title='Goals Conceded'>
                <span className='@sm/main:hidden'>Goals Conceded</span>
                <span className='hidden @sm/main:inline-block'>GC</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.goalsConceded}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title='Saves'>
                <span className='@sm/main:hidden'>Saves</span>
                <span className='hidden @sm/main:inline-block'>SV</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.saves}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Saves Per 90'">
                <span className='@sm/main:hidden'>Saves Per 90&apos;</span>
                <span className='hidden @sm/main:inline-block'>SVP90</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.savesPerGame === Infinity
                  ? '–'
                  : `${stats.savesPerGame}`}
              </CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title='Minutes per Goal Against'>
                <span className='@sm/main:hidden'>
                  Minutes Per Goal Against
                </span>
                <span className='hidden @sm/main:inline-block'>MPGA</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.minutesPerGoalAgainst === Infinity
                  ? '–'
                  : `${stats.minutesPerGoalAgainst}'`}
              </CareerStatItemValue>
            </CareerStatItem>
          </>
        ) : (
          <>
            <CareerStatItem>
              <CareerStatItemTitle title='Goals'>
                <span className='@sm/main:hidden'>Goals</span>
                <span className='hidden @sm/main:inline-block'>G</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.goals}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title='Assists'>
                <span className='@sm/main:hidden'>Assists</span>
                <span className='hidden @sm/main:inline-block'>A</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.assists}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title='Goals Contributions'>
                <span className='@sm/main:hidden'>Goals Contributions</span>
                <span className='hidden @sm/main:inline-block'>G+A</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.goalContributions}
              </CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title='Minutes per Goal'>
                <span className='@sm/main:hidden'>Minutes Per Goal</span>
                <span className='hidden @sm/main:inline-block'>MPG</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.minutesPerGoal === Infinity
                  ? '–'
                  : `${stats.minutesPerGoal}'`}
              </CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title='Minutes Per Goal Contribution'>
                <span className='@sm/main:hidden'>
                  Minutes Per Goal Contribution
                </span>
                <span className='hidden @sm/main:inline-block'>MPGA</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.minutesPerGoalContribution === Infinity
                  ? '–'
                  : `${stats.minutesPerGoalContribution}'`}
              </CareerStatItemValue>
            </CareerStatItem>
          </>
        )}
      </dl>
    </div>
  );
}
