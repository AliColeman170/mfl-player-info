 export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl py-8 flex flex-col items-center">
      <h2 className="text-3xl tracking-tight font-bold text-slate-900 dark:text-slate-200 flex justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </h2>
      <p className="mt-4 text-slate-900 dark:text-slate-200">Player with the requested ID could not be found.</p>
    </div>
  );
}