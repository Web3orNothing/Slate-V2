import Image from "next/image";

import Logo1 from "@/assets/Logo1.svg";
import LeftArrow from "@/assets/LeftArrow.svg";
import Account from "@/assets/Account.svg";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { Tokens, TokenParam } from "@/config/constants/tokens";
import { ethers, utils } from "ethers";
import ERC20_ABI from "@/abis/erc20.abi";
import axios from "axios";
import { WALLET_API_URL } from "@/config/constants/backend";

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
  const { wallets } = useWallets();
  const [mode, setMode] = useState(0);
  const [extBalances, setExtBalances] = useState<string[]>([]);
  const [embBalances, setEmbBalances] = useState<string[]>([]);
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

  const renderContent = (items: any[]): string => {
    let content = "<div>";
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
            max-width: 60%;
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
            max-width: 60%;
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

  useEffect(() => {
    if (!embeddedWallet) return;

    const fetchData = async () => {
      try {
        const conditionResponse = await axios.get(
          `${WALLET_API_URL}/condition?accountAddress=${embeddedWallet.address}`
        );
        const { conditions } = conditionResponse.data;
        if (conditions.length > 0) {
          const pendingContent = pendingTypes
            .map((type: string) =>
              conditions.filter(
                (item: any) => item.conditions[0].body.type === type
              )
            )
            .filter((tmp: any[]) => tmp.length > 0)
            .map((tmp: any[]) =>
              renderPendingContent(tmp, tmp[0].conditions[0].body.type)
            )
            .join("");
          setPendingContent(
            `<div style='display:flex; flex-direction:column;gap:10px;'>${pendingContent}</div>`
          );
        }

        const historyResponse = await axios.get(
          `${WALLET_API_URL}/history?accountAddress=${embeddedWallet.address}`
        );
        const { histories } = historyResponse.data;
        if (histories.length > 0) {
          const historyContent = renderContent(histories);
          setHistoryContent(historyContent);
        }
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
            ? "flex py-8 px-4 bg-[#181818] w-full md:w-auto h-full min-h-[880px]"
            : "hidden py-8 px-4 bg-[#181818] w-full h-full min-h-[880px]"
        }`}
      >
        <div className="flex flex-col justify-between w-[50px]">
          <div className="flex flex-col gap-6">
            <Image
              className="pb-8"
              src={Logo1}
              alt="Logo1"
              onClick={() => setMode(0)}
            />
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
          <Image alt="" src={Account} />
        </div>
        {mode === 0 && (
          <div className="flex flex-col gap-7 px-8 text-white w-full sm:w-full md:w-[300px] lg:w-[360px]">
            <div className="flex justify-between">
              <div>Account</div>
              <Image
                alt=""
                className="flex cursor-pointer"
                onClick={() => setVisible(!visible)}
                src={LeftArrow}
              />
            </div>
            <p className="text-gray-400">Wallets</p>
            <div className="flex justify-between">
              <div>Slate</div>
              <div>{makeAddr(embeddedWallet?.address)}</div>
            </div>
            <div className="flex justify-between">
              <div>External</div>
              <div>{makeAddr(externalWallet?.address)}</div>
            </div>
            <p className="text-gray-400">Actions</p>
            <p>Fund Account</p>
            <p>Export Private Key</p>
            <p>Withdraw to External Wallet</p>
            <p className="cursor-pointer" onClick={handleDisconnect}>
              Disconnect External Wallet
            </p>
          </div>
        )}
        {mode === 1 && (
          <div className="flex flex-col gap-4 px-8 text-white w-full sm:w-full md:w-[300px] lg:w-[360px]">
            <div className="flex justify-between">
              <div>Funds</div>
              <Image
                alt=""
                className="flex cursor-pointer"
                onClick={() => setVisible(!visible)}
                src={LeftArrow}
              />
            </div>
            <p className="text-gray-500">
              Slate Wallet ({makeAddr(embeddedWallet?.address)})
            </p>
            {Tokens.map((item: TokenParam, id) => (
              <div key={id} className="flex justify-between py-1">
                <div className="flex gap-3">
                  <Image alt="" className="flex" src={item.icon} />
                  <p>{item.name}</p>
                </div>
                <div>
                  {parseFloat(parseFloat(embBalances[id]).toFixed(4))} $
                  {item.currency}
                </div>
              </div>
            ))}
            <p className="text-gray-500">
              Connected Wallet ({makeAddr(externalWallet?.address)})
            </p>
            {Tokens.map((item: TokenParam, id) => (
              <div key={id} className="flex justify-between py-1">
                <div className="flex gap-3">
                  <Image alt="" className="flex" src={item.icon} />
                  <p>{item.name}</p>
                </div>
                <div>
                  {parseFloat(parseFloat(extBalances[id]).toFixed(4))} $
                  {item.currency}
                </div>
              </div>
            ))}
          </div>
        )}
        {mode === 2 && (
          <div className="flex flex-col gap-4 px-8 text-white w-full sm:w-full md:w-[300px] lg:w-[360px]">
            <div className="flex justify-between">
              <div>History</div>
              <Image
                alt=""
                className="flex cursor-pointer"
                onClick={() => setVisible(!visible)}
                src={LeftArrow}
              />
            </div>
            <div dangerouslySetInnerHTML={{ __html: historyContent }} />
          </div>
        )}
        {mode === 3 && (
          <div className="flex flex-col gap-4 px-8 text-white w-full sm:w-full md:w-[300px] lg:w-[360px]">
            <div className="flex justify-between">
              <div>Pending Prompts</div>
              <Image
                alt=""
                className="flex cursor-pointer"
                onClick={() => setVisible(!visible)}
                src={LeftArrow}
              />
            </div>
            <div dangerouslySetInnerHTML={{ __html: pendingContent }} />
          </div>
        )}
      </div>
      {!visible && (
        <div className="hidden sm:flex flex-col items-center justify-between px-4 py-8 bg-[#181818]">
          <div className="flex flex-col gap-6">
            <Image
              alt=""
              className="pb-8 cursor-pointer"
              src={Logo1}
              onClick={() => setVisible(!visible)}
            />
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
          <Image alt="" src={Account} />
        </div>
      )}
    </>
  );
};

export default OptionTab;
