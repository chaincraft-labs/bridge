import { ethers, parseEther } from "ethers";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const PROVIDER_API_KEY = process.env.ALCHEMY_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x";

// providers
const allfeatProvider = new ethers.JsonRpcProvider(
  `https://harmonie-endpoint-02.allfeat.io`
);
const sepoliaProvider = new ethers.JsonRpcProvider(
  `https://eth-sepolia.g.alchemy.com/v2/${PROVIDER_API_KEY}`
);
// signers
const allfeatSigner = new ethers.Wallet(PRIVATE_KEY).connect(allfeatProvider);
const sepoliaSigner = new ethers.Wallet(PRIVATE_KEY).connect(sepoliaProvider);

// contracts
const ADai = JSON.parse(
  fs.readFileSync("./contracts/allfeat/ADai.json", {
    encoding: "utf8",
  })
);
console.log(`ADai allfeat address: ${ADai.address}`);

// contract instances
const allfeatDai = new ethers.Contract(ADai.address, ADai.abi, allfeatSigner);

export default () => {
  const handleCustomTransferEvent = async () => {
    console.log("listening for custom transfer events...");
    console.log("----------");

    allfeatDai.on("CustomTransfer", async (sender, recipient, amount) => {
      console.log(
        `${sender} transferred ${parseEther(
          amount.toString()
        )} aDai to ${recipient}✅`
      );
      console.log("----------");
    });
  };

  handleCustomTransferEvent().catch((error) => {
    console.error(error);
    process.exit(1);
  });
};
