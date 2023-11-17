/* eslint-disable react-hooks/exhaustive-deps */
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useNetwork, useBalance } from "wagmi";
import { toast } from "react-toastify";
import axios from "axios";
import { BigNumber, ethers, providers, utils } from "ethers";
import {
  PROCESS_MESSAGE_API,
  WALLET_API_URL,
} from "@/config/constants/backend";
import Response, {
  Query,
  CONDITIONS,
  Icon,
  ProcessText,
  Stats,
} from "@/components/Response";
import {
  ellipseMiddle,
  executeCalls,
  fillBody,
  getChainIdFromName,
  getNativeBalanceForUser,
  getExecutingIds,
  getRpcUrlForChain,
  getNativeTokenSymbolForChain,
  getTokenHoldings,
  getTokenAddress,
  groupConditions,
  parseTime,
  setExecutingIds,
  simulateActions,
  updateStatus,
  getIconFromToken,
} from "@/utils";
import { chains } from "@/config/constants/Chains";
import ERC20_ABI from "@/abis/erc20.abi.js";
import ActionTab from "./Tabs/ActionTab";

const ConnectorButton = dynamic(() => import("@/components/ConnectorButton"), {
  ssr: false,
});
const titles = ["Main View", "Pending Operations", "History", "Settings"];
const inactiveStyle =
  "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300";
const activeStyle =
  "border-blue-600 text-blue-600 dark:text-blue-500 dark:border-blue-500";

