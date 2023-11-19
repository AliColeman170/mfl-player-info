import Search from "@/components/Search";

export default function Home() {
  return (
    <div className="flex flex-1 h-full flex-col items-center justify-start space-y-8">
      <Search key="search" />
    </div>
  );
}
