import SpinnerIcon from "@/components/SpinnerIcon";

export default function FavouritesLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <SpinnerIcon className="h-8 w-8 animate-spin" />
    </div>
  );
}
