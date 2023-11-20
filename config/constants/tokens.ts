import BTC from "@/assets/coin/btc.svg";
import ETH from "@/assets/coin/eth.svg";
import DAI from "@/assets/coin/dai.svg";
import SHIB from "@/assets/coin/shib.svg";
import USDC from "@/assets/coin/usdc.svg";
import USDT from "@/assets/coin/usdt.svg";

export type TokenParam = {
  id: number;
  name: string;
  icon: any;
  address: string;
  currency: string;
};

export const Tokens: TokenParam[] = [
  {
    id: 0,
    name: "Bitcoin",
    icon: BTC,
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    currency: "BTC",
  },
  {
    id: 1,
    name: "Ether",
    icon: ETH,
    address: "-",
    currency: "ETH",
  },
  {
    id: 2,
    name: "DAI",
    icon: DAI,
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    currency: "DAI",
  },
  {
    id: 3,
    name: "Shiba Inu Coin",
    icon: SHIB,
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    currency: "SHIB",
  },
  {
    id: 4,
    name: "USDC",
    icon: USDC,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    currency: "USDC",
  },
  {
    id: 5,
    name: "USDT",
    icon: USDT,
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    currency: "USDT",
  },
];
