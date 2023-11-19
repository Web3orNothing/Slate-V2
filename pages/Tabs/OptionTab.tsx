import Image from "next/image";
import dynamic from "next/dynamic";

import Logo1 from "@/assets/Logo1.svg";
import LeftArrow from "@/assets/LeftArrow.svg";
import Account from "@/assets/Account.svg";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { Tokens, TokenParam } from "@/config/constants/tokens";
import { ethers, providers, utils } from "ethers";
import ERC20_ABI from "@/abis/erc20.abi";
import { Query } from "@/components/Response";
import axios from "axios";
import { WALLET_API_URL } from "@/config/constants/backend";

export type TabProps = {
  visible: boolean;
  connected: boolean;
  handleDisconnect: () => void;
  setVisible: (val: boolean) => void;
  setConnected: (val: boolean) => void;
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

const OptionTab = (props: TabProps) => {
  const { wallets } = useWallets();
  const [mode, setMode] = useState(0);
  const [extBalances, setExtBalances] = useState<string[]>([]);
  const [embBalances, setEmbBalances] = useState<string[]>([]);
  const [pendingQueries, setPendingQueries] = useState<Query[]>([]);
  const [historyQueries, setHistoryQueries] = useState<Query[]>([]);

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

  useEffect(() => {
    if (!embeddedWallet) return;

    let queryStr = `${WALLET_API_URL}/condition?accountAddress=${embeddedWallet.address}`;
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

    queryStr = `${WALLET_API_URL}/history?accountAddress=${embeddedWallet.address}`;
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
  }, [embeddedWallet]);

  useEffect(() => {
    if (embeddedWallet && externalWallet) {
      let tmpExt: string[] = [];
      let tmpEmb: string[] = [];
      const func = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const ethExternal = await provider.getBalance(externalWallet.address);
        const ethEmbedded = await provider.getBalance(embeddedWallet.address);
        for (let i = 0; i < Tokens.length; i++) {
          if (Tokens[i].currency == "ETH") {
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
      func();
    }
  }, [mode, setEmbBalances, setExtBalances]);

  return (
    <>
      <div
        className={`${
          props.visible == true
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
                  mode == item.mode ? "bg-[#464B53]" : ""
                } rounded-md`}
                width={40}
                onClick={() => setMode(item.mode)}
              />
            ))}
          </div>
          <Image alt="" src={Account} />
        </div>
        {mode == 0 && (
          <div className="flex flex-col gap-7 px-8 text-white w-full sm:w-full md:w-[300px] lg:w-[360px]">
            <div className="flex justify-between">
              <div>Account</div>
              <Image
                alt=""
                className="flex cursor-pointer"
                onClick={() => props.setVisible(!props.visible)}
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
            <p className="cursor-pointer" onClick={props.handleDisconnect}>
              Disconnect External Wallet
            </p>
          </div>
        )}
        {mode == 1 && (
          <div className="flex flex-col gap-4 px-8 text-white w-full sm:w-full md:w-[300px] lg:w-[360px]">
            <div className="flex justify-between">
              <div>Funds</div>
              <Image
                alt=""
                className="flex cursor-pointer"
                onClick={() => props.setVisible(!props.visible)}
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
        {mode == 2 && (
          <div className="flex flex-col gap-4 px-8 text-white w-full sm:w-full md:w-[300px] lg:w-[360px]">
            <div className="flex justify-between">
              <div>History</div>
              <Image
                alt=""
                className="flex cursor-pointer"
                onClick={() => props.setVisible(!props.visible)}
                src={LeftArrow}
              />
            </div>
          </div>
        )}
      </div>
      {props.visible == false && (
        <div className="hidden sm:flex flex-col items-center justify-between px-4 py-8 bg-[#181818]">
          <div className="flex flex-col gap-6">
            <Image
              alt=""
              className="pb-8 cursor-pointer"
              src={Logo1}
              onClick={() => props.setVisible(!props.visible)}
            />
            {modeData.map((item: any, id) => (
              <Icon
                key={id}
                icon={item.icon}
                color="white"
                className={`p-2 ${
                  mode == item.mode ? "bg-[#464B53]" : ""
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
