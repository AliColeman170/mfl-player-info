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
      <dl className="grid grid-flow-col-dense text-center rounded-xl ring-1 ring-slate-950 dark:ring-slate-700 shadow-2xl shadow-slate-300 dark:shadow-slate-900">
        <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
          <dt
            title="Matches Played"
            className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
          >
            MP
          </dt>
          <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
            {stats.nbMatches}
          </dd>
        </div>
        {isGoalkeeper ? (
          <>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Goals Conceded"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                GC
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.goalsConceded}
              </dd>
            </div>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Saves"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                SV
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.saves}
              </dd>
            </div>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Saves per 90'"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                SVP90
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.savesPerGame === Infinity
                  ? "–"
                  : `${stats.savesPerGame}'`}
              </dd>
            </div>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Minutes per Goal Against"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                MPGA
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.minutesPerGoalAgainst === Infinity
                  ? "–"
                  : `${stats.minutesPerGoalAgainst}'`}
              </dd>
            </div>
          </>
        ) : (
          <>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Goals"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                G
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.goals}
              </dd>
            </div>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Assists"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                A
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.assists}
              </dd>
            </div>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Goals + Assists"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                G+A
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.goalContributions}
              </dd>
            </div>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Minutes per Goal"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                MPG
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.minutesPerGoal === Infinity
                  ? "–"
                  : `${stats.minutesPerGoal}'`}
              </dd>
            </div>
            <div className="py-3 gap-y-2 grid divide-y divide-slate-200 dark:divide-slate-700">
              <dt
                title="Minutes per Goal + Assist"
                className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase"
              >
                MPGA
              </dt>
              <dd className="text-base pt-2 leading-none text-slate-700 dark:text-slate-200 capitalize">
                {stats.minutesPerGoalContribution === Infinity
                  ? "–"
                  : `${stats.minutesPerGoalContribution}'`}
              </dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}
