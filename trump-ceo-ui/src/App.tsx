import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Button, Web3Modal } from "@web3modal/react";
import { useState } from "react";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import flag from "/america.gif";

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
        <main className="flex flex-col w-screen min-h-screen">
          <header className="w-full px-4 py-6 bg-neutral">
            <div className="container mx-auto flex flex-row items-center justify-between">
              <div>Trump CEO Mint</div>
              <div>
                <Web3Button />
              </div>
            </div>
          </header>
          <div className="flex flex-row flex-grow items-center justify-between container mx-auto">
            <div>Image 1</div>
            <div>
              <MintCard />
            </div>
            <div>Image2</div>
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
  return (
    <div className="card w-96 bg-base-100 shadow-xl border-2 border-primary shadow-secondary">
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
        <div className="grid grid-cols-2 grid-rows-3 justify-between">
          <div className="text-left">Current Round:</div>{" "}
          <div className=" text-accent ml-auto">1</div>
          <div className="text-left">Total Minted:</div>{" "}
          <div className=" text-accent ml-auto">3888</div>
          <div className="text-left">Price: </div>
          <div className=" text-accent ml-auto">100 USDT</div>
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
          <button className="btn btn-secondary">Mint BNB</button>
          <button className="btn btn-primary">Mint USDT</button>
        </div>
      </div>
    </div>
  );
};