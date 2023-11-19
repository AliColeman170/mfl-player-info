import { auth } from "@/auth";
import ConnectButton from "./ConnectButton";
import UserProfile from "./UserProfile";

export default async function Wallet() {
  const session = await auth();
  if (!session) return <ConnectButton session={session} />;
  return <UserProfile user={session.user} />;
}
