import { ComboSearch } from "@/components/Search/ComboSearch";

export default function PlayerLayout({ children, params }) {
  return (
    <div className="flex flex-1 h-full flex-col items-center justify-start space-y-8">
      <ComboSearch key="search" id={params.id} autofocus={true} />
      {children}
    </div>
  );
}
