import Image from "next/image";

import Logo1 from "@/assets/Logo1.svg";
import LeftArrow from "@/assets/LeftArrow.svg";
import AccountInactive from "@/assets/Account-inactive.svg";
import Account from "@/assets/Account-inactive.svg";
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
  margin: "0px 12px",
  borderRadius: "10px",
});

const OptionTab = ({ visible, handleDisconnect, setVisible }: TabProps) => {
  const { exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const [mode, setMode] = useState(1);
  const [extBalances, setExtBalances] = useState<string[]>([]);
  const [embBalances, setEmbBalances] = useState<string[]>([]);
  const [externalData, setExternalData] = useState<TokenParam[]>([]);
  const [embeddedData, setEmbeddedData] = useState<TokenParam[]>([]);
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
  const [iconFlag, setIconFlag] = useState(false);

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

  useEffect(() => {
    const fetchEntities = async () => {
      const res = await axios.get(`${WALLET_API_URL}/verified-entities`);
      setVerifiedEntities(res.data);
    };
    fetchEntities();
  }, []);

  useEffect(() => {
    if (!iconFlag) return;
    const tmpArray: MyIcon[] = iconArray;

    historyQueries.forEach((x) => {
      x.actions.forEach((act) => {
        Object.entries(act.args).forEach(async ([key, value]) => {
          if (
            !tmpArray.find((x) => x.coin === value) &&
            (key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("chain"))
          ) {
            const url = await getIconFromToken(value);
            tmpArray.push({ coin: value, image: url });
          }
        });
      });
    });

    pendingQueries.forEach((x) => {
      x.actions.forEach((act) => {
        Object.entries(act.args).forEach(async ([key, value]) => {
          if (
            !tmpArray.find((x) => x.coin === value) &&
            (key.toLowerCase().includes("token") ||
              key.toLowerCase().includes("chain"))
          ) {
            const url = await getIconFromToken(value);
            tmpArray.push({ coin: value, image: url });
          }
        });
      });

      setIconArray(tmpArray);
    });

    setIconFlag(false);
  }, [historyQueries, pendingQueries, iconArray]);

  const getData = async (type: number) => {
    if (!embeddedWallet) return;
    if (type === 0) {
      //Pending Data
      const queryStr = `${WALLET_API_URL}/condition?accountAddress=${embeddedWallet.address}`;
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

        const displayData = pendingTypes.map((type) =>
          pendingQueries.filter(
            (item: any) => item.conditions[0].body.type === type
          )
        );

        const pendingData = displayData
          .filter((tmp) => tmp.length > 0)
          .map((item) => ({
            type: item[0].conditions[0].body.type,
            data: item,
          }));

        setPendingData(pendingData);
        setIconFlag(true);
      });
    }
    if (type === 1) {
      const queryStr = `${WALLET_API_URL}/history?accountAddress=${embeddedWallet.address}`;
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

        const displayData = histories.length > 0 ? histories : historyPrompts;
        let curDay = "";
        const tmpData: any[] = [];
        let tmp: any[] = [];
        curDay = formatDate(new Date(displayData[0].timestamp));

        displayData.forEach((item: any) => {
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
        setIconFlag(true);
      });
    }
  };

  useEffect(() => {
    if (!embeddedWallet) return;
    if (mode === 3) {
      getData(1); //get pending data
    } else if (mode === 2) {
      getData(0); //get history data
    }
  }, [embeddedWallet, mode]);

  useEffect(() => {
    getData(0);
    getData(1);
  }, [embeddedWallet]);

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
  }, [mode, embeddedWallet, externalWallet]);

  useEffect(() => {
    if (!(embBalances.length > 0 && extBalances.length > 0)) return;
    let filtered = Tokens.filter((item, id) => parseFloat(embBalances[id]) > 0);
    setEmbeddedData(filtered.length > 0 ? filtered : Tokens);
    filtered = Tokens.filter((item, id) => parseFloat(extBalances[id]) > 0);
    setExternalData(filtered.length > 0 ? filtered : Tokens);
  }, [embBalances, extBalances]);
  return (
    <>
      <div
        className={`${
          visible
            ? "flex text-[12px] py-8 px-4 bg-[#181818] w-full sm:w-full md:w-auto"
            : "hidden md:flex md:w-auto py-8 px-4 bg-[#181818] w-full h-full"
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
          className="flex flex-col justify-between"
          style={{
            height: "calc(100vh - 96px)",
            width: "100%",
          }}
        >
          <div className="overflow-y-auto pl-4 pb-4">
            {mode === 0 && (
              <div className="flex flex-col px-1 gap-3 text-white w-full md:w-[280px] lg:w-[360px]">
                <div className="flex justify-between">
                  <WalletButton className="text-[16px]">Account</WalletButton>
                  <Image
                    alt=""
                    className="flex md:hidden cursor-pointer"
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
              <div className="flex flex-col gap-4 px-4 text-white w-full md:w-[280px] lg:w-[360px]">
                <div className="flex justify-between">
                  <div className="text-[16px]">Funds</div>
                  <Image
                    alt=""
                    className="flex md:hidden cursor-pointer"
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
                <div>
                  {embeddedData.map((item, id) => (
                    <div
                      key={id}
                      className={
                        embeddedData.length === 0 && id === 2
                          ? "h-[24px]"
                          : "flex justify-between items-center"
                      }
                    >
                      {embeddedData.length > 0 && (
                        <>
                          <div className="flex gap-3 items-center">
                            <img src={item.icon.src} alt={item.name} />
                            <p>{item.name}</p>
                          </div>
                          <div>
                            {parseFloat(
                              embBalances[item.id] || "5.01240"
                            ).toFixed(4)}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
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
                <div>
                  {externalData.map((item, id) => (
                    <div
                      key={id}
                      className={
                        externalData.length === 0 && id === 2
                          ? "h-[24px]"
                          : "flex justify-between items-center"
                      }
                    >
                      {externalData.length > 0 && (
                        <>
                          <div className="flex gap-3 items-center">
                            <img src={item.icon.src} alt={item.name} />
                            <p>{item.name}</p>
                          </div>
                          <div>
                            {parseFloat(
                              extBalances[item.id] || "5.01240"
                            ).toFixed(4)}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mode === 2 && (
              <div className="flex relative flex-col gap-4 px-4 text-white w-full md:w-[280px] lg:w-[360px]">
                <div className="flex justify-between">
                  <div className="text-[16px]">History</div>
                  <Image
                    alt=""
                    className="flex md:hidden cursor-pointer"
                    onClick={() => setVisible(!visible)}
                    src={LeftArrow}
                  />
                </div>
                {historyData.map((prompt: PendingPrompt, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4"
                    style={
                      historyQueries.length > 0
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
                          {historyQueries.length > 0 &&
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
                {historyQueries.length === 0 && (
                  <div style={{ position: "absolute", top: "50%" }}>
                    Execute your first prompt to see it here!
                  </div>
                )}
              </div>
            )}
            {mode === 3 && (
              <div className="flex relative flex-col gap-4 px-4 text-white w-full md:w-[280px] lg:w-[360px]">
                <div className="flex justify-between">
                  <div className="text-[16px]">Pending Prompts</div>
                  <Image
                    alt=""
                    className="flex md:hidden cursor-pointer"
                    onClick={() => setVisible(!visible)}
                    src={LeftArrow}
                  />
                </div>
                {pendingData.map((item: PendingPrompt, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4"
                    style={
                      pendingQueries.length > 0
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
                          className="flex w-full justify-between cursor-pointer text-[14px]"
                          onClick={() =>
                            setCurrentPendingData(
                              index === currentPendingData?.index &&
                                id === currentPendingData.id
                                ? { index: -1, id: -1 }
                                : { index, id }
                            )
                          }
                        >
                          <div className="max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap">
                            {pendingQueries.length > 0
                              ? query.message
                              : query.query.message}
                          </div>
                          <div>@ {showCondition(query, item.type)}</div>
                        </div>
                        {pendingQueries.length > 0 &&
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
                {pendingQueries.length === 0 && (
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
            <Icon icon="material-symbols:link" width={24} color="#AEB1DD" />
          </Referral>
        </div>
      </div>
      {!visible && (
        <div className="hidden sm:flex md:hidden flex-col items-center justify-between px-4 py-8 bg-[#181818]">
          <div className="flex flex-col gap-6">
            <Image alt="" className="pb-8 cursor-pointer" src={Logo1} />
            {modeData.map((item: any, id) => (
              <Icon
                key={id}
                icon={item.icon}
                color="white"
                className={`p-2  rounded-md`}
                width={40}
                onClick={() => {
                  setVisible(true);
                  setMode(id + 1);
                }}
              />
            ))}
          </div>
          <Image
            alt=""
            src={Account}
            onClick={() => {
              setVisible(true);
              setMode(0);
            }}
          />
        </div>
      )}
    </>
  );
};

export default OptionTab;
