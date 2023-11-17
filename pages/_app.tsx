import type { AppProps } from "next/app";
import PlausibleProvider from "next-plausible";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { PrivyProvider } from "@privy-io/react-auth";
import { PrivyWagmiConnector } from "@privy-io/wagmi-connector";
import { configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { init } from "@multibase/js";
import { chains } from "@/config/constants/Chains";
import { VAPID_KEY } from "@/config/constants/backend";
import "react-toastify/dist/ReactToastify.min.css";
import "@/styles/globals.css";

// Configure chains & providers.
const config = configureChains(chains, [publicProvider()]);

export default function App({ Component, pageProps }: AppProps) {
  const [swStatus, setSwStatus] = useState<string | undefined>();
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | undefined>();
  const [granted, setGranted] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    init("63ef995c-9041-498d-a50f-e7ece4424300");
    navigator.serviceWorker.register("sw.js", { scope: "/" }).then((reg) => {
      setSwReg(reg);
      let serviceWorker;
      if (reg.installing) serviceWorker = reg.installing;
      else if (reg.waiting) serviceWorker = reg.waiting;
      else if (reg.active) serviceWorker = reg.active;

      if (serviceWorker) {
        setSwStatus(serviceWorker.state);
        serviceWorker.addEventListener("statechange", (e) =>
          setSwStatus((e.target as ServiceWorker).state)
        );
      }
    });
    requestNotification();
  }, []);

  useEffect(() => {
    if (!granted || swStatus !== "activated" || !swReg) return;

    swReg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_KEY,
      })
      .then((subscription) => {
        window.localStorage.setItem(
          "subscription",
          JSON.stringify(subscription)
        );
        setSubscribed(true);
      });
  }, [granted, swStatus, swReg]);

  const requestNotification = () => {
    if (!window.Notification) return;

    Notification.requestPermission().then((permission) =>
      setGranted(permission === "granted")
    );
  };

  return (
    <PlausibleProvider domain="walletdapp-alpha.vercel.app">
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          loginMethods: ["wallet"],
          appearance: { theme: "dark", accentColor: "#676FFF" },
          embeddedWallets: {
            createOnLogin: "all-users",
            noPromptOnSignature: true,
          },
          supportedChains: chains,
        }}
      >
        {subscribed ? (
          <PrivyWagmiConnector wagmiChainsConfig={config}>
            <Component {...pageProps} />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar
              newestOnTop={false}
              closeOnClick
              pauseOnFocusLoss
              pauseOnHover
              theme="dark"
            />
          </PrivyWagmiConnector>
        ) : (
          <div className="flex items-center justify-center h-screen">
            {granted ? (
              <i>Not subscribed yet</i>
            ) : (
              <button onClick={requestNotification}>Allow Notification</button>
            )}{" "}
          </div>
        )}
      </PrivyProvider>
    </PlausibleProvider>
  );
}
