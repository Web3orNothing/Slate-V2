/* eslint-disable @next/next/no-img-element */
import { useMemo, useState, useEffect, MouseEvent } from "react";
import { Popover, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import Image from "next/image";
import crossImg from "@/assets/cross.png";
import deleteImg from "@/assets/delete.png";
import doneImg from "@/assets/done.png";
import { BsCaretDownSquare, BsCaretRightSquare } from "react-icons/bs";
import { getTokenAddress, groupConditions } from "@/utils";
import { chains } from "@/config/constants/Chains";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const CONDITIONS = ["condition", "time"];

export type Stats = {
  value: string;
  id: string;
};

export type ProcessText = {
  value: string;
  id: string;
};

export type Icon = {
  coin: string;
  image: string;
};

export type Condition = {
  conditions: Call[];
  actions: Call[];
};

export type Call = {
  name: string;
  args: { [key: string]: any };
  body: { [key: string]: any };
  txHashes?: string[];
};

export type Query = {
  id: string;
  message: string;
  messageId: number;
  calls: Call[];
  description: string;
  placeholders: any[];
  conditionId?: string;
  historyId?: number;
  conditions: Call[];
  actions: Call[];
  simstatus: number;
  status?: string;
  timestamp?: string;
};

type ResponseProps = {
  mode: number;
  query: Query;
  runningIds: string[];
  canceledIds: string[];
  statsText: Stats;
  processText: ProcessText;
  iconArray: Icon[];
  verifiedData?: any;
  handleChangeParams?: (
    id: string,
    index: number,
    key: string,
    value: string
  ) => void;
  onSubmit: (id: string) => void;
  onDelete?: (id: string) => void;
  // onCancel: (id: string) => void;
};

const useStyles = makeStyles(() => ({
  popover: { pointerEvents: "none" },
  popoverContent: { pointerEvents: "auto" },
}));

export default function Response({
  mode,
  query,
  runningIds,
  canceledIds,
  statsText,
  processText,
  iconArray,
  verifiedData,
  handleChangeParams,
  onSubmit,
  onDelete,
}: // onCancel,
ResponseProps) {
  const classes = useStyles();
  const isPending = runningIds.includes(query.id);
  const isCanceled = canceledIds.includes(query.id);
  const {
    id,
    calls,
    conditions,
    actions,
    description,
    message,
    simstatus,
    timestamp,
  } = query;
  const hasCondition =
    calls.filter((x) => CONDITIONS.includes(x.name)).length > 0;

  const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);
  const [popoverText, setPopoverText] = useState("");
  const [popoverUrl, setPopoverUrl] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [protocol, setProtocol] = useState("");

  useEffect(() => {
    actions.map((x) => {
      Object.entries(x.args).map(([key, value]) => {
        if (!chain.length && key.toLowerCase().includes("chain"))
          setChain(value);
        if (!protocol.length && key.toLowerCase().includes("protocol"))
          setProtocol(value);
      });
    });
  }, [actions, chain, protocol]);

  const handlePopoverOpen = async (
    el: HTMLElement,
    key: string,
    text: string
  ) => {
    const lowerKey = key.toLowerCase();
    const noPopoverKeys = ["token", "chain", "protocol"];
    const shouldShow = noPopoverKeys.reduce(
      (a, b) => a || lowerKey.includes(b),
      false
    );
    if (!shouldShow) return;

    if (lowerKey.includes("token") && !text.includes("0x") && verifiedData) {
      let addr = "";
      let net = chains.find((x) => x.network === chain);
      if (protocol !== "") {
        const res = await verifiedData.protocols.find(
          (x: any) => x.name.toLowerCase() === protocol
        );
        const id: any = Object.entries(res.addresses)[0][0];
        net = chains.find((x) => x.id === id);
        if (!net) return;
        addr = await getTokenAddress(
          net?.network,
          text === "eth" ? "weth" : text
        );
      } else {
        const res = await verifiedData.chains.find(
          (x: any) => x.name.toLowerCase() === chain
        );
        const tmp = res.tokens.find(
          (x: any) => x.symbol === (text === "eth" ? "weth" : text)
        );
        addr = tmp.address;
      }
      setPopoverUrl(net?.blockExplorers.default.url + "/address/" + addr);
      setPopoverText(addr);
    } else if (lowerKey.includes("chain")) {
      const net = chains.find((x) => x.network === chain);
      setPopoverUrl(net?.blockExplorers.default.url + "/");
      setPopoverText(chain.toUpperCase());
    } else if (lowerKey.includes("protocol") && !text.includes("0x")) {
      const res = await verifiedData.protocols.find(
        (x: any) => x.name.toLowerCase() === text
      );
      const id: any = Object.entries(res.addresses)[0][0];
      const addr: any = Object.entries(res.addresses)[0][1];
      const net = chains.find((x) => x.id === id);
      setPopoverUrl(net?.blockExplorers.default.url + "/address/" + addr[0]);
      setPopoverText(addr[0]);
    }
    setPopoverAnchor(el);
  };

  const handlePopoverClose = () => setPopoverAnchor(null);

  const rows = useMemo(() => {
    const group = groupConditions(calls);
    if (mode > 0) return [{ actions, conditions }];
    if (!group) return [{ actions, conditions: [] }];
    return group;
  }, [actions, calls, conditions, mode]);

  const getIcon = (key: string, value: string) => {
    if (
      !key.toLowerCase().includes("token") &&
      !key.toLowerCase().includes("chain")
    )
      return "";
    const icon = iconArray.find((x) => x.coin === value);
    if (!icon || icon.image === "undefined") return "Undefined";

    return <img src={icon.image} alt="icon" />;
  };

  return (
    <div>
      <div className="my-2 flex items-center cursor-default">
        <span>{message}</span>
        <i style={{ paddingLeft: "5px" }}>
          {timestamp ? `: ${new Date(parseInt(timestamp)).toUTCString()}` : ""}
        </i>
        {simstatus > 0 && mode < 2 && (
          <Image
            className="mx-3"
            src={crossImg}
            width={15}
            height={15}
            alt="simstatus"
          />
        )}
      </div>
      <div
        className={`${mode === 0 ? "border-l-4 px-4 border-[#AEB1DD]" : ""}`}
      >
        <div className="text-left flex items-center">{description}&nbsp;</div>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex}>
            {row.actions.map((x, index) => (
              <div key={`${rowIndex * 100 + index}`}>
                <button className="mt-2 flex items-center">
                  /{x.name} &nbsp;
                </button>
                {
                  <div>
                    {Object.entries(x.args).map(([key, value], i) => (
                      <Typography
                        // className={`flex items-center text-[12px] ${inter.className} !important `}
                        className={`flex items-center text-[12px]`}
                        key={key}
                        aria-owns="mouse-over-popover"
                        aria-haspopup="true"
                      >
                        <DotIndent />
                        <p className={inter.className}>{key}: </p>
                        {mode === 0 &&
                        !(isCanceled || !!getLastTxHashes(rows)) ? (
                          <input
                            className="bg-transparent outline-none mt-0.5 mb-0.5 mr-2 ml-3 pl-1"
                            style={{
                              width: `${x.args[`${key}`].length * 10 + 10}px`,
                              border: "1px solid gray",
                            }}
                            value={value}
                            onChange={(ev: React.FormEvent<HTMLInputElement>) =>
                              handleChangeParams?.(
                                query.id,
                                index,
                                key,
                                ev.currentTarget.value
                              )
                            }
                          />
                        ) : (
                          (
                            <p style={{ overflowWrap: "anywhere" }}>{value}</p>
                          ) || <i className="text-gray-500">TBD</i>
                        )}
                        &nbsp;
                        {
                          <span
                            onMouseEnter={(ev: MouseEvent<HTMLElement>) =>
                              handlePopoverOpen(ev.currentTarget, key, value)
                            }
                            onMouseLeave={() => handlePopoverClose()}
                          >
                            {getIcon(key, value)}
                          </span>
                        }
                        <br />
                      </Typography>
                    ))}
                  </div>
                }
                {x.txHashes && (!simstatus || mode === 2) && (
                  <div className="mt-2">
                    <button className="flex items-center">
                      <DotIndent />
                      Transaction Pathway &nbsp;
                    </button>
                    {
                      <>
                        {x.txHashes.length > 1 && (
                          <span className="flex items-center">
                            <EmptyIndent />
                            <i>1. Approve: </i>
                            <TxIndicator
                              hash={x.txHashes[0]}
                              isRunning={isPending}
                            />
                          </span>
                        )}
                        <span className="flex items-center">
                          <EmptyIndent />
                          <i>
                            {x.txHashes.length}. {upper(x.name)}:{" "}
                          </i>
                          <TxIndicator
                            hash={x.txHashes[x.txHashes.length - 1]}
                            isRunning={isPending}
                          />
                        </span>
                      </>
                    }
                  </div>
                )}
              </div>
            ))}
            {row.conditions.length > 0 &&
              row.conditions.map((y, index) => (
                <div key={index}>
                  <button className="mt-2 flex items-center">
                    <EmptyIndent />
                    <DotIndent /> /{y.name} &nbsp;
                  </button>
                  {
                    <div>
                      {Object.entries(y.args).map(([key, value]) => (
                        <span key={key}>
                          <EmptyIndent />
                          <EmptyIndent />
                          {key}: {value || <i className="text-gray-500">TBD</i>}
                          <br />
                        </span>
                      ))}
                    </div>
                  }
                </div>
              ))}
          </div>
        ))}
      </div>
      {mode < 2 && (
        <div className="my-2 flex">
          {!isPending ? (
            <button
              className={`${mode ? "hidden" : ""} border py-1 px-3 mt-1 mr-3`}
              disabled={
                isPending || // pending
                isCanceled || // already canceled
                (!hasCondition && runningIds.length > 0) || // not condition call and already running tx
                !!getLastTxHashes(rows) // not condition call already executed
              }
              onClick={() => [onSubmit][mode](query.id)}
            >
              {!!getLastTxHashes(rows) ? (
                getLastTxHashes(rows)![getLastTxHashes(rows)!.length - 1] !==
                "" ? (
                  <p style={{ color: "green" }}>Success</p>
                ) : (
                  <p style={{ color: "red" }}>Failed</p>
                )
              ) : !isCanceled ? (
                ["Confirm", "Cancel"][mode]
              ) : (
                "Canceled"
              )}
            </button>
          ) : (
            <button className="border py-1 px-3 mt-1 mr-3" disabled>
              {processText.value}
            </button>
          )}

          {!getLastTxHashes(rows) &&
            getLastTxHashes(rows) === undefined &&
            !mode &&
            !isCanceled && (
              <button disabled={isPending} onClick={() => onDelete?.(query.id)}>
                <Image src={deleteImg} width={15} height={15} alt="delete" />
              </button>
            )}
          {isPending && <div className="ml-2 mt-2 loader" />}
        </div>
      )}
      {query.id === statsText.id && !isCanceled && (
        <div className="text-red-600 ml-4">{statsText.value}</div>
      )}
      <div className="mb-2">&nbsp;</div>
      <Popover
        id="mouse-over-popover"
        sx={{ pointerEvents: "none" }}
        className={classes.popover}
        classes={{ paper: classes.popoverContent }}
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Typography sx={{ p: 1 }}>
          <a href={popoverUrl} target="_blank">
            {popoverText}
          </a>
        </Typography>
      </Popover>
    </div>
  );
}

const DotIndent = () => <span className="">&nbsp;•&nbsp;</span>;
const EmptyIndent = () => <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>;
const TxIndicator = (props: any) => (
  <span className="flex items-center">
    <a
      className="mx-2 underline"
      href={`https://etherscan.io/tx/${props.hash}`}
      target="_blank"
      rel="noreferrer"
    >
      {props.hash}
    </a>
    {props.hash.length === 0 ? (
      props.isRunning ? (
        <div className="ml-2 loader" />
      ) : (
        <i className="text-red-400">Transaction failed</i>
      )
    ) : (
      <Image src={doneImg} width={15} height={15} alt="done" />
    )}
  </span>
);
const upper = (name: string) => name[0].toUpperCase() + name.slice(1);
const getLastTxHashes = (rows: Condition[]) =>
  rows[0].actions[rows[0].actions.length - 1]?.txHashes;
