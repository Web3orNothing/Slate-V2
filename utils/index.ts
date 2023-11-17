import axios from "axios";
import { BigNumber, Contract, providers, utils } from "ethers";
import { Call, Condition, CONDITIONS, Query } from "@/components/Response";
import { WALLET_API_URL } from "@/config/constants/backend";
import ERC20_ABI from "@/abis/erc20.abi.js";

export const getChainIdFromName = (chainName: string) => {
  const chainNamesToIds: { [key: string]: number } = {
    ethereum: 1,
    mainnet: 1,
    homestead: 1,
    optimism: 10,
    cronos: 25,
    binancesmartchain: 56,
    bsc: 56,
    bnb: 56,
    binance: 56,
    ethclassic: 61,
    classic: 61,
    gnosis: 100,
    polygon: 137,
    matic: 137,
    fantom: 250,
    filecoin: 314,
    "filecoin-mainnet": 314,
    moonbeam: 1284,
    moonriver: 1285,
    kava: 2222,
    mantle: 5000,
    canto: 7700,
    base: 8453,
    arbitrum: 42161,
    celo: 42220,
    avalanche: 43114,
    linea: 59144,
    "linea-mainnet": 59144,
  };

  return chainNamesToIds[chainName.toLowerCase()] || null;
};

export const getRpcUrlForChain = (chainId: number) => {
  const chainIdsToRpcUrls: { [key: number]: string } = {
    1: "https://rpc.mevblocker.io",
    10: "https://optimism.llamarpc.com",
    25: "https://cronos-evm.publicnode.com",
    56: "https://binance.llamarpc.com",
    61: "https://etc.rivet.link",
    100: "https://gnosis.publicnode.com",
    137: "https://polygon.llamarpc.com",
    250: "https://fantom.publicnode.com",
    314: "https://rpc.ankr.com/filecoin",
    1284: "https://rpc.api.moonbeam.network",
    1285: "https://moonriver.publicnode.com",
    2222: "https://kava-evm.publicnode.com",
    5000: "https://rpc.mantle.xyz",
    7700: "https://canto.slingshot.finance",
    8453: "https://base.llamarpc.com",
    42161: "https://arbitrum.llamarpc.com",
    42220: "https://1rpc.io/celo",
    43114: "https://avalanche-c-chain.publicnode.com",
    59144: "https://rpc.linea.build",
  };

  return chainIdsToRpcUrls[chainId] || null;
};

export const getWSSUrlForChain = (chainId: number) => {
  const chainIdsToWssUrls: { [key: number]: string } = {
    1: "wss://eth-mainnet.g.alchemy.com/v2/7j-EEDok2_NNZ4pSJ1upNEetKJkmtY87",
    42161:
      "wss://arb-mainnet.g.alchemy.com/v2/hCdznf3eG5zUC3GAGlxKK5Mdg74YHg0H",
  };
  return chainIdsToWssUrls[chainId] || null;
};

export const fillBody = (
  args: { [key: string]: any },
  chainName = "Ethereum",
  address: string | undefined
): { [key: string]: any } => {
  const result = { ...args };
  if (address) {
    result["accountAddress"] = address;
  }
  if ((result["chainName"] || "") === "") {
    result["chainName"] = chainName.toLowerCase();
  }
  if ((result["sourceChainName"] || "") === "") {
    result["sourceChainName"] = chainName.toLowerCase();
  }
  if ((result["destinationChainName"] || "") === "") {
    result["destinationChainName"] = chainName.toLowerCase();
  }
  if (result["action"]) {
    result["action"] = result["action"].toLowerCase();
  }
  return result;
};

export const parseTime = (args: {
  [key: string]: any;
}): { [key: string]: any } => {
  const { start_time } = args;
  if (!start_time) return args;

  const range = ["am", "pm"];
  const units = [
    { unit: "second", value: 1 },
    { unit: "sec", value: 1 },
    { unit: "minute", value: 60 },
    { unit: "min", value: 60 },
    { unit: "hour", value: 60 * 60 },
    { unit: "hr", value: 60 * 60 },
    { unit: "day", value: 60 * 60 * 24 },
    { unit: "week", value: 60 * 60 * 24 * 7 },
    { unit: "month", value: 60 * 60 * 24 * 30 },
    { unit: "year", value: 60 * 60 * 24 * 365 },
  ];

  let retValue = start_time;
  let r = range.find((x) => start_time.toLowerCase().includes(x));
  let u = units.find((x) => start_time.toLowerCase().includes(x.unit));
  if (r) {
    const timeValues = start_time.toLowerCase().replace(r, "").split(":");
    const hour =
      parseInt(timeValues[0]) + (r === "am" || timeValues[0] === "12" ? 0 : 12);
    const minute = timeValues.length > 1 ? parseInt(timeValues[1]) : 0;
    const second = timeValues.length > 2 ? parseInt(timeValues[2]) : 0;
    const time = new Date();
    time.setHours(hour, minute, second, 0);
    retValue = Math.floor(time.getTime() / 1000);
    if (time.getTime() <= Date.now()) retValue += 86400;
  } else if (u) {
    const index = start_time.toLowerCase().indexOf(u.unit);
    const timeValue =
      parseInt(start_time.toLowerCase().slice(0, index)) * u.value;
    retValue = Math.floor(Date.now() / 1000) + timeValue;
  }

  return { ...args, start_time: retValue, type: "time" };
};

