import { SinglePlayerSearch } from "@/components/Search/SinglePlayerSearch";

export default function PlayerLayout({ children, params }) {
  return (
    <div className="flex flex-1 h-full flex-col items-center justify-start space-y-8">
      <SinglePlayerSearch key="search" id={params.id} />
      {children}
    </div>
  );
}
