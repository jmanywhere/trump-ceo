import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Button, Web3Modal } from "@web3modal/react";
import { useState } from "react";
import {
  configureChains,
  createClient,
  erc20ABI,
  useAccount,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  WagmiConfig,
} from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import flag from "/america.gif";
import logo from "/logo.png";
import gif from "/trump_nfts.gif";
import nftAbi from "./data/nftAbi";
import priceFeedAbi from "./data/bnbPriceFeed";
import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils.js";
import classNames from "classnames";

const nftToken = "0x53f163540480F34f3B98E5eed94fb0fe857ec564"; // Change this to MAINNET WHEN DEPLOYED
const usdt = "0x55d398326f99059fF775485246999027B3197955";
const bnbPriceFeed = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";

const chains = [bsc, bscTestnet];
const projectId = import.meta.env.VITE_PROJECT_ID;
console.log(import.meta.env);
if (!projectId) {
  throw new Error("Missing NEXT_PUBLIC_PROJECT_ID");
}

const { provider } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 2, chains }),
  provider,
});
const ethereumClient = new EthereumClient(wagmiClient, chains);

function App() {
  return (
    <>
      <WagmiConfig client={wagmiClient}>
        <main className="flex flex-col w-screen min-h-screen stripes-bg">
          <header className="w-full px-4 py-6 bg-white shadow-2xl">
            <div className="container mx-auto flex flex-row items-center justify-between">
              <div className="flex flex-row items-center">
                <img src={logo} className="w-[calc(700px/10)] h-[820px/10]" />
                <div className="text-4xl font-bold pl-4 pb-3">
                  Trump CEO NFT
                </div>
              </div>
              <div className="pb-2">
                <Web3Button />
              </div>
            </div>
          </header>
          <div className="flex flex-col lg:flex-row flex-grow items-center justify-between container mx-auto pb-8">
            <div className="rounded-xl overflow-hidden hidden lg:block border-2 border-primary shadow-md shadow-secondary">
              <img src={gif} className="w-[calc(982px/3)] h-[calc(1200px/3)]" />
            </div>
            <MintCard />
            <div className="rounded-xl overflow-hidden border-2 border-primary shadow-md shadow-secondary">
              <img src={gif} className="w-[calc(982px/3)] h-[calc(1200px/3)]" />
            </div>
          </div>
        </main>
      </WagmiConfig>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  );
}

export default App;

const MintCard = () => {
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const { data } = useContractReads({
    contracts: [
      {
        address: nftToken,
        abi: nftAbi,
        functionName: "totalSupply",
      },
      {
        address: nftToken,
        abi: nftAbi,
        functionName: "balanceOf",
        args: [address || constants.AddressZero],
      },
      {
        address: usdt,
        abi: erc20ABI,
        functionName: "allowance",
        args: [address || constants.AddressZero, nftToken],
      },
      {
        address: bnbPriceFeed,
        abi: priceFeedAbi,
        functionName: "latestRoundData",
      },
    ],
    watch: true,
  });

  const { config: approveUSDTConfig } = usePrepareContractWrite({
    address: usdt,
    abi: erc20ABI,
    functionName: "approve",
    args: [nftToken, parseEther("1500")],
  });

  const { config: mintBNBConfig } = usePrepareContractWrite({
    address: nftToken,
    abi: nftAbi,
    functionName: "mint",
    args: [
      false,
      BigNumber.from(
        isNaN(parseInt(amount.toString())) ? "0" : amount.toString()
      ),
    ],
    overrides: {
      value:
        (data &&
          parseEther(
            BigNumber.from(
              isNaN(parseInt(amount.toString())) ? "0" : amount.toString()
            ).toString()
          )
            .mul(100) // price
            .mul(1e8) // answer decimals
            .mul(1005) // need .05% extra due to volatility of price
            .div(1000) // divide to the .05% wiggle room
            .div(data[3]?.answer || 1)) || // divide by price to get approx bnb price
        0,
    },
    enabled: data?.[3]?.answer.gt(0) || false,
  });

  const { config: mintUSDTConfig } = usePrepareContractWrite({
    address: nftToken,
    abi: nftAbi,
    functionName: "mint",
    args: [
      true,
      BigNumber.from(
        isNaN(parseInt(amount.toString())) ? "0" : amount.toString()
      ),
    ],
  });

  const { writeAsync: approveUSDTWrite } = useContractWrite(approveUSDTConfig);
  const { writeAsync: mintWithBnb } = useContractWrite(mintBNBConfig);
  const { writeAsync: mintWithUSDT } = useContractWrite(mintUSDTConfig);

  return (
    <div className="card w-96 max-w-[80%] bg-base-100 shadow-xl border-2 border-primary shadow-secondary mx-4 my-12 lg:my-0">
      <div className="card-body items-center text-center">
        <h1 className="text-accent card-title">
          <img src={flag} className="w-18 h-12" />
          Mint Your NFT
          <img src={flag} className="w-18 h-12" />
        </h1>
        <p className="text-justify">
          Some text to convince you why you need this NFT, honestly we need the
          admin of the project to elaborate on this. In the meantime a short
          summary like this will suffice
        </p>
        <div className="grid grid-cols-5 grid-rows-3 justify-between">
          <div className="text-left col-span-3">Current Round:</div>{" "}
          <div className=" text-accent ml-auto col-span-2">1</div>
          <div className="text-left col-span-3">Total Minted:</div>{" "}
          <div className=" text-accent ml-auto col-span-2">
            {data?.[0]?.toString() || "-"}
          </div>
          <div className="text-left col-span-3">Price: </div>
          <div className=" text-accent ml-auto col-span-2">100 USDT</div>
        </div>
        <input
          type="number"
          min={1}
          max={5}
          value={amount}
          placeholder="Amount to be minted"
          onChange={(e) => {
            const newNum = e.target.valueAsNumber;
            if (newNum > 5 || newNum < 1 || isNaN(newNum)) {
              setAmount("");
              return;
            }
            setAmount(newNum);
          }}
          className="input w-60 input-bordered input-primary "
        />
        <div className="card-actions justify-center pt-4">
          <button
            className={classNames(
              "btn btn-secondary",
              loading ? "btn-disabled" : ""
            )}
            onClick={() => {
              if (!mintWithBnb) return;
              setLoading(true);
              void mintWithBnb()
                .then(
                  async (r) =>
                    await r.wait().then((r) => {
                      console.log("receipt", r);
                      setAmount("");
                      setLoading(false);
                    })
                )
                .finally(() => setLoading(false));
            }}
          >
            Mint BNB
          </button>
          <button
            className={classNames(
              "btn btn-primary",
              loading ? "btn-disabled" : ""
            )}
            onClick={() => {
              if (data?.[2]?.gte(parseEther("100")) || false) {
                if (!mintWithUSDT) return;
                setLoading(true);
                void mintWithUSDT()
                  .then(
                    async (r) =>
                      await r.wait().then((r) => {
                        console.log("receipt", r);
                        setAmount("");
                        setLoading(false);
                      })
                  )
                  .finally(() => setLoading(false));
              }
              if (!approveUSDTWrite) return;
              setLoading(true);
              void approveUSDTWrite()
                .then(
                  async (r) =>
                    await r.wait().then((r) => {
                      console.log("receipt", r);
                      setLoading(false);
                    })
                )
                .finally(() => setLoading(false));
            }}
          >
            {data?.[2]?.gte(parseEther("100")) || false ? "Mint" : "Approve"}{" "}
            USDT
          </button>
        </div>
      </div>
    </div>
  );
};
