import { toUtf8Bytes } from "ethers";
import { ethers } from "hardhat";

interface TX {
  gasUsed: bigint[];
  aveGasUsed: bigint;
}

const CAR_MODELS = [
  "Peugeot_207",
  "Peugeot_Pars",
  "Peugeot_206",
  "IK_Runna",
  "IK_Dena",
  "IK_Tara",
  "IK_Dena_Plus",
  "IK_Runna_Plus",
];

const TOTAL_TEST_COUNT = 10;

const select_model = () => {
  return CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
};

const generate_uri = (nonce: number, model: string, user: string) => {
  return ethers.keccak256(toUtf8Bytes(`${nonce}${model}${user}`));
};

const mean = (data: bigint[]) => {
  if (data.length < 1) {
    return BigInt(1);
  }
  return data.reduce((prev, current) => prev + current) / BigInt(data.length);
};

async function main() {
  const [deployer, ikco, ...users] = await ethers.getSigners();
  const IKCOExchange = await ethers.getContractFactory("IKCOExchange");
  const ikcoExchange = await IKCOExchange.connect(deployer).deploy();
  await ikcoExchange.waitForDeployment();
  const ikcoExchangeContractAddress = await ikcoExchange.getAddress();
  const IKCOVehicleNFT = await ethers.getContractFactory("IKCOVehicleNFT");
  const ikcoVehicleNFT = await IKCOVehicleNFT.connect(deployer).deploy();
  await ikcoVehicleNFT.waitForDeployment();
  const ikcoVehicleNFTContractAddress = await ikcoVehicleNFT.getAddress();
  const IKCOMain = await ethers.getContractFactory("IKCOMain");
  const ikcoMain = await IKCOMain.connect(deployer).deploy(
    ikcoExchangeContractAddress,
    ikcoVehicleNFTContractAddress,
    ikco,
  );
  await ikcoMain.waitForDeployment();
  const ikcoMainContractAddress = await ikcoMain.getAddress();
  await ikcoExchange.setMainContractAddress(ikcoMainContractAddress);
  await ikcoVehicleNFT.setMainContractAddress(ikcoMainContractAddress);
  const txs: Record<number, TX> = {};

  const exec = () => {
    return new Promise<void>(async (resolve) => {
      let execCount = 0;
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userAddress = await user.getAddress();
        const model = select_model();
        const uri = generate_uri(i, model, userAddress);
        const bodyNumber = `bodyNumber#${i + 1}`;
        if (!txs[i]) {
          txs[i] = {
            aveGasUsed: BigInt(0),
            gasUsed: [],
          };
        }
        ikcoMain
          .connect(ikco)
          .mintVehicle(user, uri, 1402, bodyNumber, model)
          .then((tx) => tx.wait(1))
          .then((receipt) => {
            // console.log("Transaction:", i + 1);
            // console.log("Token Data:");
            // console.table({
            //   userAddress,
            //   model,
            //   uri,
            //   bodyNumber,
            // });
            // console.log("Gas Used:", receipt?.gasUsed.toString());
            txs[i].gasUsed.push(receipt?.gasUsed || BigInt(0));
            execCount++;
            if (execCount === users.length) {
              resolve();
            }
          });
      }
    });
  };

  for (let i = 0; i < TOTAL_TEST_COUNT; i++) {
    console.log("step:", i);
    await exec();
    console.log("step:", i, "Finished");
  }

  Object.keys(txs).forEach((el) => {
    txs[Number(el)] = {
      ...txs[Number(el)],
      aveGasUsed: mean(txs[Number(el)].gasUsed),
    };
  });

  console.table(txs);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