export const simulateActions = async (
  messageId: number,
  actions: Call[],
  conditions: Call[],
  connectedChainName: string,
  accountAddress: string,
  conditionId?: string | undefined
) => {
  try {
    const {
      data: { message, actions: updatedActions },
    } = await axios.post(
      `${WALLET_API_URL}/simulate`,
      {
        messageId,
        actions,
        conditions,
        accountAddress,
        conditionId,
        connectedChainName,
      },
      { headers: { "Content-Type": "application/json" } }
    );
    return { message, actions: updatedActions };
  } catch (error: any) {
    return { message: error.response.data.message };
  }
};

export const executeCalls = async (
  switchChain: any,
  sendTx: any,
  query: Query,
  connectedChainName: string,
  address: string,
  callback?: any
): Promise<number | undefined> => {
  const { conditions, actions, messageId } = query;

  let i = 0;
  for (; i < actions.length; i++) {
    let token;
    let chainName;
    const action = actions[i];
    const nextAction = actions[i + 1];
    const sourceChainName =
      action.args["sourceChainName"] ||
      action.args["chainName"] ||
      connectedChainName;
    const chainId = getChainIdFromName(sourceChainName)!;

    if (action.name === "swap" || action.name === "bridge") {
      if (i < actions.length - 1) {
        token = action.args["outputToken"] || action.args["token"];
        chainName =
          action.args["destinationChainName"] || action.args["chainName"];
      }
    }

    let apiPassed = false;
    try {
      const body = fillBody(action.args, connectedChainName, address);
      const res = await axios.post(
        `${WALLET_API_URL}/${action.name}`,
        JSON.stringify(body),
        { headers: { "Content-Type": "application/json" } }
      );
      apiPassed = true;
      const { transactions } = res.data;
      await storeGeneratedTxs(messageId, transactions);
      const txs = transactions.map((tx: any) => ({
        ...tx,
        value: BigNumber.from(tx.value).toBigInt(),
      }));
      callback(i, txs.length);
      actions[i].txHashes = new Array(txs.length).fill("");

      for (let j = 0; j < txs.length; j++) {
        await switchChain(chainId);
        const res = await sendTx({ ...txs[j], chainId });
        if (!res) throw new Error("Send transaction failed");

        const hash = res.transactionHash;
        callback(i, j, hash);
        actions[i].txHashes![j] = hash;
        const rpcUrl = getRpcUrlForChain(chainId)!;
        const provider = new providers.JsonRpcProvider(rpcUrl, chainId);
        await provider.waitForTransaction(hash);

        if (!nextAction) continue;
        const amtStr =
          nextAction.args["inputAmount"] || nextAction.args["amount"] || "";
        if (j < txs.length - 1 || !isNaN(parseFloat(amtStr))) continue;

        let amount;
        if (token && chainName) {
          const _token = await getTokenAddress(chainName, token);
          const receipt = await provider.getTransactionReceipt(hash);
          if (action.name === "swap") {
            const logs = receipt.logs || [];
            for (let k = 0; k < logs.length; k++) {
              const log = logs[k];
              if (
                log.topics[0] ===
                  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
                log.address.toLowerCase() === _token
              ) {
                const [to] = utils.defaultAbiCoder.decode(
                  ["address"],
                  log.topics[2]
                );
                if (to.toLowerCase() === address?.toLowerCase()) {
                  const [value] = utils.defaultAbiCoder.decode(
                    ["uint256"],
                    log!.data
                  );
                  const tokenContract = new Contract(
                    _token,
                    ERC20_ABI,
                    provider
                  );
                  const decimals: number = await tokenContract.decimals();
                  amount = utils.formatUnits(value, decimals);
                  break;
                }
              }
            }
          } else if (
            action.name === "bridge" &&
            sourceChainName === chainName &&
            action.args["inputToken"] === nextAction.args["inputToken"]
          ) {
            const destinationChainId = getChainIdFromName(chainName)!;
            const wssProvider = new providers.WebSocketProvider(
              getWSSUrlForChain(destinationChainId)!
            );
            const tokenContract = new Contract(_token, ERC20_ABI, wssProvider);
            tokenContract.on("Transfer", async (_, to, value) => {
              if (to.toLowerCase() !== address.toLowerCase()) return;
              const decimals = await tokenContract.decimals();
              const amt = utils.formatUnits(value, decimals);
              window.localStorage.setItem(hash, amt.toString());
            });
            const now = Date.now();
            while (Date.now() <= now + 10 * 60 * 1000) {
              const amt = window.localStorage.getItem(hash);
              if (amt) {
                amount = amt.toString();
                break;
              }
              await sleep(10000);
            }
            tokenContract.removeAllListeners();
            window.localStorage.removeItem(hash);
          }
        }

        actions[i + 1].args["inputAmount"] = amount;
        actions[i + 1].args["amount"] = amount;
      }
    } catch (error) {
      console.log(
        `${apiPassed ? "Transaction" : "API Call"} error: ${i}`,
        error
      );
      break;
    }
  }

  await setExecutedStatus(messageId, i === actions.length);

  if (i === actions.length) {
    try {
      const {
        data: { id },
      } = await axios.post(
        `${WALLET_API_URL}/history`,
        { accountAddress: address, conditions, query, actions },
        { headers: { "Content-Type": "application/json" } }
      );
      return id;
    } catch (error) {
      console.log("Error saving history", error);
    }
  }
};

