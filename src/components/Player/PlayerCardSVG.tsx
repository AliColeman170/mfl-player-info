import { cn } from '@/lib/utils';
import { Oxanium } from 'next/font/google';

const oxanium = Oxanium({ subsets: ['latin'] });

interface PlayerCardSVGProps {
  player: {
    id: number;
    metadata: {
      firstName: string;
      lastName: string;
      age: number;
      overall: number;
      pace: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defense: number;
      physical: number;
      positions: string[];
      nationalities: string[];
    };
  };
  className?: string;
}

type TierConfig = {
  name: string;
  textGradient: {
    id: string;
    stops: Array<{ color: string; offset: string }>;
  };
  strokeColor: string;
  glassConfig?: {
    bg: {
      id: string;
      stops: Array<{ color: string; opacity: string; offset: string }>;
    };
    border: {
      id: string;
      stops: Array<{ color: string; offset: string }>;
    };
  };
};

function getTierFromOverall(overall: number): TierConfig {
  if (overall >= 95) {
    return {
      name: 'ultimate',
      textGradient: {
        id: 'v2-text-ultimate',
        stops: [
          { color: '#d9ece7', offset: '0' },
          { color: '#83ebe2', offset: '0.51' },
          { color: '#7dd1ca', offset: '1' },
        ],
      },
      strokeColor: '#F8ED90',
      glassConfig: {
        bg: {
          id: 'v2-glass-bg-ultimate',
          stops: [
            { color: '#151515', opacity: '0.8', offset: '0' },
            { color: '#232323', opacity: '0.7', offset: '0.3' },
            { color: '#2d2d2d', opacity: '0.7', offset: '0.7' },
          ],
        },
        border: {
          id: 'v2-glass-border-ultimate',
          stops: [
            { color: '#37f1f1', offset: '0' },
            { color: '#7ffffe', offset: '0.21' },
            { color: '#b7fffe', offset: '0.48' },
            { color: '#07fffd', offset: '0.79' },
            { color: '#3dbbba', offset: '1' },
          ],
        },
      },
    };
  } else if (overall >= 85) {
    return {
      name: 'legendary',
      textGradient: {
        id: 'v2-text-legendary',
        stops: [
          { color: '#d6d6d6', offset: '0' },
          { color: '#b137f1', offset: '0.51' },
          { color: '#e63df8', offset: '1' },
        ],
      },
      strokeColor: '#BF36F1',
    };
  } else if (overall >= 75) {
    return {
      name: 'rare',
      textGradient: {
        id: 'v2-text-rare',
        stops: [
          { color: '#97e5ff', offset: '0' },
          { color: '#1f8eff', offset: '0.51' },
          { color: '#3992ff', offset: '1' },
        ],
      },
      strokeColor: '#175BD6',
    };
  } else if (overall >= 65) {
    return {
      name: 'uncommon',
      textGradient: {
        id: 'v2-text-uncommon',
        stops: [
          { color: '#bfffd9', offset: '0' },
          { color: '#38ff7a', offset: '0.51' },
          { color: '#37cb6f', offset: '1' },
        ],
      },
      strokeColor: '#2EEA81',
    };
  } else if (overall >= 55) {
    return {
      name: 'limited',
      textGradient: {
        id: 'v2-text-limited',
        stops: [
          { color: '#d6d6d6', offset: '0' },
          { color: '#ecd27e', offset: '0.51' },
          { color: '#cdb66b', offset: '1' },
        ],
      },
      strokeColor: '#FDEFA2',
    };
  } else {
    return {
      name: 'common',
      textGradient: {
        id: 'v2-text-common',
        stops: [
          { color: '#fff', offset: '0' },
          { color: '#cecece', offset: '1' },
        ],
      },
      strokeColor: '#FFF',
    };
  }
}

