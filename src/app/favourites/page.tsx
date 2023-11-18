import { auth } from "@/auth";
import Favourites from "@/components/Favourites";
import NotLoggedIn from "@/components/Favourites/NotLoggedIn";
import { Suspense } from "react";
import FavouritesLoading from "./loading";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "My Favourites | MFL Player Info | Ratings Calculator & Contract Details",
};

export default async function FavouritesPage() {
  const session = await auth();

  if (!session) return <NotLoggedIn />;

  return (
    <div className="mt-4">
      <h1 className="text-4xl font-bold">My Favourites</h1>
      <Suspense fallback={<FavouritesLoading />}>
        <Favourites />
      </Suspense>
    </div>
  );
}
