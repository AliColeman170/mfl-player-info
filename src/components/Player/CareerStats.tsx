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
      className="text-xs @[16rem]/inner:text-base font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
    >
      {children}
    </dt>
  );
}
function CareerStatItemValue({ children }: { children: React.ReactNode }) {
  return (
    <dd className="text-sm @[16rem]/inner:text-base text-right @sm/main:text-center @sm/main:pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
      {children}
    </dd>
  );
}

function CareerStatItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-3 gap-y-2 items-center grid grid-cols-[2fr_1fr] @sm/main:grid-cols-1 @sm/main:divide-y @sm/main:divide-slate-200 @sm/main:dark:divide-slate-700">
      {children}
    </div>
  );
}

export async function CareerStats({ player }) {
  const careerStats = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${player.id}/competitions`
  ).then((res) => res.json());

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

  const isGoalkeeper = player.metadata.positions.includes("GK");

  if (stats.nbMatches === 0) return null;
  return (
    <div className="col-start-1 col-span-3">
      <h2 className="font-bold text-lg mb-1 @sm/main:hidden">Career Stats</h2>
      <dl className="@container/inner divide-y divide-slate-200 dark:divide-slate-700 @sm/main:divide-y-0 grid grid-cols-1 @sm/main:grid-cols-none @sm/main:grid-flow-col-dense @sm/main:text-center @sm/main:rounded-xl @sm/main:ring-1 @sm/main:ring-slate-950 @sm/main:dark:ring-slate-700 @sm/main:shadow-2xl @sm/main:shadow-slate-300 @sm/main:dark:shadow-slate-900">
        <CareerStatItem>
          <CareerStatItemTitle title="Matches Played">
            <span className="@sm/main:hidden">Matches Played</span>
            <span className="hidden @sm/main:inline-block">MP</span>
          </CareerStatItemTitle>
          <CareerStatItemValue>{stats.nbMatches}</CareerStatItemValue>
        </CareerStatItem>
        {isGoalkeeper ? (
          <>
            <CareerStatItem>
              <CareerStatItemTitle title="Goals Conceded">
                <span className="@sm/main:hidden">Goals Conceded</span>
                <span className="hidden @sm/main:inline-block">GC</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.goalsConceded}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Saves">
                <span className="@sm/main:hidden">Saves</span>
                <span className="hidden @sm/main:inline-block">SV</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.saves}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Saves Per 90'">
                <span className="@sm/main:hidden">Saves Per 90&apos;</span>
                <span className="hidden @sm/main:inline-block">SVP90</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.savesPerGame === Infinity
                  ? "–"
                  : `${stats.savesPerGame}'`}
              </CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Minutes per Goal Against">
                <span className="@sm/main:hidden">
                  Minutes Per Goal Against
                </span>
                <span className="hidden @sm/main:inline-block">MPGA</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.minutesPerGoalAgainst === Infinity
                  ? "–"
                  : `${stats.minutesPerGoalAgainst}'`}
              </CareerStatItemValue>
            </CareerStatItem>
          </>
        ) : (
          <>
            <CareerStatItem>
              <CareerStatItemTitle title="Goals">
                <span className="@sm/main:hidden">Goals</span>
                <span className="hidden @sm/main:inline-block">G</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.goals}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Assists">
                <span className="@sm/main:hidden">Assists</span>
                <span className="hidden @sm/main:inline-block">A</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>{stats.assists}</CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Goals Contributions">
                <span className="@sm/main:hidden">Goals Contributions</span>
                <span className="hidden @sm/main:inline-block">G+A</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.goalContributions}
              </CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Minutes per Goal">
                <span className="@sm/main:hidden">Minutes Per Goal</span>
                <span className="hidden @sm/main:inline-block">MPG</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.minutesPerGoal === Infinity
                  ? "–"
                  : `${stats.minutesPerGoal}'`}
              </CareerStatItemValue>
            </CareerStatItem>
            <CareerStatItem>
              <CareerStatItemTitle title="Minutes Per Goal Contribution">
                <span className="@sm/main:hidden">
                  Minutes Per Goal Contribution
                </span>
                <span className="hidden @sm/main:inline-block">MPGA</span>
              </CareerStatItemTitle>
              <CareerStatItemValue>
                {stats.minutesPerGoalContribution === Infinity
                  ? "–"
                  : `${stats.minutesPerGoalContribution}'`}
              </CareerStatItemValue>
            </CareerStatItem>
          </>
        )}
      </dl>
    </div>
  );
}
