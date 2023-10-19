import { ethers } from "hardhat";

async function main() {
  const [deployer, ikco, user_1, user_2] = await ethers.getSigners();
  const ikcoAddress = await ikco.getAddress();
  const deployerAddress = await deployer.getAddress();
  console.log("deployer Address : ", deployerAddress);
  console.log("ikco Address : ", ikcoAddress);

  const IKCOExchange = await ethers.getContractFactory("IKCOExchange");
  const ikcoExchange = await IKCOExchange.connect(deployer).deploy();
  await ikcoExchange.waitForDeployment();
  const ikcoExchangeContractAddress = await ikcoExchange.getAddress();
  console.log("IKCOExchange Contract Address : ", ikcoExchangeContractAddress);

  const IKCOVehicleNFT = await ethers.getContractFactory("IKCOVehicleNFT");
  const ikcoVehicleNFT = await IKCOVehicleNFT.connect(deployer).deploy();
  await ikcoVehicleNFT.waitForDeployment();
  const ikcoVehicleNFTContractAddress = await ikcoVehicleNFT.getAddress();
  console.log("IKCOVehicleNFT Contract Address : ", ikcoVehicleNFTContractAddress);

  const IKCOMain = await ethers.getContractFactory("IKCOMain");
  const ikcoMain = await IKCOMain.connect(deployer).deploy(
    ikcoExchangeContractAddress,
    ikcoVehicleNFTContractAddress,
    ikco,
  );
  await ikcoMain.waitForDeployment();
  const ikcoMainContractAddress = await ikcoMain.getAddress();
  console.log("IKCOMain Contract Address : ", ikcoMainContractAddress);
  await ikcoExchange.setMainContractAddress(ikcoMainContractAddress);
  await ikcoVehicleNFT.setMainContractAddress(ikcoMainContractAddress);
  const mintTx = await (
    await ikcoMain.connect(ikco).mintVehicle(user_1, "ikco", 1402, "bodyNumber#1", "207")
  ).wait(1);

  const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
  console.log("mintedTokenId", mintedTokenId);

  await (await ikcoMain.connect(ikco).addGasUsage(mintedTokenId, 10)).wait(1);
  await (await ikcoMain.connect(ikco).setKilometer(mintedTokenId, 10)).wait(1);

  await ikcoVehicleNFT.connect(user_1).approveToMainContract(mintedTokenId);

  const placeSellTx = await (
    await ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, ethers.parseEther("100"))
  ).wait(1);
  const sellId = (placeSellTx?.logs[0] as any).args[2];
  console.log("sellId", sellId);
  await ikcoMain.connect(user_2).matchOrder(sellId, { value: ethers.parseEther("100") });

  console.log(ethers.formatEther(await ethers.provider.getBalance(user_2)).toString());
  console.log(ethers.formatEther(await ethers.provider.getBalance(user_1)).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
