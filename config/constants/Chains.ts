import { Chain } from "wagmi";

export const mainnet = {
  id: 1,
  network: "ethereum",
  name: "Ethereum",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mevblocker.io"],
    },
    public: {
      http: ["https://rpc.mevblocker.io"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
    default: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
  },
  contracts: {
    ensRegistry: {
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    },
    ensUniversalResolver: {
      address: "0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62",
      blockCreated: 16966585,
    },
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 14353601,
    },
  },
} as const satisfies Chain;

export const optimism = {
  id: 10,
  name: "OP Mainnet",
  network: "optimism",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://optimism.llamarpc.com"],
    },
    public: {
      http: ["https://optimism.llamarpc.com"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Etherscan",
      url: "https://optimistic.etherscan.io",
    },
    default: {
      name: "Optimism Explorer",
      url: "https://explorer.optimism.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 4286263,
    },
  },
} as const satisfies Chain;

export const cronos = {
  id: 25,
  name: "Cronos Mainnet",
  network: "cronos",
  nativeCurrency: {
    decimals: 18,
    name: "Cronos",
    symbol: "CRO",
  },
  rpcUrls: {
    default: {
      http: ["https://cronos-evm.publicnode.com"],
    },
    public: {
      http: ["https://cronos-evm.publicnode.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Cronoscan",
      url: "https://cronoscan.com",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1963112,
    },
  },
} as const satisfies Chain;

export const bsc = {
  id: 56,
  name: "BNB Smart Chain",
  network: "bsc",
  nativeCurrency: {
    decimals: 18,
    name: "BNB",
    symbol: "BNB",
  },
  rpcUrls: {
    default: {
      http: ["https://binance.llamarpc.com"],
    },
    public: {
      http: ["https://binance.llamarpc.com"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "BscScan",
      url: "https://bscscan.com",
    },
    default: {
      name: "BscScan",
      url: "https://bscscan.com",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 15921452,
    },
  },
} as const satisfies Chain;

export const classic = {
  id: 61,
  name: "Ethereum Classic",
  network: "classic",
  nativeCurrency: {
    decimals: 18,
    name: "ETC",
    symbol: "ETC",
  },
  rpcUrls: {
    default: {
      http: ["https://etc.rivet.link"],
    },
    public: {
      http: ["https://etc.rivet.link"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.com/etc/mainnet",
    },
  },
} as const satisfies Chain;

export const gnosis = {
  id: 100,
  name: "Gnosis",
  network: "gnosis",
  nativeCurrency: {
    decimals: 18,
    name: "Gnosis",
    symbol: "xDAI",
  },
  rpcUrls: {
    default: {
      http: ["https://gnosis.publicnode.com"],
    },
    public: {
      http: ["https://gnosis.publicnode.com"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Gnosisscan",
      url: "https://gnosisscan.io",
    },
    default: {
      name: "Gnosis Chain Explorer",
      url: "https://blockscout.com/xdai/mainnet",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 21022491,
    },
  },
} as const satisfies Chain;

export const polygon = {
  id: 137,
  name: "Polygon",
  network: "matic",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://polygon.llamarpc.com"],
    },
    public: {
      http: ["https://polygon.llamarpc.com"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "PolygonScan",
      url: "https://polygonscan.com",
    },
    default: {
      name: "PolygonScan",
      url: "https://polygonscan.com",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 25770160,
    },
  },
} as const satisfies Chain;

export const fantom = {
  id: 250,
  name: "Fantom",
  network: "fantom",
  nativeCurrency: {
    decimals: 18,
    name: "Fantom",
    symbol: "FTM",
  },
  rpcUrls: {
    default: {
      http: ["https://fantom.publicnode.com"],
    },
    public: {
      http: ["https://fantom.publicnode.com"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "FTMScan",
      url: "https://ftmscan.com",
    },
    default: {
      name: "FTMScan",
      url: "https://ftmscan.com",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 33001987,
    },
  },
} as const satisfies Chain;

export const filecoin = {
  id: 314,
  name: "Filecoin Mainnet",
  network: "filecoin-mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "filecoin",
    symbol: "FIL",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/filecoin"],
    },
    public: {
      http: ["https://rpc.ankr.com/filecoin"],
    },
  },
  blockExplorers: {
    default: {
      name: "Filfox",
      url: "https://filfox.info/en",
    },
    etherscan: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
  },
} as const satisfies Chain;

export const moonbeam = {
  id: 1284,
  name: "Moonbeam",
  network: "moonbeam",
  nativeCurrency: {
    decimals: 18,
    name: "GLMR",
    symbol: "GLMR",
  },
  rpcUrls: {
    public: {
      http: ["https://rpc.api.moonbeam.network"],
      webSocket: ["wss://moonbeam.public.blastapi.io"],
    },
    default: {
      http: ["https://rpc.api.moonbeam.network"],
      webSocket: ["wss://moonbeam.public.blastapi.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Moonscan",
      url: "https://moonscan.io",
    },
    etherscan: {
      name: "Moonscan",
      url: "https://moonscan.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 609002,
    },
  },
  testnet: false,
} as const satisfies Chain;

export const moonriver = {
  id: 1285,
  name: "Moonriver",
  network: "moonriver",
  nativeCurrency: {
    decimals: 18,
    name: "MOVR",
    symbol: "MOVR",
  },
  rpcUrls: {
    public: {
      http: ["https://moonriver.publicnode.com"],
      webSocket: ["wss://moonriver.public.blastapi.io"],
    },
    default: {
      http: ["https://moonriver.publicnode.com"],
      webSocket: ["wss://moonriver.public.blastapi.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Moonscan",
      url: "https://moonriver.moonscan.io",
    },
    etherscan: {
      name: "Moonscan",
      url: "https://moonriver.moonscan.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1597904,
    },
  },
  testnet: false,
} as const satisfies Chain;

export const mantle = {
  id: 5000,
  name: "Mantle",
  network: "mantle",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.mantle.xyz"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Mantle Explorer",
      url: "https://explorer.mantle.xyz",
    },
    default: {
      name: "Mantle Explorer",
      url: "https://explorer.mantle.xyz",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 304717,
    },
  },
} as const satisfies Chain;

export const canto = {
  id: 7700,
  name: "Canto",
  network: "canto",
  nativeCurrency: {
    decimals: 18,
    name: "Canto",
    symbol: "CANTO",
  },
  rpcUrls: {
    default: {
      http: ["https://canto.slingshot.finance"],
    },
    public: {
      http: ["https://canto.slingshot.finance"],
    },
  },
  blockExplorers: {
    default: {
      name: "Tuber.Build (Blockscout)",
      url: "https://tuber.build",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 2905789,
    },
  },
} as const satisfies Chain;

export const base = {
  id: 8453,
  network: "base",
  name: "Base",
  nativeCurrency: {
    name: "Base",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://base.llamarpc.com"],
    },
    public: {
      http: ["https://base.llamarpc.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Basescan",
      url: "https://basescan.org",
    },
    etherscan: {
      name: "Basescan",
      url: "https://basescan.org",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 5022,
    },
  },
} as const satisfies Chain;

export const arbitrum = {
  id: 42161,
  name: "Arbitrum One",
  network: "arbitrum",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://arbitrum.llamarpc.com"],
    },
    public: {
      http: ["https://arbitrum.llamarpc.com"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Arbiscan",
      url: "https://arbiscan.io",
    },
    default: {
      name: "Arbiscan",
      url: "https://arbiscan.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 7654707,
    },
  },
} as const satisfies Chain;

export const celo = {
  id: 42220,
  name: "Celo",
  network: "celo",
  nativeCurrency: {
    decimals: 18,
    name: "CELO",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["https://1rpc.io/celo"],
    },
    public: {
      http: ["https://1rpc.io/celo"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Explorer",
      url: "https://explorer.celo.org/mainnet",
    },
    etherscan: {
      name: "CeloScan",
      url: "https://celoscan.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 13112599,
    },
  },
  testnet: false,
} as const satisfies Chain;

export const avalanche = {
  id: 43114,
  name: "Avalanche",
  network: "avalanche",
  nativeCurrency: {
    decimals: 18,
    name: "Avalanche",
    symbol: "AVAX",
  },
  rpcUrls: {
    default: {
      http: ["https://avalanche-c-chain.publicnode.com"],
    },
    public: {
      http: ["https://avalanche-c-chain.publicnode.com"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "SnowTrace",
      url: "https://snowtrace.io",
    },
    default: {
      name: "SnowTrace",
      url: "https://snowtrace.io",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 11907934,
    },
  },
} as const satisfies Chain;

export const linea = {
  id: 59144,
  name: "Linea Mainnet",
  network: "linea-mainnet",
  nativeCurrency: {
    name: "Linea Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.linea.build"],
      webSocket: ["wss://rpc.linea.build"],
    },
    public: {
      http: ["https://rpc.linea.build"],
      webSocket: ["wss://rpc.linea.build"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://lineascan.build",
    },
    etherscan: {
      name: "Etherscan",
      url: "https://lineascan.build",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 42,
    },
  },
  testnet: false,
} as const satisfies Chain;

export const chains = [
  mainnet,
  optimism,
  cronos,
  bsc,
  classic,
  gnosis,
  polygon,
  fantom,
  filecoin,
  moonbeam,
  moonriver,
  mantle,
  canto,
  base,
  arbitrum,
  celo,
  avalanche,
  linea,
];
