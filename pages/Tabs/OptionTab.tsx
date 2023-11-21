import Image from "next/image";

import Logo1 from "@/assets/Logo1.svg";
import LeftArrow from "@/assets/LeftArrow.svg";
import AccountInactive from "@/assets/Account-inactive.svg";
import Account from "@/assets/Account.svg";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Tokens, TokenParam } from "@/config/constants/tokens";
import { ethers, utils } from "ethers";
import ERC20_ABI from "@/abis/erc20.abi";
import axios from "axios";
import { WALLET_API_URL } from "@/config/constants/backend";
import { historyPrompts, pendingPrompts } from "@/config/constants/emptyStatus";
import Response, { Icon as MyIcon, Query } from "@/components/Response";
import { getIconFromToken } from "@/utils";
import { styled } from "@mui/material/styles";

export type TabProps = {
  connected: boolean;
  visible: boolean;
  handleDisconnect: () => void;
  setVisible: (val: boolean) => void;
};

export type CopyIcon = {
  wallet: string;
  icon: number;
  visible: boolean;
};

export type PendingPrompt = {
  type: string;
  data: any[];
};

const modeData = [
  {
    icon: "lets-icons:wallet",
    mode: 1,
  },
  {
    icon: "octicon:book-16",
    mode: 2,
  },
  {
    icon: "ic:round-gps-fixed",
    mode: 3,
  },
];

const pendingTypes = ["gas", "price", "time", "marketcap", "balance"];

const WalletButton = styled("div")({
  padding: "8px 8px",
});

const ActionButton = styled("div")({
  padding: "8px 8px",
  borderRadius: "4px",
  cursor: "pointer",
  "&:hover": {
    background: "gray",
  },
});

const Referral = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#4d4e5e",
  color: "#AEB1DD",
  fontWeight: "bold",
  padding: "12px",
  margin: "12px",
  borderRadius: "10px",
});

