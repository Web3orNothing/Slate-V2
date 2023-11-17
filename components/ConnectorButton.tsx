import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useEffect, useMemo } from "react";
import { identify } from '@multibase/js';

export default function ConnectorButton() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { wallet, setActiveWallet } = usePrivyWagmi();

  const externalWallet = useMemo(
    () => (wallets || []).find((x) => x.walletClientType !== "privy"),
    [wallets]
  );
  const embeddedWallet = useMemo(
    () => (wallets || []).find((x) => x.walletClientType === "privy"),
    [wallets]
  );

  const handleLogin = () => {
    externalWallet!.loginOrLink();
    setActiveWallet(externalWallet!);
  };

  useEffect(() => {
    if (externalWallet && externalWallet.address) {
      // An external wallet is connected, we can identify the user
      identify({
        address: externalWallet.address,
        chain: 1
      });
    }
  }, [externalWallet]);
  
  useEffect(() => {
    if (
      ready &&
      authenticated &&
      embeddedWallet &&
      wallet?.address !== embeddedWallet.address
    )
      setActiveWallet(embeddedWallet);
  }, [authenticated, embeddedWallet, ready, setActiveWallet, wallet]);

  return (
    <>
      <button onClick={login}>Connect Wallet</button>
      {externalWallet && (
        <span style={{ margin: "16px", fontSize: "12px" }}>OR</span>
      )}
      {externalWallet && (
        <button onClick={handleLogin} style={{ fontSize: "12px" }}>
          Verify most recently used wallet
          <br />
          {externalWallet.address}
        </button>
      )}
    </>
  );
}
