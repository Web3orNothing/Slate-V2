/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import axios from "axios";
import { WALLET_API_URL } from "@/config/constants/backend";
import OptionTab from "./Tabs/OptionTab";
import ActionTab from "./Tabs/ActionTab";
import Footer from "@/components/Footer";

const ConnectorButton = dynamic(() => import("@/components/ConnectorButton"), {
  ssr: false,
});

const Home = () => {
  const { authenticated, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const { wallet } = usePrivyWagmi();
  const [visible, setVisible] = useState(true);

  const externalWallet = useMemo(
    () => (wallets || []).find((x: any) => x.walletClientType !== "privy"),
    [wallets]
  );

  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>();
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // set connected & address status
    let auth = ready && authenticated && wallet?.walletClientType === "privy";
    if (connected === auth && wallet?.address === address) return;

    setConnected(auth);
    setAddress(wallet?.address);
  }, [address, authenticated, connected, ready, wallet]);

  useEffect(() => {
    if (!externalWallet && connected) handleDisconnect();
  }, [connected, externalWallet]);

  useEffect(() => {
    // push subscription to backend
    const subscription = window.localStorage.getItem("subscription");
    if (!connected || !address || !subscription || subscribed) return;

    axios.post(
      `${WALLET_API_URL}/subscribe`,
      { address, subscription: JSON.parse(subscription) },
      { headers: { "Content-Type": "application/json" } }
    );
    setSubscribed(true);
  }, [address, connected, subscribed]);

  const handleDisconnect = async () => {
    await axios.post(
      `${WALLET_API_URL}/subscribe`,
      { address, subscription: "empty" },
      { headers: { "Content-Type": "application/json" } }
    );

    logout();
  };
  return (
    <div>
      {connected && address ? (
        <div className="flex w-full overflow-hidden">
          <OptionTab
            visible={visible}
            handleDisconnect={handleDisconnect}
            setVisible={setVisible}
          />
          <ActionTab mode={0} visible={visible} setVisible={setVisible} />
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-[100vh]">
          <ConnectorButton />
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Home;