const OptionTab = ({
  connected,
  visible,
  handleDisconnect,
  setVisible,
}: TabProps) => {
  const { exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const [mode, setMode] = useState(1);
  const [extBalances, setExtBalances] = useState<string[]>([]);
  const [embBalances, setEmbBalances] = useState<string[]>([]);
  const [historyCnt, setHistoryCnt] = useState(0);
  const [pendingCnt, setPendingCnt] = useState(0);
  const [historyContent, setHistoryContent] = useState<string>("");
  const [addrIcon, setAddrIcon] = useState<CopyIcon>();
  const [pendingData, setPendingData] = useState<PendingPrompt[]>([]);
  const [pendingQueries, setPendingQueries] = useState<Query[]>([]);
  const [historyData, setHistoryData] = useState<PendingPrompt[]>([]);
  const [historyQueries, setHistoryQueries] = useState<Query[]>([]);
  const [currentHistoryData, setCurrentHistoryData] = useState<{
    index: number;
    id: number;
  }>();
  const [currentPendingData, setCurrentPendingData] = useState<{
    index: number;
    id: number;
  }>();
  const [iconArray, setIconArray] = useState<MyIcon[]>([]);
  const [verifiedEntities, setVerifiedEntities] = useState<any>();

  const externalWallet = useMemo(
    () => (wallets || []).find((x: any) => x.walletClientType !== "privy"),
    [wallets]
  );

  const embeddedWallet = useMemo(
    () => (wallets || []).find((x: any) => x.walletClientType === "privy"),
    [wallets]
  );

  const makeAddr = (val: string | undefined) => {
    return val?.slice(0, 6) + "..." + val?.slice(val.length - 4);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const copyAddress = async (wallet: string) => {
    if (!embeddedWallet || !externalWallet) return;
    setAddrIcon({ wallet, icon: 1, visible: true });
    await navigator.clipboard.writeText(
      (wallet === "slate" ? embeddedWallet : externalWallet).address
    );
  };

  const cancelCondition = async (query: Query) => {
    await axios.post(
      `${WALLET_API_URL}/update-status`,
      {
        accountAddress: externalWallet?.address,
        conditionId: query.conditionId,
        status: query.status,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  };

  const showCondition = (query: any, type: string) => {
    let showData = "";
    const conditions = query.conditions[0].args;

    switch (type) {
      case "gas":
        showData = `${conditions.value} GWEI`;
        break;
      case "price":
        showData = `\$${conditions.value} ${conditions.subject.toUpperCase()}`;
        break;
      case "time":
        showData = `${formatTime(new Date(conditions.start_time))} UTC`;
        break;
      case "marketcap":
        showData = `${conditions.value} USD`;
        break;
      case "balance":
        showData = `${conditions.value} ${conditions.subject.toUpperCase()}`;
        break;
    }
    return showData;
  };

  const renderFundsContent = (balances: any[]) => {
    const displayData = Tokens.filter(
      (item, id) => parseFloat(balances[id]) > 0
    );
    const flag = displayData.length > 0;
    let content = `<div class="flex flex-col gap-4 ${
      !flag ? "blur-[4px] select-none" : ""
    }">`;

    content += (flag ? displayData : Tokens)
      .map((item, id) => {
        if (!flag && id === 2) return "<div style='height:24px;'></div>";
        const balance = parseFloat(
          flag ? balances[item.id] : "5.01240"
        ).toFixed(4);
        return `
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <img src="${item.icon.src}" alt="" />
              <p>${item.name}</p>
            </div>
            <div>${balance} $${item.currency}</div>
          </div>
        `;
      })
      .join("");

    content += "</div>";

    if (!flag) {
      content += `
        <div style="display:flex;align-items:center;gap:12px;position:absolute;top:80px;">
          <img src="${Tokens[2].icon.src}" alt="" />
          <p>Deposit funds into your Slate wallet to view.</p>
        </div>
      `;
    }

    return content;
  };

  useEffect(() => {
    const fetchEntities = async () => {
      const res = await axios.get(`${WALLET_API_URL}/verified-entities`);
      setVerifiedEntities(res.data);
    };
    fetchEntities();
  }, []);

  useEffect(() => {
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
  }, [historyQueries, pendingQueries, iconArray]);

  useEffect(() => {
    if (!embeddedWallet) return;
    try {
      axios
        .get(
          `${WALLET_API_URL}/condition?accountAddress=${embeddedWallet.address}`
        )
        .then(({ data: { conditions } }) => {
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

          setPendingCnt(conditions.length);
          const displayData = pendingTypes
            .map((type) =>
              (conditions.length > 0 ? pendingQueries : pendingPrompts).filter(
                (item: Query) => item.conditions[0].body.type === type
              )
            )
            .filter((tmp) => tmp.length > 0);

          console.log(displayData);
          const tmpData: PendingPrompt[] = [];
          displayData.forEach((item) => {
            tmpData.push({
              type: item[0].conditions[0].body.type,
              data: item,
            });
          });

          setPendingData(tmpData);
        });

      axios
        .get(
          `${WALLET_API_URL}/history?accountAddress=${embeddedWallet.address}`
        )
        .then(({ data: { histories } }) => {
          console.log(histories);
          setHistoryCnt(histories.length);
          setHistoryQueries([
            ...histories.map((x: any) => ({
              ...x.query,
              id: `h${x.id}`,
              conditions: x.conditions,
              actions: x.actions,
              timestamp: x.timestamp,
            })),
          ]);

          const displayData = histories.length > 0 ? histories : historyPrompts;
          let curDay: string = "";
          const tmpData: PendingPrompt[] = [];
          let tmp: any[] = [];
          curDay = formatDate(new Date(displayData[0].timestamp));
          displayData.map((item: any) => {
            const date = new Date(item.timestamp);
            const formattedDate = formatDate(date);
            if (curDay !== formattedDate) {
              tmpData.push({ type: curDay, data: tmp });
              tmp = [];
              curDay = formattedDate;
            }
            tmp.push(item);
          });
          setHistoryData(tmpData);
        });
    } catch (error) {
      console.log(error);
    }
  }, [connected]);

  useEffect(() => {
    if (embeddedWallet && externalWallet) {
      const fetchBalances = async () => {
        let tmpExt: string[] = [];
        let tmpEmb: string[] = [];
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const ethExternal = await provider.getBalance(externalWallet.address);
        const ethEmbedded = await provider.getBalance(embeddedWallet.address);
        for (let i = 0; i < Tokens.length; i++) {
          if (Tokens[i].currency === "ETH") {
            tmpExt.push(utils.formatEther(ethExternal));
            tmpEmb.push(utils.formatEther(ethEmbedded));
          } else {
            const contract = new ethers.Contract(
              Tokens[i].address,
              ERC20_ABI,
              provider
            );
            const decimals = await contract.decimals();
            const tokenExternal = await contract.balanceOf(
              externalWallet.address
            );
            const tokenEmbedded = await contract.balanceOf(
              embeddedWallet.address
            );
            tmpEmb.push(utils.formatUnits(tokenEmbedded, decimals));
            tmpExt.push(utils.formatUnits(tokenExternal, decimals));
          }
        }
        setEmbBalances(tmpEmb);
        setExtBalances(tmpExt);
      };
      fetchBalances();
    }
  }, [mode, embeddedWallet, externalWallet, setEmbBalances, setExtBalances]);

  return (
    <>
      <div
        className={`${
          visible
            ? "flex text-[12px] py-8 px-4 bg-[#181818] w-full sm:w-[300px] md:w-auto"
            : "hidden py-8 px-4 bg-[#181818] w-full h-full"
        }`}
      >
        <div className="flex flex-col justify-between w-[50px]">
          <div className="flex flex-col gap-6">
            <Image className="pb-8" src={Logo1} alt="Logo1" />
            {modeData.map((item: any, id) => (
              <Icon
                key={id}
                icon={item.icon}
                color="white"
                className={`p-2 ${
                  mode === item.mode ? "bg-[#464B53]" : ""
                } rounded-md`}
                width={40}
                onClick={() => setMode(item.mode)}
              />
            ))}
          </div>
          <Image
            alt=""
            src={!mode ? Account : AccountInactive}
            onClick={() => setMode(0)}
          />
        </div>
        <div
          style={{
            height: "calc(100vh - 96px)",
            width: "100%",
          }}
        >
          <div style={{ height: "calc(100vh - 150px)", overflowY: "auto" }}>
            {mode === 0 && (
              <div className="flex flex-col px-1 gap-3 text-white w-full sm:w-[200px] md:w-[300px] lg:w-[360px]">
                <div className="flex justify-between">
                  <WalletButton className="text-[16px]">Account</WalletButton>
                  <Image
                    alt=""
                    className="flex sm:hidden cursor-pointer"
                    onClick={() => setVisible(!visible)}
                    src={LeftArrow}
                  />
                </div>
                <WalletButton className="text-gray-400">Wallets</WalletButton>
                <WalletButton className="flex justify-between">
                  <div>Slate</div>
                  <div
                    className="flex items-center cursor-pointer"
                    onMouseEnter={() =>
                      setAddrIcon({ wallet: "slate", icon: 0, visible: true })
                    }
                    onMouseLeave={() =>
                      setAddrIcon({ wallet: "slate", icon: 0, visible: false })
                    }
                    onClick={() => copyAddress("slate")}
                  >
                    {addrIcon?.wallet === "slate" && addrIcon?.visible && (
                      <Icon
                        icon={
                          addrIcon.icon ? "ic:outline-check" : "lets-icons:copy"
                        }
                        color="white"
                      />
                    )}
                    {makeAddr(embeddedWallet?.address)}
                  </div>
                </WalletButton>
                <WalletButton className="flex justify-between">
                  <div>External</div>
                  <div
                    className="flex items-center cursor-pointer"
                    onMouseEnter={() =>
                      setAddrIcon({
                        wallet: "external",
                        icon: 0,
                        visible: true,
                      })
                    }
                    onMouseLeave={() =>
                      setAddrIcon({
                        wallet: "external",
                        icon: 0,
                        visible: false,
                      })
                    }
                    onClick={() => copyAddress("external")}
                  >
                    {addrIcon?.wallet === "external" && addrIcon?.visible && (
                      <Icon
                        icon={
                          addrIcon.icon ? "ic:outline-check" : "lets-icons:copy"
                        }
                        color="white"
                      />
                    )}
                    {makeAddr(externalWallet?.address)}
                  </div>
                </WalletButton>
                <WalletButton className="text-gray-400">Actions</WalletButton>
                <ActionButton>Fund Account</ActionButton>
                <ActionButton
                  className="flex cursor-pointer justify-between items-center"
                  onMouseEnter={() =>
                    setAddrIcon({ wallet: "private", icon: 0, visible: true })
                  }
                  onMouseLeave={() =>
                    setAddrIcon({ wallet: "private", icon: 0, visible: false })
                  }
                  onClick={() => {
                    setAddrIcon({ wallet: "private", icon: 1, visible: true });
                    exportWallet();
                  }}
                >
                  Export Private Key
                  {addrIcon?.wallet === "private" && addrIcon?.visible && (
                    <Icon
                      icon={
                        addrIcon.icon ? "ic:outline-check" : "lets-icons:copy"
                      }
                      color="white"
                    />
                  )}
                </ActionButton>
                <ActionButton>Withdraw to External Wallet</ActionButton>
                <ActionButton
                  className="cursor-pointer"
                  onClick={handleDisconnect}
                >
                  Disconnect External Wallet
                </ActionButton>
              </div>
            )}
            {mode === 1 && (
              <div className="flex flex-col gap-4 px-4 text-white w-full sm:w-[200px] md:w-[300px] lg:w-[360px]">
                <div className="flex justify-between">
                  <div className="text-[16px]">Funds</div>
                  <Image
                    alt=""
                    className="flex sm:hidden cursor-pointer"
                    onClick={() => setVisible(!visible)}
                    src={LeftArrow}
                  />
                </div>
                <p className="flex text-gray-500">
                  Slate Wallet (
                  <div
                    className="flex items-center cursor-pointer hover:text-white"
                    onMouseEnter={() =>
                      setAddrIcon({ wallet: "slate", icon: 0, visible: true })
                    }
                    onMouseLeave={() =>
                      setAddrIcon({ wallet: "slate", icon: 0, visible: false })
                    }
                    onClick={() => copyAddress("slate")}
                  >
                    {addrIcon?.wallet === "slate" && addrIcon?.visible && (
                      <Icon
                        icon={`${
                          addrIcon.icon ? "ic:outline-check" : "lets-icons:copy"
                        }`}
                        color="white"
                      />
                    )}

                    {makeAddr(embeddedWallet?.address)}
                  </div>
                  )
                </p>
                <div
                  style={{ position: "relative" }}
                  dangerouslySetInnerHTML={{
                    __html: renderFundsContent(embBalances),
                  }}
                />
                <p className="flex text-gray-500">
                  Connected Wallet (
                  <div
                    className="flex items-center cursor-pointer hover:text-white"
                    onMouseEnter={() =>
                      setAddrIcon({
                        wallet: "external",
                        icon: 0,
                        visible: true,
                      })
                    }
                    onMouseLeave={() =>
                      setAddrIcon({
                        wallet: "external",
                        icon: 0,
                        visible: false,
                      })
                    }
                    onClick={() => copyAddress("external")}
                  >
                    {addrIcon?.wallet === "external" && addrIcon?.visible && (
                      <Icon
                        icon={`${
                          addrIcon.icon ? "ic:outline-check" : "lets-icons:copy"
                        }`}
                        color="white"
                      />
                    )}

                    {makeAddr(externalWallet?.address)}
                  </div>
                  )
                </p>
                <div
                  style={{ position: "relative" }}
                  dangerouslySetInnerHTML={{
                    __html: renderFundsContent(extBalances),
                  }}
                />
              </div>
            )}
            {mode === 2 && (
              <div className="flex relative flex-col gap-4 px-4 text-white w-full sm:w-[200px] md:w-[300px] lg:w-[360px]">
                <div className="flex justify-between">
                  <div className="text-[16px]">History</div>
                  <Image
                    alt=""
                    className="flex sm:hidden cursor-pointer"
                    onClick={() => setVisible(!visible)}
                    src={LeftArrow}
                  />
                </div>
                {historyData.map((prompt: PendingPrompt, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4"
                    style={
                      historyCnt
                        ? {}
                        : {
                            filter: "blur(4px)",
                            userSelect: "none",
                            pointerEvents: "none",
                          }
                    }
                  >
                    <div>{prompt.type}</div>
                    <div className="flex flex-col gap-4">
                      {prompt.data.map((item: any, id) => (
                        <>
                          <div
                            className="flex w-full justify-between cursor-pointer"
                            onClick={() => setCurrentHistoryData({ index, id })}
                          >
                            <div className="max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap">
                              {item.query.message}
                            </div>
                            <div>{formatTime(new Date(item.timestamp))}</div>
                          </div>
                          {historyCnt > 0 &&
                            index === currentHistoryData?.index &&
                            id === currentHistoryData.id && (
                              <div
                                className="px-3 py-2 rounded-md"
                                style={{ background: "#464b5f" }}
                              >
                                <Response
                                  mode={2}
                                  query={item.query}
                                  runningIds={[]}
                                  canceledIds={[]}
                                  statsText={{ value: "", id: "" }}
                                  processText={{ value: "", id: "" }}
                                  iconArray={iconArray}
                                  verifiedData={verifiedEntities}
                                  onSubmit={() => console.log()}
                                />
                                <div className="flex justify-between">
                                  <div className="block"></div>
                                  <div>{formatTime(item.timestamp)}</div>
                                </div>
                              </div>
                            )}
                        </>
                      ))}
                    </div>
                  </div>
                ))}
                {historyCnt === 0 && (
                  <div style={{ position: "absolute", top: "50%" }}>
                    Execute your first prompt to see it here!
                  </div>
                )}
              </div>
            )}
            {mode === 3 && (
              <div className="flex relative flex-col gap-4 px-4 text-white w-full sm:w-[200px] md:w-[300px] lg:w-[360px]">
                <div className="flex justify-between">
                  <div className="text-[16px]">Pending Prompts</div>
                  <Image
                    alt=""
                    className="flex sm:hidden cursor-pointer"
                    onClick={() => setVisible(!visible)}
                    src={LeftArrow}
                  />
                </div>
                {pendingData.map((item: PendingPrompt, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4"
                    style={
                      pendingCnt
                        ? {}
                        : {
                            filter: "blur(4px)",
                            userSelect: "none",
                            pointerEvents: "none",
                          }
                    }
                  >
                    <div className="text-[gray]">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </div>
                    {item.data.map((query: any, id) => (
                      <>
                        <div
                          key={id}
                          className="flex w-full justify-between cursor-pointer"
                          onClick={() => setCurrentPendingData({ index, id })}
                        >
                          <div className="max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap">
                            {pendingCnt > 0
                              ? query.message
                              : query.query.message}
                          </div>
                          <div>@ {showCondition(query, item.type)}</div>
                        </div>
                        {pendingCnt > 0 &&
                          index === currentPendingData?.index &&
                          id === currentPendingData.id && (
                            <div
                              className="px-3 py-2 rounded-md"
                              style={{ background: "#464b5f" }}
                            >
                              <Response
                                mode={2}
                                query={query}
                                runningIds={[]}
                                canceledIds={[]}
                                statsText={{ value: "", id: "" }}
                                processText={{ value: "", id: "" }}
                                iconArray={iconArray}
                                verifiedData={verifiedEntities}
                                onSubmit={() => console.log()}
                              />
                              <div className="flex justify-between">
                                <div
                                  onClick={() => cancelCondition(query)}
                                  className="flex items-center bg-[#dc8484] px-1 rounded-xl cursor-pointer"
                                >
                                  CANCEL
                                  <Icon
                                    icon="material-symbols-light:cancel-outline"
                                    color="white"
                                  />
                                </div>
                                <div>@ {showCondition(query, item.type)}</div>
                              </div>
                            </div>
                          )}
                      </>
                    ))}
                  </div>
                ))}
                {pendingCnt === 0 && (
                  <div style={{ position: "absolute", top: "50%" }}>
                    Execute your first conditional prompt to see it here!
                  </div>
                )}
              </div>
            )}
          </div>
          <Referral className="cursor-pointer">
            <div>
              <p className="font-extrabold">Refer a friend to Slate!</p>
              <p>Click to copy your referral link</p>
            </div>
            <Icon icon="material-symbols:link" width={24} color="white" />
          </Referral>
        </div>
      </div>
      {!visible && (
        <div className="hidden sm:flex flex-col items-center justify-between px-4 py-8 bg-[#181818]">
          <div className="flex flex-col gap-6">
            <Image alt="" className="pb-8 cursor-pointer" src={Logo1} />
            {modeData.map((item: any, id) => (
              <Icon
                key={id}
                icon={item.icon}
                color="white"
                className={`p-2 ${
                  mode === item.mode ? "bg-[#464B53]" : ""
                } rounded-md`}
                width={40}
              />
            ))}
          </div>
          <Image alt="" src={Account} onClick={() => setMode(0)} />
        </div>
      )}
    </>
  );
};

export default OptionTab;