export const storeGeneratedTxs = async (
  messageId: number,
  transactions: any
) => {
  await axios.post(
    `${WALLET_API_URL}/store-generated-transactions`,
    { messageId, transactions },
    { headers: { "Content-Type": "application/json" } }
  );
};

export const setExecutedStatus = async (
  messageId: number,
  success: boolean
) => {
  await axios.post(
    `${WALLET_API_URL}/set-executed-status`,
    { messageId, success },
    { headers: { "Content-Type": "application/json" } }
  );
};

export const getTokenHoldings = async (
  accountAddress: string,
  chainId: number
) => {
  const { data } = await axios.get(
    `${WALLET_API_URL}/token-holdings?accountAddress=${accountAddress}&chainId=${chainId}`
  );
  return data.tokens as string[];
};

export const getTokenAddress = async (chainName: string, token: string) => {
  const { data } = await axios.get(
    `${WALLET_API_URL}/token-address?chainName=${chainName}&tokenName=${token}`
  );
  return (data.address as string).toLowerCase();
};

export const ellipseMiddle = (target: string, charsStart = 4, charsEnd = 4) => {
  return `${target.slice(0, charsStart)}...${target.slice(
    target.length - charsEnd
  )}`;
};

export const getNativeBalanceForUser = async (
  chainId: number,
  user: string
) => {
  const rpcUrl = getRpcUrlForChain(chainId)!;
  const provider = new providers.JsonRpcProvider(rpcUrl, chainId);
  return await provider.getBalance(user);
};

export const getNativeTokenSymbolForChain = (chainId: number) => {
  const chainIdsToNativeTokenSymbols: { [key: number]: string } = {
    1: "ETH",
    10: "ETH",
    25: "CRO",
    56: "BNB",
    61: "ETH",
    100: "xDAI",
    137: "MATIC",
    250: "FTM",
    314: "FIL",
    1284: "GLMR",
    1285: "MOVR",
    2222: "KAVA",
    5000: "MNT",
    7700: "CANTO",
    8453: "ETH",
    42161: "ETH",
    42220: "CELO",
    43114: "AVAX",
    59144: "ETH",
    // Add more chainId-rpcUrl mappings here as needed
  };

  return chainIdsToNativeTokenSymbols[chainId] || null;
};

export const updateStatus = async (
  accountAddress: string,
  conditionId: string,
  status: string
) => {
  axios.post(
    `${WALLET_API_URL}/update-status`,
    { accountAddress, conditionId, status },
    { headers: { "Content-Type": "application/json" } }
  );
};

export const getExecutingIds = () => {
  const ids = window.localStorage.getItem("executing") || "";
  return ids.split(",").filter((x) => !!x && x.trim() !== "");
};

export const setExecutingIds = (ids: string[]) => {
  window.localStorage.setItem("executing", ids.join(","));
};

