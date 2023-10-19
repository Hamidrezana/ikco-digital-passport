import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IKCOMain } from "../typechain-types";
import { AddressLike, ContractRunner } from "ethers";

describe("IKCO Contract Test", function () {
  async function init() {
    const ONE_ETHER = ethers.parseEther("1");
    const TEN_ETHER = ethers.parseEther("10");
    const [deployer, ikco, user_1, user_2, user_3] = await ethers.getSigners();

    const IKCOExchange = await ethers.getContractFactory("IKCOExchange");
    const ikcoExchange = await IKCOExchange.connect(deployer).deploy();
    await ikcoExchange.waitForDeployment();
    const ikcoExchangeAddress = await ikcoExchange.getAddress();

    const IKCOVehicleNFT = await ethers.getContractFactory("IKCOVehicleNFT");
    const ikcoVehicleNFT = await IKCOVehicleNFT.connect(deployer).deploy();
    await ikcoVehicleNFT.waitForDeployment();
    const ikcoVehicleNFTAddress = await ikcoVehicleNFT.getAddress();

    const IKCOMain = await ethers.getContractFactory("IKCOMain");
    const ikcoMain = await IKCOMain.connect(deployer).deploy(
      ikcoExchangeAddress,
      ikcoVehicleNFTAddress,
      ikco,
    );
    await ikcoMain.waitForDeployment();
    const ikcoMainAddress = await ikcoMain.getAddress();
    await ikcoExchange.setMainContractAddress(ikcoMainAddress);
    await ikcoVehicleNFT.setMainContractAddress(ikcoMainAddress);

    return {
      ikcoVehicleNFT,
      ikcoExchange,
      ikcoMain,
      ikcoExchangeAddress,
      ikcoMainAddress,
      ikcoVehicleNFTAddress,
      deployer,
      ikco,
      user_1,
      user_2,
      user_3,
      ONE_ETHER,
      TEN_ETHER,
    };
  }

  async function mintVehicle(ikcoMain: IKCOMain, ikco: ContractRunner, user_1: AddressLike) {
    return await (
      await ikcoMain.connect(ikco).mintVehicle(user_1, "ikco", 1402, "bodyNumber#1", "207")
    ).wait();
  }

  describe("Deploying", function () {
    it("Should deploy exchange contract right", async function () {
      const [deployer] = await ethers.getSigners();
      const IKCOExchange = await ethers.getContractFactory("IKCOExchange");
      const ikcoExchange = await IKCOExchange.connect(deployer).deploy();
      await ikcoExchange.waitForDeployment();
    });

    it("Should deploy NFT contract right", async function () {
      const [deployer] = await ethers.getSigners();
      const IKCOVehicleNFT = await ethers.getContractFactory("IKCOVehicleNFT");
      const ikcoVehicleNFT = await IKCOVehicleNFT.connect(deployer).deploy();
      await ikcoVehicleNFT.waitForDeployment();
    });

    it("Should deploy main contract right", async function () {
      const [deployer, ikco] = await ethers.getSigners();

      const IKCOExchange = await ethers.getContractFactory("IKCOExchange");
      const ikcoExchange = await IKCOExchange.connect(deployer).deploy();
      await ikcoExchange.waitForDeployment();
      const ikcoExchangeAddress = await ikcoExchange.getAddress();
  
      const IKCOVehicleNFT = await ethers.getContractFactory("IKCOVehicleNFT");
      const ikcoVehicleNFT = await IKCOVehicleNFT.connect(deployer).deploy();
      await ikcoVehicleNFT.waitForDeployment();
      const ikcoVehicleNFTAddress = await ikcoVehicleNFT.getAddress();
  
      const IKCOMain = await ethers.getContractFactory("IKCOMain");
      const ikcoMain = await IKCOMain.connect(deployer).deploy(
        ikcoExchangeAddress,
        ikcoVehicleNFTAddress,
        ikco,
      );
      await ikcoMain.waitForDeployment();
      const ikcoMainAddress = await ikcoMain.getAddress();
      await ikcoExchange.setMainContractAddress(ikcoMainAddress);
      await ikcoVehicleNFT.setMainContractAddress(ikcoMainAddress);
    });
  });

  describe("Minting", function () {
    it("Should mint new vehicle right", async function () {
      const { ikcoMain, ikcoVehicleNFT, ikco, user_1 } = await loadFixture(init);
      await mintVehicle(ikcoMain, ikco, user_1);
      const [year, model, bodyNumber, kilometer, gas] = await ikcoMain.vehicleDetail(0);
      const [yearToken, modelToken, bodyNumberToken, kilometerToken, gasToken] = [
        BigInt(1402),
        "207",
        "bodyNumber#1",
        BigInt(0),
        BigInt(0),
      ];
      expect(year).to.equal(yearToken);
      expect(model).to.equal(modelToken);
      expect(bodyNumber).to.equal(bodyNumberToken);
      expect(gas).to.equal(gasToken);
      expect(kilometer).to.equal(kilometerToken);
      expect(await ikcoVehicleNFT.ownerOf(0)).to.equal(await user_1.getAddress());
    });

    it("Should fail if sender is not IKCO", async function () {
      const { ikcoMain, ikco, user_1 } = await loadFixture(init);
      await mintVehicle(ikcoMain, ikco, user_1);
      await expect(ikcoMain.setKilometer(0, 10)).to.be.revertedWith("Sender not authorized.");
    });
  });

  describe("Updating Data", function () {
    it("Should add new gas right", async function () {
      const { ikcoMain, ikco, user_1 } = await loadFixture(init);
      await mintVehicle(ikcoMain, ikco, user_1);
      await ikcoMain.connect(ikco).addGasUsage(0, 10);
      const gas = (await ikcoMain.vehicleDetail(0))[4];
      expect(gas).to.equal(BigInt(10));
    });

    it("Should add new KM right", async function () {
      const { ikcoMain, ikco, user_1 } = await loadFixture(init);
      await mintVehicle(ikcoMain, ikco, user_1);
      await ikcoMain.connect(ikco).setKilometer(0, 10);
      const km = (await ikcoMain.vehicleDetail(0))[3];
      expect(km).to.equal(BigInt(10));
    });

    it("Should not accept new KM", async function () {
      const { ikcoMain, ikco, user_1 } = await loadFixture(init);
      await mintVehicle(ikcoMain, ikco, user_1);
      await ikcoMain.connect(ikco).setKilometer(0, 10);
      await expect(ikcoMain.connect(ikco).setKilometer(0, 5)).to.be.revertedWith(
        "New Kilometer should bigger than last one.",
      );
    });

    it("Should place for sell right", async function () {
      const { ikcoMain, ikcoVehicleNFT, ikco, user_1, user_2, TEN_ETHER } = await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await ikcoVehicleNFT.connect(user_1).approveToMainContract(mintedTokenId);
      await ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, TEN_ETHER);
    });

    it("Should not place for sell", async function () {
      const { ikcoMain, ikcoVehicleNFT, ikco, user_1, user_2, TEN_ETHER } = await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await expect(
        ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, TEN_ETHER),
      ).to.be.revertedWith("Approved is not set for this NFT.");
    });
  });

  describe("Transferring", function () {
    it("Should place for sell right", async function () {
      const { ikcoMain, ikcoVehicleNFT, ikco, user_1, user_2, TEN_ETHER } = await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await ikcoVehicleNFT.connect(user_1).approveToMainContract(mintedTokenId);
      await ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, TEN_ETHER);
    });

    it("Should not place for sell: Not approved to MainIKCO contract", async function () {
      const { ikcoMain, ikco, user_1, user_2, TEN_ETHER } = await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await expect(
        ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, TEN_ETHER),
      ).to.be.revertedWith("Approved is not set for this NFT.");
    });

    it("Should not place for sell: Caller is not Owner", async function () {
      const { ikcoMain, ikco, user_1, user_2, user_3, TEN_ETHER } = await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await expect(
        ikcoMain.connect(user_3).placeSell(user_2, mintedTokenId, TEN_ETHER),
      ).to.be.revertedWith("Only NFT's owner can place offer.");
    });

    it("Should match order right", async function () {
      const { ikcoMain, ikcoVehicleNFT, ikco, user_1, user_2, TEN_ETHER } = await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await ikcoVehicleNFT.connect(user_1).approveToMainContract(mintedTokenId);
      const placeSellTx = await (
        await ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, TEN_ETHER)
      ).wait();
      const sellId = (placeSellTx?.logs[0] as any).args[2];
      await expect(
        ikcoMain.connect(user_2).matchOrder(sellId, { value: TEN_ETHER }),
      ).to.changeEtherBalances([user_1, user_2], [TEN_ETHER, -TEN_ETHER]);
    });

    it("Should match order right fail: Caller is not buyer", async function () {
      const { ikcoMain, ikcoVehicleNFT, ikco, user_1, user_2, user_3, TEN_ETHER } =
        await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await ikcoVehicleNFT.connect(user_1).approveToMainContract(mintedTokenId);
      const placeSellTx = await (
        await ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, TEN_ETHER)
      ).wait();
      const sellId = (placeSellTx?.logs[0] as any).args[2];
      await expect(
        ikcoMain.connect(user_3).matchOrder(sellId, { value: TEN_ETHER }),
      ).to.be.revertedWith("Caller is not authorize.");
    });

    it("Should match order right fail: Low value", async function () {
      const { ikcoMain, ikcoVehicleNFT, ikco, user_1, user_2, ONE_ETHER, TEN_ETHER } =
        await loadFixture(init);
      const mintTx = await mintVehicle(ikcoMain, ikco, user_1);
      const mintedTokenId = (mintTx?.logs[0] as any).args?.[0] || 0;
      await ikcoVehicleNFT.connect(user_1).approveToMainContract(mintedTokenId);
      const placeSellTx = await (
        await ikcoMain.connect(user_1).placeSell(user_2, mintedTokenId, TEN_ETHER)
      ).wait();
      const sellId = (placeSellTx?.logs[0] as any).args[2];
      await expect(
        ikcoMain.connect(user_2).matchOrder(sellId, { value: ONE_ETHER }),
      ).to.be.revertedWith("Not enough funds to buy.");
    });
  });
});
