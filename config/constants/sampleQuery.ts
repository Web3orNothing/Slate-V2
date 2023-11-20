import { Query } from "@/components/Response";
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