export const groupConditions = (calls: Call[]): Condition[] | undefined => {
  if (calls.filter((x) => CONDITIONS.includes(x.name)).length === 0)
    return undefined;

  const firstCallName = calls[0].name;
  const lastCallName = calls[calls.length - 1].name;

  const ret = [];
  let conditions: Call[] = [];
  let actions = [];
  if (firstCallName === "condition" || lastCallName === "condition") {
    const filtered = calls.filter((x) => x.name !== "time");
    if (firstCallName === "condition" && lastCallName === "condition") {
      let i = 0;
      let j = filtered.length - 1;
      let temp = [];
      while (filtered[i].name === "condition") conditions.push(filtered[i++]);
      while (filtered[j].name === "condition") temp.push(filtered[j--]);
      for (let k = i; k <= j; k++) {
        if (filtered[k].name !== "condition") {
          actions.push(filtered[k]);
          continue;
        }
        if (actions.length > 0) {
          ret.push({ conditions, actions });
          conditions = [];
        }
        actions = [];
        conditions.push(filtered[k]);
      }
      if (actions.length > 0)
        ret.push({ conditions: [...conditions, ...temp], actions });
    } else {
      const startIndex =
        firstCallName === "condition" ? 0 : filtered.length - 1;
      const endIndex = firstCallName === "condition" ? filtered.length - 1 : 0;
      const delta = firstCallName === "condition" ? 1 : -1;
      for (
        let i = startIndex;
        firstCallName === "condition" ? i <= endIndex : i >= endIndex;
        i += delta
      ) {
        if (filtered[i].name !== "condition") {
          actions.push(filtered[i]);
          continue;
        }
        if (actions.length > 0) {
          ret.push({ conditions, actions });
          conditions = [];
        }
        actions = [];
        conditions.push(filtered[i]);
      }
      if (actions.length > 0) ret.push({ conditions, actions });
    }
  } else if (firstCallName === "time" || lastCallName === "time") {
    const filtered = calls.filter((x) => x.name !== "condition");
    if (firstCallName === "time" && lastCallName === "time") {
      let i = 0;
      let j = filtered.length - 1;
      let temp = [];
      while (filtered[i].name === "time") conditions.push(filtered[i++]);
      while (filtered[j].name === "time") temp.push(filtered[j--]);
      for (let k = i; k <= j; k++) {
        if (filtered[k].name !== "time") {
          actions.push(filtered[k]);
          continue;
        }
        if (actions.length > 0) {
          ret.push({ conditions, actions });
          conditions = [];
        }
        actions = [];
        conditions.push(filtered[k]);
      }
      if (actions.length > 0)
        ret.push({ conditions: [...conditions, ...temp], actions });
    } else {
      const startIndex = firstCallName === "time" ? 0 : filtered.length - 1;
      const endIndex = firstCallName === "time" ? filtered.length - 1 : 0;
      const delta = firstCallName === "time" ? 1 : -1;
      for (
        let i = startIndex;
        firstCallName === "time" ? i <= endIndex : i >= endIndex;
        i += delta
      ) {
        if (filtered[i].name !== "time") {
          actions.push(filtered[i]);
          continue;
        }
        if (actions.length > 0) {
          ret.push({ conditions, actions });
          conditions = [];
        }
        actions = [];
        conditions.push(filtered[i]);
      }
      if (actions.length > 0) ret.push({ conditions, actions });
    }
  } else {
    for (let i = calls.length - 1; i >= 0; i--) {
      if (!CONDITIONS.includes(calls[i].name)) {
        actions.push(calls[i]);
        continue;
      }
      let k = i;
      while (k > 0) {
        if (!CONDITIONS.includes(calls[k].name)) break;
        conditions.push(calls[k--]);
      }
      i = k + 1;
      if (actions.length > 0) {
        for (k = 0; k < conditions.length - 1; k++) {
          if (conditions[k].name === conditions[k + 1].name) break;
        }
        if (k < conditions.length - 1) {
          ret.push({ conditions: conditions.slice(0, k + 1), actions });
          conditions = conditions.slice(k + 1);
        } else {
          ret.push({ conditions, actions });
          conditions = [];
        }
      }
      actions = [];
    }
    if (actions.length > 0) ret.push({ conditions, actions });
  }
  return ret;
};

export const getIconFromToken = async (token: string) => {
  try {
    const {
      data: { coins },
    } = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${token}`
    );
    return coins.find((x: any) => x.symbol === token.toUpperCase()).thumb;
  } catch (err) {
    return "undefined";
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
