/* eslint-disable react-hooks/exhaustive-deps */
import Image from "next/image";
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
import HideLeft from "@/assets/HideLeft.svg";

export type ActionProps = {
  mode: any;
  visible: boolean;
  setVisible: (val: boolean) => void;
};

export default function ActionTab(props: ActionProps) {
  const { authenticated, ready, signMessage, sendTransaction, exportWallet } =
    usePrivy();
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
  const [address, setAddress] = useState<string | undefined>();
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
    // set connected & address status
    let auth = ready && authenticated && wallet?.walletClientType === "privy";
    if (wallet?.address === address) return;

    setAddress(wallet?.address);
  }, [address, authenticated, ready, wallet]);

  useEffect(() => {
    const fetchEntities = async () => {
      const res = await axios.get(`${WALLET_API_URL}/verified-entities`);
      setVerifiedEntities(res.data);
    };
    fetchEntities();
  }, []);

  useEffect(() => {
    if (!address) return;

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
  }, [address]);

  console.log(mainQueries);
  const switchChain = useCallback(
    async (chainId: number) => {
      if (!wallet) return;
      if (+wallet.chainId.split(":")[1] !== chainId)
        await wallet!.switchChain(chainId);
    },
    [wallet]
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
  }, [address, chain, sendTransaction, switchChain]);

  useEffect(() => {
    if (!address) return;

    if (props.mode === 0) {
    } else if (props.mode === 1) {
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
  }, [address, props.mode]);

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
    return [mainQueries, pendingQueries, historyQueries, []][props.mode].filter(
      (x) => !hiddenIds.includes(x.id)
    );
  }, [hiddenIds, historyQueries, mainQueries, props.mode, pendingQueries]);

  return (
    <div
      className={`${
        props.visible == false ? "flex w-full" : "hidden md:flex md:w-full"
      } bg-[#383838] text-white min-h-[880px] px-12`}
    >
      <div
        className="flex sm:hidden w-[24px]"
        onClick={() => props.setVisible(!props.visible)}
      >
        <Image className="p-1" width={18} src={HideLeft} alt="Hide Left" />
      </div>
      <div className="container mx-auto flex-1 max-w-[1000px] flex flex-col items-center">
        <div className="w-full flex-1 my-3">
          {props.mode < 3 ? (
            queriesToShow.map((query) => (
              <Response
                key={query.id}
                mode={props.mode}
                query={query}
                runningIds={runningIds}
                canceledIds={canceledIds}
                statsText={statsText}
                processText={processText}
                iconArray={iconArray}
                verifiedData={verifiedEntities}
                handleChangeParams={handleChangeParams}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                onCancel={handleCancel}
              />
            ))
          ) : (
            <div>
              {/*Funds Tab*/}
              <div className="flex justify-between w-full">
                <div>
                  Balance of {walletStats?.symbol}: {walletStats?.formatted}
                </div>
                <button
                  className="flex px-4 py-1 rounded"
                  onClick={exportWallet}
                  style={{ border: "solid 1px gray", width: "140px" }}
                >
                  Export Wallet Private Key
                </button>
              </div>
              <br />
              <div>
                <div className="flex gap-2">
                  <div className="flex items-center">
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none w-48 px-2 py-1"
                      placeholder={`Withdraw Amount (${walletStats?.symbol})`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      disabled={withdrawing}
                      style={{ border: "solid 1px gray" }}
                    />
                  </div>
                  <button
                    className="flex py-1 rounded justify-center disabled:bg-gray-300"
                    onClick={handleWithdraw}
                    style={{ border: "solid 1px gray", width: "150px" }}
                    disabled={
                      withdrawAmount.length === 0 ||
                      isNaN(parseFloat(withdrawAmount)) ||
                      withdrawing
                    }
                  >
                    Withdraw
                    {withdrawing && <div className="loader" />}
                  </button>
                </div>
                {withdrawTx && (
                  <div>
                    <Link
                      href={`https://etherscan.io/tx/${withdrawTx}`}
                      target="_blank"
                    >
                      <span className="underline">
                        {ellipseMiddle(withdrawTx, 6)}
                      </span>
                    </Link>
                    <p className="text-green-700">Success</p>
                  </div>
                )}
              </div>
              <div>
                <div className="flex gap-2">
                  <div className="flex items-center">
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none w-48 px-2 py-1"
                      placeholder={`Deposit Amount (${walletStats?.symbol})`}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      disabled={depositing}
                      style={{ border: "solid 1px gray" }}
                    />
                  </div>
                  <button
                    className="flex py-1 rounded justify-center disabled:bg-gray-300"
                    onClick={handleDeposit}
                    style={{ border: "solid 1px gray", width: "150px" }}
                    disabled={
                      depositAmount.length === 0 ||
                      isNaN(parseFloat(depositAmount)) ||
                      depositing
                    }
                  >
                    Deposit
                    {depositing && <div className="loader" />}
                  </button>
                </div>
                {depositTx && (
                  <div>
                    <Link
                      href={`https://etherscan.io/tx/${depositTx}`}
                      target="_blank"
                    >
                      <span className="underline">
                        {ellipseMiddle(depositTx, 6)}
                      </span>
                    </Link>
                    <p className="text-green-700">Success</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {props.mode === 0 && (
          <>
            <form
              className="w-full p-3 rounded-[5px] bg-gray-900 border flex"
              onSubmit={onSubmit}
            >
              <input
                type="text"
                className="flex-1 bg-transparent outline-none"
                placeholder="Enter your command here"
                value={command}
                disabled={isSubmitting}
                onChange={(e) => setCommand(e.target.value)}
              />
              {isSubmitting ? (
                <div className="loader" />
              ) : (
                <button type="submit" className="ml-3">
                  <Image src="/send.png" alt="send" width={24} height={24} />
                </button>
              )}
            </form>
            <div className="mt-1">{comment}&nbsp;</div>
          </>
        )}
      </div>

      {needOnboardAll || needGas || initialToken ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="relative w-auto my-6 mx-auto max-w-md">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-slate-700 text-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Initial Gas & Tokens
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => {
                      setRunningIds(runningIds.filter((x) => x !== pendingId));
                      if (pendingId !== null)
                        setCanceledIds([...canceledIds, pendingId]);
                      setPendingId(null);
                      setNeedOnboardAll(false);
                      setOnboardChainName(null);
                      setInitialToken(null);
                      setNeedGas(null);
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 14 14"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                      />
                    </svg>
                    <span className="sr-only">Close modal</span>
                  </button>
                </div>
                <div className="relative p-5 flex-auto">
                  <p className="my-2 text-slate-300 text-lg leading-relaxed">
                    Your embedded wallet does not have initial balance. You need
                    to transfer initial balance from your external wallet.
                    Please click [OK] to transfer&nbsp;
                    {needOnboardAll ? (
                      "all tokens"
                    ) : (
                      <>
                        {needGas
                          ? `${
                              needGas.tokenRequired
                            } ${needGas.token.toUpperCase()}`
                          : ""}
                        &nbsp;
                        {initialToken
                          ? `${
                              initialToken.tokenRequired
                            } ${initialToken.token.toUpperCase()}`
                          : ""}
                      </>
                    )}
                    &nbsp;from your external wallet to embedded wallet.
                  </p>
                </div>
                <div className="flex items-center justify-center px-6 pb-4 rounded-b">
                  <button
                    className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    disabled={pendingTx !== null}
                    onClick={transferInitialFunds}
                  >
                    OK
                  </button>
                </div>
                <div className="flex items-center justify-center px-6 pb-4 rounded-b">
                  {pendingTx === "" ? (
                    <div className="loader" />
                  ) : (
                    pendingTx && (
                      <>
                        Transaction submitted:&nbsp;
                        <Link
                          href={`https://etherscan.io/tx/${pendingTx}`}
                          target="_blank"
                        >
                          <span className="underline">
                            {ellipseMiddle(pendingTx, 6)}
                          </span>
                        </Link>
                        <div className="loader ml-2" />
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </div>
  );
}
