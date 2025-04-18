import Link from 'next/link';

export function Footer() {
  return (
    <footer className='mx-auto mt-8 w-full max-w-xl px-6 py-8 text-center lg:px-8'>
      <div className='flex items-center justify-center space-x-3'>
        <Link
          href={process.env.NEXT_BUY_ME_A_COFFEE_URL!}
          target='_blank'
          className='text-muted-foreground/80 hover:text-muted-foreground/70'
        >
          <svg
            width='884'
            height='1279'
            viewBox='0 0 884 1279'
            fill='currentColor'
            className='size-7'
          >
            <path
              fill='#FFDD00'
              d='M472.6,590.8c-45.9,19.7-98.1,42-165.6,42c-28.3-0.1-56.4-3.9-83.6-11.5l46.7,479.8c1.7,20.1,10.8,38.8,25.6,52.4c14.8,13.6,34.2,21.2,54.3,21.2c0,0,66.3,3.4,88.4,3.4c23.8,0,95.2-3.4,95.2-3.4c20.1,0,39.5-7.6,54.3-21.2c14.8-13.6,23.9-32.3,25.6-52.4l50.1-530.2c-22.4-7.6-44.9-12.7-70.4-12.7C549.1,558.1,513.6,573.3,472.6,590.8z'
            />
            <path d='M879.6,341.8l-7-35.5c-6.3-31.8-20.6-61.9-53.3-73.5c-10.5-3.7-22.4-5.3-30.4-12.9c-8-7.6-10.4-19.5-12.3-30.4c-3.4-20.1-6.7-40.3-10.2-60.4c-3-17.3-5.5-36.7-13.4-52.6c-10.3-21.3-31.7-33.8-53-42c-10.9-4.1-22.1-7.5-33.4-10.3C613.3,10.2,557.3,5,502.6,2.1C436.9-1.5,371-0.4,305.4,5.4C256.6,9.8,205.2,15.2,158.9,32c-16.9,6.2-34.4,13.6-47.3,26.7c-15.8,16.1-21,41-9.4,61c8.2,14.2,22.1,24.3,36.9,31c19.2,8.6,39.3,15.1,59.8,19.5c57.3,12.7,116.6,17.6,175.2,19.8c64.9,2.6,129.9,0.5,194.4-6.4c16-1.8,31.9-3.9,47.8-6.3c18.7-2.9,30.8-27.4,25.2-44.4c-6.6-20.4-24.4-28.3-44.4-25.2c-3,0.5-5.9,0.9-8.9,1.3l-2.1,0.3c-6.8,0.9-13.6,1.7-20.4,2.4c-14.1,1.5-28.1,2.8-42.3,3.7c-31.6,2.2-63.3,3.2-95,3.3c-31.1,0-62.3-0.9-93.4-2.9c-14.2-0.9-28.3-2.1-42.4-3.5c-6.4-0.7-12.8-1.4-19.2-2.2l-6.1-0.8l-1.3-0.2l-6.3-0.9c-12.9-1.9-25.8-4.2-38.6-6.9c-1.3-0.3-2.4-1-3.3-2c-0.8-1-1.3-2.3-1.3-3.6c0-1.3,0.5-2.6,1.3-3.6c0.8-1,2-1.7,3.3-2h0.2c11.1-2.4,22.2-4.4,33.4-6.1c3.7-0.6,7.5-1.2,11.2-1.7h0.1c7-0.5,14-1.7,21-2.5c60.6-6.3,121.6-8.5,182.5-6.4c29.6,0.9,59.1,2.6,88.6,5.6c6.3,0.7,12.6,1.3,18.9,2.1c2.4,0.3,4.8,0.6,7.3,0.9l4.9,0.7c14.2,2.1,28.4,4.7,42.5,7.7c20.9,4.5,47.7,6,57,28.9c3,7.3,4.3,15.3,5.9,23l2.1,9.7c0.1,0.2,0.1,0.4,0.1,0.5c4.9,22.9,9.8,45.9,14.8,68.8c0.4,1.7,0.4,3.4,0,5.1c-0.3,1.7-1,3.3-2,4.7c-1,1.4-2.3,2.6-3.7,3.5c-1.5,0.9-3.1,1.5-4.8,1.7h-0.1l-3,0.4l-3,0.4c-9.4,1.2-18.9,2.4-28.3,3.4c-18.6,2.1-37.3,4-55.9,5.5c-37.1,3.1-74.3,5.1-111.6,6.1c-19,0.5-38,0.7-56.9,0.7c-75.5-0.1-151-4.4-226-13.1c-8.1-1-16.2-2-24.4-3c6.3,0.8-4.6-0.6-6.8-0.9c-5.2-0.7-10.3-1.5-15.5-2.3c-17.3-2.6-34.6-5.8-51.8-8.6c-20.9-3.4-40.9-1.7-59.8,8.6c-15.5,8.5-28.1,21.5-36,37.3c-8.2,16.9-10.6,35.2-14.2,53.3c-3.6,18.1-9.3,37.6-7.2,56.2c4.6,40.1,32.7,72.8,73.1,80.1c38,6.9,76.2,12.5,114.4,17.2c150.4,18.4,302.3,20.6,453.2,6.6c12.3-1.1,24.6-2.4,36.8-3.8c3.8-0.4,7.7,0,11.3,1.3c3.6,1.3,6.9,3.3,9.7,6c2.7,2.7,4.8,6,6.1,9.6c1.3,3.6,1.8,7.5,1.4,11.3l-3.8,37.1c-7.7,75-15.4,150.1-23.1,225.1c-8,78.8-16.1,157.6-24.2,236.3c-2.3,22.2-4.6,44.4-6.9,66.5c-2.2,21.8-2.5,44.4-6.7,65.9c-6.5,33.9-29.5,54.8-63,62.4c-30.7,7-62.1,10.7-93.6,10.9c-34.9,0.2-69.8-1.4-104.7-1.2c-37.3,0.2-82.9-3.2-111.7-31c-25.3-24.4-28.8-62.5-32.2-95.5c-4.6-43.7-9.1-87.3-13.6-131l-25.3-242.8l-16.4-157.1c-0.3-2.6-0.6-5.2-0.8-7.8c-2-18.7-15.2-37.1-36.1-36.1c-17.9,0.8-38.2,16-36.1,36.1l12.1,116.5l25.1,240.9c7.1,68.4,14.3,136.9,21.4,205.3c1.4,13.1,2.7,26.3,4.1,39.4c7.9,71.7,62.6,110.3,130.3,121.1c39.6,6.4,80.1,7.7,120.3,8.3c51.5,0.8,103.5,2.8,154.1-6.5c75-13.8,131.3-63.9,139.4-141.6c2.3-22.4,4.6-44.9,6.9-67.3c7.6-74.2,15.2-148.5,22.8-222.7l24.9-242.6L781,486.3c0.6-5.5,2.9-10.7,6.6-14.8c3.7-4.1,8.7-6.9,14.1-7.9c21.5-4.2,42-11.3,57.2-27.7C883.3,409.9,888.2,376,879.6,341.8z M72.4,365.8c0.3-0.2-0.3,2.6-0.5,4C71.8,367.8,71.9,366.1,72.4,365.8z M74.5,381.9c0.2-0.1,0.7,0.6,1.2,1.4C74.9,382.6,74.4,382,74.5,381.9L74.5,381.9z M76.6,384.6C77.3,385.9,77.7,386.7,76.6,384.6L76.6,384.6z M80.7,388h0.1c0,0.1,0.2,0.2,0.3,0.4C80.9,388.2,80.8,388.1,80.7,388L80.7,388z M800.8,383c-7.7,7.3-19.3,10.7-30.8,12.4c-128.7,19.1-259.3,28.8-389.4,24.5c-93.1-3.2-185.3-13.5-277.5-26.6c-9-1.3-18.8-2.9-25-9.6c-11.7-12.6-6-37.9-2.9-53c2.8-13.9,8.1-32.4,24.7-34.4c25.8-3,55.8,7.9,81.3,11.7c30.7,4.7,61.6,8.4,92.6,11.3c132.2,12,266.6,10.2,398.2-7.4c24-3.2,47.9-7,71.7-11.2c21.2-3.8,44.7-10.9,57.6,11c8.8,15,10,35,8.6,51.9C809.4,371,806.1,377.9,800.8,383L800.8,383z' />
          </svg>
        </Link>
        <Link
          href='https://github.com/AliColeman170/mfl-player-info'
          className='text-muted-foreground/80 hover:text-muted-foreground/70 inline-flex'
          target='_blank'
        >
          <svg viewBox='0 0 24 24' aria-hidden='true' className='size-8'>
            <path
              fill='currentColor'
              fillRule='evenodd'
              clipRule='evenodd'
              d='M12 2C6.475 2 2 6.588 2 12.253c0 4.537 2.862 8.369 6.838 9.727.5.09.687-.218.687-.487 0-.243-.013-1.05-.013-1.91C7 20.059 6.35 18.957 6.15 18.38c-.113-.295-.6-1.205-1.025-1.448-.35-.192-.85-.667-.013-.68.788-.012 1.35.744 1.538 1.051.9 1.551 2.338 1.116 2.912.846.088-.666.35-1.115.638-1.371-2.225-.256-4.55-1.14-4.55-5.062 0-1.115.387-2.038 1.025-2.756-.1-.256-.45-1.307.1-2.717 0 0 .837-.269 2.75 1.051.8-.23 1.65-.346 2.5-.346.85 0 1.7.115 2.5.346 1.912-1.333 2.75-1.05 2.75-1.05.55 1.409.2 2.46.1 2.716.637.718 1.025 1.628 1.025 2.756 0 3.934-2.337 4.806-4.562 5.062.362.32.675.936.675 1.897 0 1.371-.013 2.473-.013 2.82 0 .268.188.589.688.486a10.039 10.039 0 0 0 4.932-3.74A10.447 10.447 0 0 0 22 12.253C22 6.588 17.525 2 12 2Z'
            />
          </svg>
        </Link>
      </div>
      <p className='text-muted-foreground mt-2 text-sm'>
        Built by{' '}
        <Link
          href='https://twitter.com/alicoleman170'
          target='_blank'
          className='text-muted-foreground/80 hover:text-muted-foreground/70'
        >
          @AliColeman170
        </Link>
        .
      </p>
    </footer>
  );
}
