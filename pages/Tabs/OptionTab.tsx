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
import { Query } from "@/components/Response";

export type TabProps = {
  visible: boolean;
  handleDisconnect: () => void;
  setVisible: (val: boolean) => void;
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

const OptionTab = ({ visible, handleDisconnect, setVisible }: TabProps) => {
  const { exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const [mode, setMode] = useState(1);
  const [extBalances, setExtBalances] = useState<string[]>([]);
  const [embBalances, setEmbBalances] = useState<string[]>([]);
  const [historyCnt, setHistoryCnt] = useState(0);
  const [pendingCnt, setPendingCnt] = useState(0);
  const [historyContent, setHistoryContent] = useState<string>("");
  const [pendingContent, setPendingContent] = useState<string>("");

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

  const copyAddress = async (wallet: number) => {
    if (!embeddedWallet || !externalWallet) return;
    await navigator.clipboard.writeText(
      (wallet === 0 ? embeddedWallet : externalWallet).address
    );
  };

  const renderContent = (items: any[]): string => {
    let content =
      "<div style='display: flex; flex-direction: column; gap: 10px;'>";
    let currentDay: string | undefined;

    items.forEach((item: any) => {
      const date = new Date(item.timestamp);
      const formattedDate = formatDate(date);

      if (currentDay !== formattedDate) {
        currentDay = formattedDate;
        content += `
          <div style="color: gray">${formattedDate}</div>
        `;
      }

      const itemContent = `
        <div style="display:flex;width:100%;justify-content:space-between;">
          <div style="
            max-width: 50%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">
            ${item.query.message}
          </div>
          <div>${formatTime(date)}</div>
        </div>
      `;

      content += itemContent;
    });
    content += "</div>";
    return content;
  };

  const renderPendingContent = (items: any[], type: string): string => {
    const capitalizeType = type.charAt(0).toUpperCase() + type.slice(1);

    let content = `
      <div style="color: gray;">${capitalizeType}</div>
    `;

    items.forEach((item: any) => {
      let showData = "";
      const conditions = item.conditions[0].args;

      switch (type) {
        case "gas":
          showData = `${conditions.value} GWEI`;
          break;
        case "price":
          showData = `\$${
            conditions.value
          } ${conditions.subject.toUpperCase()}`;
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

      content += `
        <div style="display:flex;width:100%;justify-content:space-between;">
          <div style="
            max-width: 50%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">
            ${item.query.message}
          </div>
          <div>@ ${showData}</div>
        </div>
      `;
    });

    return content;
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
    if (!embeddedWallet) return;

    const fetchData = async () => {
      try {
        const conditionResponse = await axios.get(
          `${WALLET_API_URL}/condition?accountAddress=${embeddedWallet.address}`
        );
        const { conditions } = conditionResponse.data;
        setPendingCnt(conditions.length);

        const displayData = pendingTypes
          .map((type) =>
            (conditions.length > 0 ? conditions : pendingPrompts).filter(
              (item: Query) => item.conditions[0].body.type === type
            )
          )
          .filter((tmp) => tmp.length > 0);

        const tmpContent = displayData
          .map((tmp) =>
            renderPendingContent(tmp, tmp[0].conditions[0].body.type)
          )
          .join("");

        setPendingContent(
          `<div style='display: flex; flex-direction: column; gap: 10px;'>${tmpContent}</div>`
        );

        const historyResponse = await axios.get(
          `${WALLET_API_URL}/history?accountAddress=${embeddedWallet.address}`
        );
        const { histories } = historyResponse.data;
        setHistoryCnt(histories.length);

        const historyContent = renderContent(
          histories.length > 0 ? histories : historyPrompts
        );
        setHistoryContent(historyContent);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [mode, embeddedWallet]);

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
            overflowY: "auto",
            width: "100%",
          }}
        >
          {mode === 0 && (
            <div className="flex flex-col px-4 gap-7 text-white w-full sm:w-[200px] md:w-[300px] lg:w-[360px]">
              <div className="flex justify-between">
                <div className="text-[16px]">Account</div>
                <Image
                  alt=""
                  className="flex sm:hidden cursor-pointer"
                  onClick={() => setVisible(!visible)}
                  src={LeftArrow}
                />
              </div>
              <p className="text-gray-400">Wallets</p>
              <div
                className="flex justify-between cursor-pointer"
                onClick={() => copyAddress(0)}
              >
                <div>Slate</div>
                <div>{makeAddr(embeddedWallet?.address)}</div>
              </div>
              <div
                className="flex justify-between cursor-pointer"
                onClick={() => copyAddress(1)}
              >
                <div>External</div>
                <div>{makeAddr(externalWallet?.address)}</div>
              </div>
              <p className="text-gray-400">Actions</p>
              <p>Fund Account</p>
              <div className="cursor-pointer" onClick={exportWallet}>
                Export Private Key
              </div>
              <p>Withdraw to External Wallet</p>
              <p className="cursor-pointer" onClick={handleDisconnect}>
                Disconnect External Wallet
              </p>
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
              <p
                className="text-gray-500 cursor-pointer"
                // onMouseEnter={() => copyAddress(0)}
                onClick={() => copyAddress(0)}
              >
                Slate Wallet ({makeAddr(embeddedWallet?.address)})
              </p>
              <div
                style={{ position: "relative" }}
                dangerouslySetInnerHTML={{
                  __html: renderFundsContent(embBalances),
                }}
              />
              <p
                className="text-gray-500 cursor-pointer"
                // onMouseEnter={() => copyAddress(1)}
                onClick={() => copyAddress(1)}
              >
                Connected Wallet ({makeAddr(externalWallet?.address)})
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
              <div
                style={
                  historyCnt ? {} : { filter: "blur(4px)", userSelect: "none" }
                }
                dangerouslySetInnerHTML={{ __html: historyContent }}
              />
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
              <div
                style={
                  pendingCnt ? {} : { filter: "blur(4px)", userSelect: "none" }
                }
                dangerouslySetInnerHTML={{ __html: pendingContent }}
              />
              {pendingCnt === 0 && (
                <div style={{ position: "absolute", top: "50%" }}>
                  Execute your first conditional prompt to see it here!
                </div>
              )}
            </div>
          )}
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
