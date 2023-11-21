import { Query } from "@/components/Response";
import { TokenParam } from "./tokens";
export const mockedUpQuery: Query[] = [
  {
    actions: [
      {
        name: "bridge",
        args: {
          amount: "100",
          destinationChainName: "ethereum",
          sourceChainName: "arbitrum",
          token: "usdc",
        },
        body: {},
      },
      {
        name: "swap",
        args: {
          inputAmount: "10",
          inputToken: "eth",
          outputToken: "usdc",
        },
        body: {},
      },
    ],
    calls: [
      {
        name: "bridge",
        args: {
          amount: "100",
          destinationChainName: "ethereum",
          sourceChainName: "arbitrum",
          token: "usdc",
        },
        body: {},
      },
      {
        name: "swap",
        args: {
          inputAmount: "10",
          inputToken: "eth",
          outputToken: "usdc",
        },
        body: {},
      },
    ],
    conditions: [],
    description:
      "I have bridged 100 USDC tokens from the Arbitrum chain to the Ethereum chain and swapped 10 ETH tokens to USDC tokens.",
    id: "m0",
    message:
      "bridge 100 usdc from arbitrum to ethereum and swap 10 eth to usdc",
    messageId: 1017,
    simstatus: 0,
    placeholders: [],
  },
  {
    actions: [],
    calls: [
      {
        name: "swap",
        args: {
          inputAmount: "1",
          inputToken: "eth",
          outputToken: "usdc",
        },
        body: {},
      },
      {
        name: "condition",
        args: {
          comparator: "==",
          subject: "paraspace",
          type: "price",
          value: "2100",
        },
        body: {},
      },
    ],
    conditions: [],
    description:
      "I will swap 1 ETH token to USDC token. The condition for the swap is that the Paraspace protocol is 2100.",
    id: "m1",
    message: "swap 1 eth to usdc when marketcap is 2100",
    messageId: 1018,
    placeholders: [],
    simstatus: 0,
  },
];

const timePending = {
  conditions: [
    {
      args: {
        start_time: "11/20/2029",
      },
      body: {
        accountAddress: "0xB2932CEB7bd1e9A52e726830A6f515C872c2fD77",
        chainName: "ethereum",
        destinationChainName: "ethereum",
        sourceChainName: "ethereum",
        start_time: "11/20/2029",
        type: "time",
      },
      name: "time",
    },
  ],
  query: {
    message: "swap 1 eth to usdc when 11/20/2029",
  },
  timestamp: 1700537455535,
};

const gasPending = {
  conditions: [
    {
      args: {
        comparator: ">=",
        subject: "gas",
        type: "gas",
        value: "100",
      },
      body: {
        accountAddress: "0xB2932CEB7bd1e9A52e726830A6f515C872c2fD77",
        chainName: "ethereum",
        comparator: ">=",
        destinationChainName: "ethereum",
        sourceChainName: "ethereum",
        subject: "gas",
        type: "gas",
        value: "100",
      },
      name: "condition",
    },
  ],
  query: {
    message: "swap 1 eth to usdc when gas is 100 GWEI",
  },
  timestamp: 1700537455535,
};

const pricePending = {
  conditions: [
    {
      args: {
        comparator: ">=",
        subject: "eth",
        type: "price",
        value: "2500",
      },
      body: {
        accountAddress: "0xB2932CEB7bd1e9A52e726830A6f515C872c2fD77",
        chainName: "ethereum",
        comparator: ">=",
        destinationChainName: "ethereum",
        sourceChainName: "ethereum",
        subject: "eth",
        type: "price",
        value: "2500",
      },
      name: "condition",
    },
  ],
  query: {
    message: "swap 1 eth to usdc when marketcap is 2500",
  },
  timestamp: 1700537455535,
};

export const pendingPrompts: any[] = [
  timePending,
  timePending,
  timePending,
  timePending,
  timePending,
  gasPending,
  gasPending,
  gasPending,
  pricePending,
  pricePending,
  pricePending,
  pricePending,
];

export const historyPrompts: any[] = [
  {
    query: {
      message: "swap 1 eth to usdc when marketcap is 2500",
    },
    timestamp: 1700537455535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when marketcap is 2500",
    },
    timestamp: 1700537465535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when marketcap is 2500",
    },
    timestamp: 1700537485535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when gas is 100 GWEI",
    },
    timestamp: 1700637455535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when gas is 100 GWEI",
    },
    timestamp: 1700637755535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when 11/20/2029",
    },
    timestamp: 1701037755535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when 11/20/2029",
    },
    timestamp: 1702637755535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when 11/20/2029",
    },
    timestamp: 1702637755535,
  },
  {
    query: {
      message: "swap 1 eth to usdc when 11/20/2029",
    },
    timestamp: 1702637755535,
  },
];