export default function Home() {
  const {
    authenticated,
    logout,
    ready,
    signMessage,
    sendTransaction,
    exportWallet,
  } = usePrivy();
  const { wallets } = useWallets();
  const { wallet } = usePrivyWagmi();
  const { chain } = useNetwork();

  const externalWallet = useMemo(
    () => (wallets || []).find((x: any) => x.walletClientType !== "privy"),
    [wallets]
  );
  const embeddedWallet = useMemo(
    () => (wallets || []).find((x: any) => x.walletClientType === "privy"),
    [wallets]
  );

  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>();
  const [subscribed, setSubscribed] = useState(false);
  const [initialToken, setInitialToken] = useState<{
    chainName: string;
    token: string;
    tokenRequired: string;
  } | null>(null);
  const [needGas, setNeedGas] = useState<{
    chainName: string;
    token: string;
    tokenRequired: string;
  } | null>(null);
  const [needOnboardAll, setNeedOnboardAll] = useState(false);
  const [onboardChainName, setOnboardChainName] = useState<string | null>(null);
  const [mode, setMode] = useState(0);
  const [runningIds, setRunningIds] = useState<string[]>([]);
  const [statsText, setStatsText] = useState<Stats>({ value: "", id: "" });
  const [command, setCommand] = useState("");
  const [count, setCount] = useState(0);
  const [mainQueries, setMainQueries] = useState<Query[]>([]);
  const [pendingQueries, setPendingQueries] = useState<Query[]>([]);
  const [historyQueries, setHistoryQueries] = useState<Query[]>([]);
  const [canceledIds, setCanceledIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data: walletStats } = useBalance({
    address: embeddedWallet
      ? `0x${embeddedWallet.address.slice(2)}`
      : "0x0000000000000000000000000000000000000000",
    chainId: chain?.id,
  });
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawTx, setWithdrawTx] = useState<string | null>(null);
  const [depositTx, setDepositTx] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [comment, setComment] = useState("");
  const [processText, setProcessText] = useState<ProcessText>({
    value: "",
    id: "",
  });
  const [iconArray, setIconArray] = useState<Icon[]>([]);
  const [verifiedEntities, setVerifiedEntities] = useState<any>();

  useEffect(() => {
    const fetchEntities = async () => {
      const res = await axios.get(`${WALLET_API_URL}/verified-entities`);
      setVerifiedEntities(res.data);
    };
    fetchEntities();
  }, []);

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

  useEffect(() => {
    if (!connected || !address) return;

    // fetch pending queries
    let queryStr = `${WALLET_API_URL}/condition?accountAddress=${address}`;
    axios.get(queryStr).then(({ data: { conditions } }) => {
      setPendingQueries([
        ...conditions.map((x: any) => ({
          ...x.query,
          id: `c${x.id}`,
          conditions: x.conditions,
          actions: x.actions,
          calls: x.query.calls,
          conditionId: x.id,
          simstatus: x.simstatus,
        })),
      ]);
    });

    // fetch history queries
    queryStr = `${WALLET_API_URL}/history?accountAddress=${address}`;
    axios.get(queryStr).then(({ data: { histories } }) => {
      setHistoryQueries([
        ...histories.map((x: any) => ({
          ...x.query,
          id: `h${x.id}`,
          conditions: x.conditions,
          actions: x.actions,
          timestamp: x.timestamp,
        })),
      ]);
    });

    // setMainQueries([]);
  }, [address, connected]);

  const switchChain = useCallback(
    async (chainId: number) => {
      if (!connected || !wallet) return;
      if (+wallet.chainId.split(":")[1] !== chainId)
        await wallet!.switchChain(chainId);
    },
    [connected, wallet]
  );

  useEffect(() => {
    // subscribe to service worker's push notifications
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.removeEventListener("message", () => {});
    navigator.serviceWorker.addEventListener(
      "message",
      async ({ data: { address: reqAddr, conditions } }) => {
        // execute incoming notification
        if (address?.toLowerCase() !== reqAddr.toLowerCase()) return;

        let ids = getExecutingIds().map((x) => x);

        for (let i = 0; i < conditions.length; i++) {
          const condition = conditions[i];
          if (ids.includes("" + condition.id)) continue;
          await updateStatus(reqAddr, condition.id, "executing");
          ids.push(condition.id);
          setExecutingIds(ids);

          const { actions } = await simulateActions(
            condition.messageId,
            condition.actions,
            condition.conditions,
            chain!.name,
            address!,
            condition.id
          );
          if (!actions) continue;

          const hid = await executeCalls(
            switchChain,
            sendTransaction,
            { ...condition, actions },
            chain!.name,
            reqAddr
          );
          await new Promise((res) => setTimeout(res, 5000));
          ids.splice(ids.indexOf(condition.id), 1);
          setExecutingIds(ids);

          await updateStatus(
            reqAddr,
            condition.id,
            hid ? "completed" : "pending"
          );
        }
      }
    );
  }, [address, chain, connected, sendTransaction, switchChain]);

  useEffect(() => {
    if (!address) return;

    if (mode === 0) {
    } else if (mode === 1) {
      const queryStr = `${WALLET_API_URL}/condition?accountAddress=${address}&isActive=true`;
      axios.get(queryStr).then(({ data: { conditions } }) => {
        setPendingQueries([
          ...conditions.map((x: any) => ({
            ...x.query,
            id: `c${x.id}`,
            calls: x.query.calls,
            conditions: x.conditions,
            actions: x.actions,
            conditionId: x.id,
            simstatus: x.simstatus,
          })),
        ]);
      });
    } else {
      const queryStr = `${WALLET_API_URL}/history?accountAddress=${address}`;
      axios.get(queryStr).then(({ data: { histories } }) => {
        setHistoryQueries([
          ...histories.map((x: any) => ({
            ...x.query,
            id: `h${x.id}`,
            conditions: x.conditions,
            actions: x.actions,
            timestamp: x.timestamp,
          })),
        ]);
      });
    }
  }, [address, mode]);

  useEffect(() => {
    mainQueries.map((x) => {
      x.actions.map((act) => {
        Object.entries(act.args).map(async ([key, value]) => {
          if (
            !iconArray.find((x) => x.coin === value) &&
            (key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("chain"))
          ) {
            const url = await getIconFromToken(value);
            setIconArray([...iconArray, { coin: value, image: url }]);
          }
        });
      });
    });

    historyQueries.map((x) => {
      x.actions.map((act) => {
        Object.entries(act.args).map(async ([key, value]) => {
          if (
            !iconArray.find((x) => x.coin === value) &&
            (key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("chain"))
          ) {
            const url = await getIconFromToken(value);
            setIconArray([...iconArray, { coin: value, image: url }]);
          }
        });
      });
    });

    pendingQueries.map((x) => {
      x.actions.map((act) => {
        Object.entries(act.args).map(async ([key, value]) => {
          if (
            !iconArray.find((x) => x.coin === value) &&
            (key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("chain"))
          ) {
            const url = await getIconFromToken(value);
            setIconArray([...iconArray, { coin: value, image: url }]);
          }
        });
      });
    });
  }, [mainQueries, historyQueries, pendingQueries, iconArray]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSubmitting) setComment("Building...");
    }, 3000);
    return () => clearTimeout(timer);
  }, [comment, isSubmitting]);

  useEffect(() => {
    if (processText.value === "Optimizing...") {
      const timer = setTimeout(() => {
        if (processText.value === "Optimizing...")
          setProcessText({ value: "Simulating...", id: processText.id });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [processText]);

  const handleDisconnect = async () => {
    await axios.post(
      `${WALLET_API_URL}/subscribe`,
      { address, subscription: "empty" },
      { headers: { "Content-Type": "application/json" } }
    );

    logout();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitting(true);
    setComment("Understanding...");
    e.preventDefault();

    const request = {
      message: command,
      user_address: embeddedWallet?.address,
    };
    try {
      const {
        data: { data },
      } = await axios.post(PROCESS_MESSAGE_API, JSON.stringify(request), {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { calls, message, message_id, placeholders } = data;
      const conditions = groupConditions(calls);
      const actions = !conditions
        ? calls
        : conditions.find((x) => x.conditions.length === 0)?.actions || [];
      setMainQueries([
        ...mainQueries,
        {
          id: `m${count}`,
          message: command,
          messageId: message_id,
          calls,
          conditions: [],
          actions,
          placeholders,
          description: message,
          simstatus: 0,
        },
      ]);
      setCount(count + 1);
      setCommand("");
      setSubmitting(false);
    } catch (error) {
      toast.error("Coming Soon!");
      setSubmitting(false);
      console.log("Error during AI API call", error);
    }
    setComment("");
    setSubmitting(false);
  };

  const processMessage = async (id: string) => {
    setProcessText({ value: "Optimizing...", id });
    const index = mainQueries.findIndex((x) => x.id === id);
    if (index === -1) return;
    let { actions, simstatus, messageId } = mainQueries[index];

    const resp = await simulateActions(
      messageId,
      actions,
      [],
      chain!.name,
      address!
    );
    if (!resp.message) {
      actions = resp.actions;
      if (simstatus > 0) {
        const newQueries = [...mainQueries];
        newQueries.splice(index, 1, {
          ...mainQueries[index],
          simstatus: 0,
        });
        setMainQueries(newQueries);
      }

      const hid = await executeCalls(
        switchChain,
        sendTransaction,
        { ...mainQueries[index], actions },
        chain!.name,
        address!,
        (actIndex: number, txIndex: number, hash?: string) => {
          const actions = [...mainQueries[index].actions];
          if (!hash) actions[actIndex].txHashes = new Array(txIndex).fill("");
          else actions[actIndex].txHashes![txIndex] = hash;

          const newQueries = [...mainQueries];
          newQueries.splice(index, 1, { ...mainQueries[index], actions });
          setMainQueries(newQueries);
          setProcessText({ value: "Executing...", id: id });
        }
      );
      if (hid) setHiddenIds([...hiddenIds, id]);
    } else {
      toast.error(resp.message);
      const newQueries = [...mainQueries];
      newQueries.splice(index, 1, {
        ...mainQueries[index],
        simstatus: 1,
      });
      setMainQueries(newQueries);
    }

    setProcessText({ value: "", id: "" });
    setRunningIds(runningIds.filter((x) => x !== id));
  };

  const handleChangeParams = (
    id: string,
    actionIndex: number,
    key: string,
    value: string
  ) => {
    setProcessText({ value: "Optimizing...", id });
    const index = mainQueries.findIndex((x) => x.id === id);
    if (index === -1) return;

    const actions = [...mainQueries[index].actions];
    actions[actionIndex].args[key] = value;
    const queries = [...mainQueries];
    queries.splice(index, 1, { ...mainQueries[index], actions });
    setMainQueries(queries);
  };

  const handleSubmit = async (id: string) => {
    setStatsText({ value: "", id: "" });
    const index = mainQueries.findIndex((x) => x.id === id);
    if (index === -1) return;

    setProcessText({ value: "Loading...", id });
    setRunningIds([...runningIds, id]);

    let { calls, actions, messageId } = mainQueries[index];
    const hasCondition =
      calls.filter((x) => CONDITIONS.includes(x.name)).length > 0;
    if (hasCondition) {
      const updatedCalls = calls
        .map((x) => ({
          ...x,
          body: fillBody(x.args, chain?.name, address),
        }))
        .map((x) => ({ ...x, body: parseTime(x.body) }));
      const conditions = groupConditions(updatedCalls)!;
      try {
        const body = {
          accountAddress: address,
          query: {
            ...mainQueries[index],
            calls: updatedCalls,
          },
          conditions: conditions.filter((x) => x.conditions.length > 0),
          connectedChainName: chain!.name,
          messageId,
        };

        const {
          data: { ids },
        } = await axios.post(
          `${WALLET_API_URL}/condition`,
          JSON.stringify(body),
          { headers: { "Content-Type": "application/json" } }
        );
        if ((ids || []).length > 0 && actions.length === 0)
          setHiddenIds([...hiddenIds, id]);
      } catch (error) {
        console.log("API Call error - store conditions", error);
        setStatsText({ value: "Invalid Query", id });
      }
    }
    if (actions.length > 0) {
      try {
        if (!walletStats || !embeddedWallet) return;
        const firstAction = actions[0];
        const chainName =
          firstAction.args["sourceChainName"] ||
          firstAction.args["chainName"] ||
          chain?.name ||
          "ethereum";
        const chainId = getChainIdFromName(chainName)!;
        const srcChain: any = chains.find((x) => x.id === chainId);
        const srcRPC = getRpcUrlForChain(chainId);
        if (!srcRPC) {
          throw `no rpc for ${chainId}`;
        }
        let needInitialFunds = false;
        const requiredNative = utils.parseUnits(
          chainId === 1 ? "0.01" : "0.005",
          srcChain.nativeCurrency.decimals
        );
        const nativeBalance = await getNativeBalanceForUser(
          chainId,
          embeddedWallet!.address
        );
        const nativeTokenSymbol = getNativeTokenSymbolForChain(chainId);
        if (!nativeTokenSymbol) {
          throw "no native token found";
        }
        if (nativeBalance.lt(requiredNative)) {
          const nativeTokenRequired = utils.formatUnits(
            requiredNative.sub(nativeBalance),
            srcChain.nativeCurrency.decimals
          );
          setPendingId(id);
          needInitialFunds = true;
          if (nativeTokenSymbol !== null && nativeTokenRequired !== null) {
            setNeedGas({
              chainName: srcChain.network,
              token: nativeTokenSymbol,
              tokenRequired: nativeTokenRequired,
            });
          } else {
            throw "native null";
          }
        }
        const token =
          firstAction.args["token"] || firstAction.args["inputToken"];
        let amount =
          firstAction.args["amount"] || firstAction.args["inputAmount"];
        if (!token || token.toLowerCase() === "all") {
          const tokenHoldings = await getTokenHoldings(
            embeddedWallet.address,
            chainId
          );
          if (
            tokenHoldings.length === 0 ||
            (tokenHoldings.length === 1 &&
              tokenHoldings[0].toLowerCase() ===
                nativeTokenSymbol.toLowerCase())
          ) {
            // onboard all tokens from external wallet to embedded wallet
            if (externalWallet?.address) {
              needInitialFunds = true;
              setNeedOnboardAll(true);
              setOnboardChainName(chainName);
            }
          }
        } else if (token.toLowerCase() === nativeTokenSymbol.toLowerCase()) {
          const tokenBalance = await getNativeBalanceForUser(
            chainId,
            embeddedWallet!.address
          );
          const externalTokenBalance = await getNativeBalanceForUser(
            chainId,
            externalWallet!.address
          );
          if (amount === undefined || amount === "all" || amount === "half") {
            if (tokenBalance.lte(requiredNative)) {
              amount = utils.formatUnits(
                amount === "half" ? externalTokenBalance.div(2) : tokenBalance,
                srcChain.nativeCurrency.decimals
              );
            } else {
              amount = utils.formatUnits(
                amount === "half" ? tokenBalance.div(2) : tokenBalance,
                srcChain.nativeCurrency.decimals
              );
            }
          }
          if (
            tokenBalance.lt(
              utils.parseUnits(amount, srcChain.nativeCurrency.decimals)
            )
          ) {
            const tokenRequired = utils.formatUnits(
              utils
                .parseUnits(amount, srcChain.nativeCurrency.decimals)
                .sub(tokenBalance),
              srcChain.nativeCurrency.decimals
            );
            if (
              externalTokenBalance.lt(
                utils.parseUnits(
                  tokenRequired,
                  srcChain.nativeCurrency.decimals
                )
              )
            ) {
              throw "not enough token";
            }
            setPendingId(id);
            needInitialFunds = true;
            if (token !== null && tokenRequired !== null) {
              if (needGas) {
                const {
                  chainName: prevChainName,
                  token: prevToken,
                  tokenRequired: prevTokenRequired,
                } = needGas;
                if (prevChainName !== srcChain.network) {
                  throw `${prevChainName} doesnt match ${srcChain.network}`;
                }
                if (prevToken !== token) {
                  throw `${prevToken} doesnt match ${token}`;
                }
                const newTokenRequired = utils.formatUnits(
                  utils
                    .parseUnits(
                      prevTokenRequired,
                      srcChain.nativeCurrency.decimals
                    )
                    .add(
                      utils.parseUnits(
                        tokenRequired,
                        srcChain.nativeCurrency.decimals
                      )
                    ),
                  srcChain.nativeCurrency.decimals
                );
                setNeedGas({
                  chainName: srcChain.network,
                  token: token,
                  tokenRequired: newTokenRequired,
                });
              } else {
                const newTokenRequired = utils.formatUnits(
                  requiredNative.add(
                    utils.parseUnits(
                      tokenRequired,
                      srcChain.nativeCurrency.decimals
                    )
                  ),
                  srcChain.nativeCurrency.decimals
                );
                setNeedGas({
                  chainName: srcChain.network,
                  token: token,
                  tokenRequired: newTokenRequired,
                });
              }
            } else {
              throw "native null 2";
            }
          }
        } else {
          const tokenAddress = await getTokenAddress(chainName, token);
          const provider = new providers.JsonRpcProvider(srcRPC, chainId);
          const contract = new ethers.Contract(
            tokenAddress,
            ERC20_ABI,
            provider
          );
          const decimals = await contract.decimals();
          const tokenBalance = await contract.balanceOf(
            embeddedWallet?.address
          );
          const externalTokenBalance = await contract.balanceOf(
            externalWallet?.address
          );
          if (amount === undefined || amount === "all" || amount === "half") {
            if (tokenBalance === 0) {
              amount = utils.formatUnits(
                amount === "half" ? externalTokenBalance.div(2) : tokenBalance,
                decimals
              );
            } else {
              amount = utils.formatUnits(
                amount === "half" ? tokenBalance.div(2) : tokenBalance,
                decimals
              );
            }
          }
          if (tokenBalance.lt(utils.parseUnits(amount, decimals))) {
            const tokenRequired = utils
              .parseUnits(amount, decimals)
              .sub(tokenBalance);
            if (externalTokenBalance.lt(tokenRequired)) {
              throw "not enough token";
            }
            setPendingId(id);
            needInitialFunds = true;
            setInitialToken({
              chainName: srcChain.network,
              token,
              tokenRequired: utils.formatUnits(tokenRequired, decimals),
            });
          }
        }
        if (!needInitialFunds) {
          await processMessage(id);
        }
      } catch (err: any) {
        console.log("Execution error:", err);
        setStatsText({ value: `Invalid Query ${err}`, id });
      }
    }
    setRunningIds(runningIds.filter((x) => x !== id));
  };

  const handleDelete = (id: string) => {
    setCanceledIds([...canceledIds, id]);
  };

  const handleCancel = async (id: string) => {
    const index = pendingQueries.findIndex((x) => x.id === id);
    const { conditionId } = pendingQueries[index];
    const signature = await signMessage(
      `I authorize cancellation #${conditionId}`
    );
    try {
      const {
        data: { message },
      } = await axios.post(
        `${WALLET_API_URL}/cancel`,
        { accountAddress: address, conditionId, signature },
        { headers: { "Content-Type": "application/json" } }
      );
      if (!message)
        setPendingQueries(pendingQueries.filter((x) => x.id !== id));
    } catch (error) {
      console.log("Error during cancel condition transaction", error);
    }
  };

  const checkWeb3Provider = async (chainId: number) => {
    let srcChain: any = chains.find((x) => x.id === chainId);
    const srcRPC = getRpcUrlForChain(chainId);
    if (!srcRPC) {
      throw `no rpc for ${chainId}`;
    }
    if (window.ethereum) {
      try {
        const currentChainIdStr = await window.ethereum.request({
          method: "eth_chainId",
        });
        const currentChainId = BigNumber.from(currentChainIdStr).toNumber();
        if (currentChainId === chainId) {
        } else {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x" + chainId.toString(16) }],
            });
          } catch (err) {
            console.log(err);
            // This error code indicates that the chain has not been added to MetaMask, but error code fails to compile
            if (true) {
              // err && (err?.code === 4902 || err?.code === -32603)) {
              const isAdded = await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x" + chainId.toString(16),
                    chainName: srcChain.name,
                    rpcUrls: [srcRPC],
                    blockExplorerUrls: [srcChain.blockExplorers.default.url],
                    nativeCurrency: {
                      symbol: srcChain.nativeCurrency.symbol,
                      decimals: srcChain.nativeCurrency.decimals,
                    },
                  },
                ],
              });
              if (isAdded) {
                console.log("Switched to the desired chain.");
              } else {
                console.error("Failed to switch to the desired chain.");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      console.error("Ethereum is not available in this browser.");
    }
  };

  const transferInitialFunds = async () => {
    if (externalWallet && embeddedWallet) {
      setPendingTx("");
      if (needOnboardAll) {
        try {
          const chainId = getChainIdFromName(onboardChainName!)!;
          let srcChain: any = chains.find((x) => x.id === chainId);
          const externalTokenHoldings = await getTokenHoldings(
            externalWallet.address,
            chainId
          );
          const nativeTokenSymbol = getNativeTokenSymbolForChain(
            chainId
          ) as string;
          for (let i = 0; i < externalTokenHoldings.length; i++) {
            const token = externalTokenHoldings[i];
            if (token.toLowerCase() !== nativeTokenSymbol.toLowerCase()) {
              await onboardToken(onboardChainName!, token, "all");
            }
          }

          const provider3 = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider3.getSigner();

          const nativeTokenBalance = await provider3.getBalance(
            externalWallet.address
          );
          const requiredNative = utils.parseUnits(
            chainId === 1 ? "0.01" : "0.005",
            srcChain.nativeCurrency.decimals
          );

          if (nativeTokenBalance.gt(requiredNative)) {
            // Send transaction
            const txn = {
              from: externalWallet.address,
              to: embeddedWallet.address,
              value: nativeTokenBalance.sub(requiredNative),
            };
            const res = await signer.sendTransaction(txn);
            setPendingTx(res.hash);
            await res.wait();
            setPendingTx(null);
          }

          setNeedOnboardAll(false);
          setOnboardChainName(null);
        } catch (err: any) {
          toast.error(err.message);
        }

        await processMessage(pendingId!);
        setPendingId(null);

        return;
      }

      if (needGas) {
        try {
          const { chainName, token, tokenRequired } = needGas;
          const chainId = getChainIdFromName(chainName)!;
          await checkWeb3Provider(chainId);
          const provider3 = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider3.getSigner();

          // Send transaction
          const txn = {
            from: externalWallet.address,
            to: embeddedWallet.address,
            value: utils.parseEther(tokenRequired),
          };
          const res = await signer.sendTransaction(txn);
          setPendingTx(res.hash);
          await res.wait();
          setPendingTx(null);
          setNeedGas(null);
        } catch (err: any) {
          toast.error(err.message);
          return;
        }
      }

      if (initialToken) {
        try {
          const { chainName, token, tokenRequired } = initialToken;
          await onboardToken(chainName, token, tokenRequired);
          setInitialToken(null);
        } catch (err: any) {
          toast.error(err.message);
          return;
        }
      }
      await processMessage(pendingId!);
      setPendingId(null);
    }
  };

  const onboardToken = async (
    chainName: string,
    token: string,
    amount: string
  ) => {
    if (externalWallet && embeddedWallet) {
      const chainId = getChainIdFromName(chainName)!;
      await checkWeb3Provider(chainId);
      const provider3 = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider3.getSigner();
      const tokenAddress = await getTokenAddress(chainName, token);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider3);
      let data;
      if (amount === "all") {
        const balance = await contract.balanceOf(externalWallet.address);
        data = contract.interface.encodeFunctionData("transfer", [
          embeddedWallet.address,
          balance,
        ]);
      } else {
        const decimals = await contract.decimals();
        data = contract.interface.encodeFunctionData("transfer", [
          embeddedWallet.address,
          utils.parseUnits(amount, decimals),
        ]);
      }
      const txn = {
        from: externalWallet.address,
        to: tokenAddress,
        data,
      };
      // Send transaction
      const res = await signer.sendTransaction(txn);
      setPendingTx(res.hash);
      await res.wait();
      setPendingTx(null);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    if (externalWallet && embeddedWallet && walletStats) {
      const provider = await embeddedWallet.getEthersProvider();
      const signer = provider.getSigner();
      try {
        const txn = {
          from: embeddedWallet.address,
          to: externalWallet.address,
          value: utils.parseUnits(withdrawAmount, walletStats.decimals),
        };

        const res = await signer.sendTransaction(txn);
        setWithdrawTx(res.hash);
        await res.wait();
        toast.success(`${withdrawAmount} ${walletStats.symbol} withdrawed!`);
        setWithdrawTx(null);
        setWithdrawAmount("");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
    setWithdrawing(false);
  };

  const handleDeposit = async () => {
    setDepositing(true);
    if (externalWallet && embeddedWallet && walletStats) {
      const provider = await externalWallet.getEthersProvider();
      const signer = provider.getSigner();

      try {
        const txn = {
          from: externalWallet.address,
          to: embeddedWallet.address,
          value: utils.parseUnits(depositAmount, walletStats.decimals),
        };

        const res = await signer.sendTransaction(txn);
        setDepositTx(res.hash);
        await res.wait();
        toast.success(`${depositAmount} ${walletStats.symbol} deposited!`);
        setDepositTx(null);
        setDepositAmount("");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
    setDepositing(false);
  };

  const queriesToShow = useMemo(() => {
    return [mainQueries, pendingQueries, historyQueries, []][mode].filter(
      (x) => !hiddenIds.includes(x.id)
    );
  }, [hiddenIds, historyQueries, mainQueries, mode, pendingQueries]);

  return <ActionTab />;
}