export function PlayerCardSVG({ player, className }: PlayerCardSVGProps) {
  const nationality =
    player.metadata.nationalities[0]?.toUpperCase() || 'UNKNOWN';
  const position = player.metadata.positions[0] || 'UNK';
  const tier = getTierFromOverall(player.metadata.overall);

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 -14 128.27 214.118'
      className={cn(`uppercase ${oxanium.className}`, className)}
    >
      <defs>
        <linearGradient
          id={tier.textGradient.id}
          x1='100%'
          y1='34%'
          x2='0%'
          y2='66%'
        >
          {tier.textGradient.stops.map((stop, index) => (
            <stop
              key={index}
              stopColor={stop.color}
              offset={stop.offset}
            ></stop>
          ))}
        </linearGradient>
        <linearGradient id='v2-b'>
          <stop offset='0.22' stopColor='#000'></stop>
          <stop offset='1' stopColor='#FFF'></stop>
        </linearGradient>
        <linearGradient
          id='v2-glass-line'
          x1='45'
          x2='71'
          y1='94'
          y2='94'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0.08' stopColor='#FFF' stopOpacity='0'></stop>
          <stop offset='0.5' stopColor='#FFF'></stop>
          <stop offset='0.92' stopColor='#FFF' stopOpacity='0'></stop>
        </linearGradient>
        <linearGradient
          href='#v2-b'
          id='v2-a'
          x1='106'
          x2='106'
          y1='151'
          y2='116'
          gradientUnits='userSpaceOnUse'
        ></linearGradient>
        <mask id='v2-flag-clip' clipPathUnits='userSpaceOnUse'>
          <g transform='translate(41.916 35.258)'>
            <path
              fill='#FFF'
              d='M9 82.227h13.547V88.5c0 2.534-2.547 2.556-2.547 2.556H9Z'
            ></path>
          </g>
        </mask>
        <clipPath id='v2-c' clipPathUnits='userSpaceOnUse'>
          <rect
            width='121.401'
            height='210.351'
            x='3.457'
            y='-70.558'
            ry='0'
            fill='#000'
            stroke='none'
          ></rect>
        </clipPath>
        <clipPath
          id='v2-f'
          clipPathUnits='userSpaceOnUse'
          transform='translate(0 -20)'
        >
          <path
            d='M77.517 43.88h57.075l4.214 12.707s.577 2.31 3.385 2.31h24.583v123.53H45.31V58.932h24.805s2.406.01 3.087-2.079c.68-2.088 4.315-12.972 4.315-12.972z'
            fill='#000'
            stroke='none'
          ></path>
        </clipPath>
        <filter id='v2-e' width='1.048' height='1.048' x='-.024' y='-.024'>
          <feGaussianBlur
            result='fbSourceGraphic'
            stdDeviation='1.582'
          ></feGaussianBlur>
          <feColorMatrix
            in='fbSourceGraphic'
            result='fbSourceGraphicAlpha'
            values='0 0 0 -1 0 0 0 0 -1 0 0 0 0 -1 0 0 0 0 1 0'
          ></feColorMatrix>
          <feColorMatrix
            in='fbSourceGraphic'
            result='fbSourceGraphic'
            values='-10 -10 -10 -10 0 -10 -10 -10 -10 0 -10 -10 -10 -10 0 0 0 0 1 0'
          ></feColorMatrix>
          <feColorMatrix
            in='fbSourceGraphic'
            result='fbSourceGraphicAlpha'
            values='0 0 0 -1 0 0 0 0 -1 0 0 0 0 -1 0 0 0 0 1 0'
          ></feColorMatrix>
          <feColorMatrix
            in='fbSourceGraphic'
            values='-10 -10 -10 -10 0 -10 -10 -10 -10 0 -10 -10 -10 -10 0 0 0 0 1 0'
          ></feColorMatrix>
        </filter>
        <mask id='v2-d'>
          <rect
            width='121.401'
            height='169'
            x='45.304'
            y='-14'
            fill='url(#v2-a)'
            stroke='none'
          ></rect>
        </mask>
        <clipPath id='v2-glass-mask' clipPathUnits='userSpaceOnUse'>
          <path d='M45.256 60.348h24.66s.734-.018 1.466-.286c.522-.191-.021 75.477-.021 75.477H45.256Z'></path>
        </clipPath>
        <linearGradient
          id={tier.glassConfig?.bg.id || 'v2-glass-bg'}
          x1='57.988'
          x2='57.988'
          y1='109.507'
          y2='84.028'
          gradientUnits='userSpaceOnUse'
        >
          {tier.glassConfig?.bg.stops ? (
            tier.glassConfig.bg.stops.map((stop, index) => (
              <stop
                key={index}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              ></stop>
            ))
          ) : (
            <>
              <stop offset='0' stopColor='#8f8f8f' stopOpacity='.65'></stop>
              <stop offset='.6' stopColor='#888' stopOpacity='.4'></stop>
              <stop offset='1' stopColor='#fff' stopOpacity='.09'></stop>
            </>
          )}
        </linearGradient>
        <linearGradient
          id={tier.glassConfig?.border.id || 'v2-glass-border'}
          x1='57.988426'
          y1='109.63931'
          x2='57.988426'
          y2='83.896194'
          gradientUnits='userSpaceOnUse'
        >
          {tier.glassConfig?.border.stops ? (
            tier.glassConfig.border.stops.map((stop, index) => (
              <stop
                key={index}
                stopColor={stop.color}
                offset={stop.offset}
              ></stop>
            ))
          ) : (
            <>
              <stop stopColor='#FFF' stopOpacity='0.6' offset='0'></stop>
              <stop stopColor='#FFF' stopOpacity='0.16' offset='1'></stop>
            </>
          )}
        </linearGradient>
        <linearGradient
          id='v2-photo-mask-gradient'
          gradientUnits='userSpaceOnUse'
          gradientTransform='matrix(1,0,0,1.25,0,-32.9)'
          x1='64.1'
          y1='173.75'
          x2='64.1'
          y2='50.85'
        >
          <stop stopColor='#FFF' offset='0.45'></stop>
          <stop stopColor='#FFF' stopOpacity='0' offset='0.62'></stop>
        </linearGradient>
        <mask maskUnits='userSpaceOnUse' id='v2-photo-mask'>
          <g transform='translate(41.915516,35.258179)'>
            <path
              fill='#FFF'
              d='m 45.249161,59.87824 h 25.478533 v 63.87393 c -0.0057,5.36472 -4.453311,9.89206 -9.6102,9.87001 -4.898883,0.0789 -15.867979,0 -15.867979,0 0.005,-24.58297 -3.44e-4,-49.160854 -3.44e-4,-73.74394 z'
              transform='translate(-41.915517,-55.258179)'
            ></path>
            <rect
              fill='url(#v2-photo-mask-gradient)'
              width='123'
              height='53.018681'
              x='2.6'
              y='80.6'
            ></rect>
          </g>
        </mask>
        <filter
          id='v2-photo-blur'
          x='-0.015578374'
          y='-0.015578374'
          width='1.0311567'
          height='1.0311567'
        >
          <feGaussianBlur stdDeviation='1.0301174'></feGaussianBlur>
        </filter>
      </defs>
      <g transform='translate(-41.916 -35.258)'>
        <image
          href={`https://d13e14gtps4iwl.cloudfront.net/players/v2/_elements/${tier.name}-bg.webp`}
          width='128.27'
          height='194.818'
          x='41.916'
          y='40.558'
          preserveAspectRatio='none'
        ></image>
        <g transform='translate(0 20)'>
          <g clipPath='url(#v2-c)' transform='translate(41.916 56.558)'>
            <g mask='url(#v2-d)' transform='translate(-41.916 -56.558)'>
              <image
                href={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${player.id}/photo.webp`}
                height='160'
                width='160'
                x='32.766'
                y='0'
                clipPath='url(#v2-f)'
                preserveAspectRatio='none'
                opacity='0.42'
                filter='url(#v2-e)'
              ></image>
              <image
                href={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${player.id}/photo.webp`}
                height='160'
                width='160'
                x='26.066'
                y='2.6'
                preserveAspectRatio='none'
                filter='brightness(1.1)'
              ></image>
              <image
                href={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${player.id}/photo.webp`}
                height='160'
                width='160'
                x='26.066'
                y='2.6'
                preserveAspectRatio='none'
                mask='url(#v2-photo-mask)'
                filter='url(#v2-photo-blur)'
              ></image>
            </g>
          </g>
        </g>
        <g clipPath='url(#v2-glass-mask)'>
          <g>
            <path
              d='M45.25 59.878h25.478v63.874c-.006 5.365-4.454 9.892-9.61 9.87-4.9.08-15.868 0-15.868 0 .005-24.583 0-49.16 0-73.744z'
              fill={`url(#${tier.glassConfig?.bg.id || 'v2-glass-bg'})`}
              stroke={`url(#${tier.glassConfig?.border.id || 'v2-glass-border'})`}
              strokeWidth='0.26'
            ></path>
            <path
              d='M45.27 94h25.3'
              stroke='url(#v2-glass-line)'
              strokeOpacity='0.5'
              strokeWidth='0.26'
            ></path>
            <text>
              <tspan
                x='57.94'
                y='74'
                fontSize='17.1'
                fontWeight='600'
                fill={`url(#${tier.textGradient.id})`}
                dominantBaseline='middle'
                textAnchor='middle'
              >
                {player.metadata.overall}
              </tspan>
            </text>
            <text>
              <tspan
                x='57.94'
                y='87'
                fontSize='8.3'
                fontWeight='600'
                fill='#FFF'
                dominantBaseline='middle'
                textAnchor='middle'
              >
                {position}
              </tspan>
            </text>
            <g>
              <text>
                <tspan
                  x='57.94'
                  y='102'
                  fontSize='4.4'
                  fontWeight='500'
                  fill='#FFF'
                  dominantBaseline='middle'
                  textAnchor='middle'
                >
                  age
                </tspan>
              </text>
              <text>
                <tspan
                  x='57.94'
                  y='109.5'
                  fontSize='9'
                  fontWeight='500'
                  fill='#FFF'
                  dominantBaseline='middle'
                  textAnchor='middle'
                >
                  {player.metadata.age}
                </tspan>
              </text>
            </g>
            <image
              href={`https://app.playmfl.com/img/flags/${nationality}.svg`}
              width='13.3'
              height='8.8'
              preserveAspectRatio='none'
              y='117.7'
              x='51.2'
              mask='url(#v2-flag-clip)'
            ></image>
          </g>
        </g>
      </g>
      <g transform='translate(0, 122)'>
        <g>
          <text>
            <tspan
              x='64.2'
              y='0'
              dominantBaseline='middle'
              textAnchor='middle'
              fill='#FFF'
              fontWeight='400'
              fontSize='12.3'
            >
              {player.metadata.firstName}
            </tspan>
          </text>
          <text>
            <tspan
              x='64.2'
              y='12.5'
              dominantBaseline='middle'
              textAnchor='middle'
              fill={`url(#${tier.textGradient.id})`}
              style={{ fontWeight: 600, fontSize: '14.2px' }}
            >
              {player.metadata.lastName}
            </tspan>
          </text>
        </g>
      </g>
      {position === 'GK' ? (
        <g>
          <text
            dominantBaseline='middle'
            textAnchor='middle'
            x='64.2'
            y='162'
            fill='#FFF'
            fontSize='15'
          >
            <tspan fontWeight='600'>49 </tspan>
            <tspan fontWeight='400'>gk</tspan>
          </text>
        </g>
      ) : (
        <g fill='#FFF'>
          <path
            d='M64.2 146.8v28.5'
            stroke={tier.strokeColor}
            strokeWidth='0.35'
          ></path>
          <text fontSize='8.7' dominantBaseline='middle'>
            <tspan
              x='31.999999999999996'
              y='150.2'
              fontWeight='600'
              textAnchor='end'
            >
              {player.metadata.pace}
            </tspan>
            <tspan x='34.8' y='150.2' fontWeight='300'>
              pac
            </tspan>
          </text>
          <text fontSize='8.7' dominantBaseline='middle'>
            <tspan
              x='31.999999999999996'
              y='161.5'
              fontWeight='600'
              textAnchor='end'
            >
              {player.metadata.shooting}
            </tspan>
            <tspan x='34.8' y='161.5' fontWeight='300'>
              sho
            </tspan>
          </text>
          <text fontSize='8.7' dominantBaseline='middle'>
            <tspan
              x='31.999999999999996'
              y='172.79999999999998'
              fontWeight='600'
              textAnchor='end'
            >
              {player.metadata.passing}
            </tspan>
            <tspan x='34.8' y='172.79999999999998' fontWeight='300'>
              pas
            </tspan>
          </text>
          <text fontSize='8.7' dominantBaseline='middle'>
            <tspan x='86.5' y='150.2' fontWeight='600' textAnchor='end'>
              {player.metadata.dribbling}
            </tspan>
            <tspan x='89.3' y='150.2' fontWeight='300'>
              dri
            </tspan>
          </text>
          <text fontSize='8.7' dominantBaseline='middle'>
            <tspan x='86.5' y='161.5' fontWeight='600' textAnchor='end'>
              {player.metadata.defense}
            </tspan>
            <tspan x='89.3' y='161.5' fontWeight='300'>
              def
            </tspan>
          </text>
          <text fontSize='8.7' dominantBaseline='middle'>
            <tspan
              x='86.5'
              y='172.79999999999998'
              fontWeight='600'
              textAnchor='end'
            >
              {player.metadata.physical}
            </tspan>
            <tspan x='89.3' y='172.79999999999998' fontWeight='300'>
              phy
            </tspan>
          </text>
        </g>
      )}
    </svg>
  );
}
