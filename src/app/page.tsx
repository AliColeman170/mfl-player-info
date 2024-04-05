import { ComboSearch } from "@/components/Search/ComboSearch";
import { SinglePlayerSearch } from "@/components/Search/SinglePlayerSearch";
import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: { url: "https://mflplayer.info" },
};

export default function Home() {
  return (
    <div className="flex flex-1 h-full flex-col items-center justify-start space-y-8">
      <ComboSearch key="search" autofocus={true} />
    </div>
  );
}
