import { expect } from 'chai';
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Infinity Contract", function () {

    async function deployFixture() {
        const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
        const ContractFactoryGet = await ethers.getContractFactory("InfinityContract");
        const contract = await ContractFactoryGet.deploy();
        await contract.deployed();

        return {
            contract,
            owner,
            addr1,
            addr2,
            addr3,
            addr4,
            addr5,
        };
    }

    it("should add parent to the parents list", async function() {
        const {contract, owner, addr1, addr2} = await loadFixture(
            deployFixture
        );

        const parent = await contract.connect(addr1).addParent("parent","one");
        
        const getParent = await contract.parents(addr1.address);

        await expect(getParent.walletaddress).to.equal(addr1.address);
        await expect(getParent.name).to.equal("parent");
        await expect(getParent.surname).to.equal("one");

        await expect(contract.connect(addr1).addParent("parent", "two")).to.be.revertedWith("This parent is already added!");

    })

    it("should add child", async function() {
        const {contract, owner, addr1, addr2} = await loadFixture(
            deployFixture
        )
        const parent = await contract.connect(addr1).addParent("parent","one");

        const child = await contract.connect(addr1).addChild("child one", 34324123, addr2.address);
        
        const getThisChild = await contract.connect(addr1).childs(addr2.address);
        
        await expect(getThisChild.walletaddress).to.equal(addr2.address);
        await expect(getThisChild.parentAddress).to.equal(addr1.address);
        await expect(getThisChild.name).to.equal("child one");
        await expect(getThisChild.releaseTime).to.equal(34324123);
        
        await expect(contract.connect(addr2).addChild("child two", 23432423, addr2.address)).to.be.revertedWith("Only parent can do this");
    })

    it("Should send money to the contract and increase amount of parent money", async function() {
        const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);

        const parent = await contract.connect(addr1).addParent("parent","one");

        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("1")})
        
        const newBalance = await contract.showBalanceOfContract();
        
        await expect(newBalance).to.equal(ethers.utils.parseEther("1"));
        
        const getParent = await contract.parents(addr1.address);
        const parentBalance = await getParent.currentBalance;

        await expect(parentBalance).to.equal(ethers.utils.parseEther("1"));

    })

    it("Should handle parent's withdrawal", async function() {
        const {contract, owner, addr1, addr2 } = await loadFixture(deployFixture);
        
        const parent = await contract.connect(addr1).addParent("parent","one");

        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("1")})
        
        await contract.connect(addr1).withdrawMoneyByParent(ethers.utils.parseEther("0.4"));

        const getParent = await contract.parents(addr1.address);

        await expect(getParent.currentBalance).to.be.equal(ethers.utils.parseEther("0.6"));

        await expect(contract.connect(addr1).withdrawMoneyByParent(ethers.utils.parseEther("1.2"))).to.be.revertedWith("You are not that much ether");

        
    })

    it("Should send ether to the child", async function () {
        const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);

        const parent = await contract.connect(addr1).addParent("parent","one");

        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("1")})

        const child = await contract.connect(addr1).addChild("child one", 13128324, addr2.address);
        
        const send = await contract.connect(addr1).sendMoneyToChild(addr2.address, ethers.utils.parseEther("0.1"));
        
        const getChild = await contract.childs(addr2.address);

        await expect(getChild.amountOfMoney).to.equal(ethers.utils.parseEther("0.1"));

        const getParent = await contract.parents(addr1.address);

        await expect(getParent.currentBalance).to.equal(ethers.utils.parseEther("0.9"));

        await expect(contract.connect(addr1).sendMoneyToChild(addr2.address, ethers.utils.parseEther("2"))).to.be.revertedWith("You have not that much ether");

    })

    it("Child address should withdraw ether", async function() {
        const { contract, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployFixture);

        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address);

        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("1")})

        const send = await contract.connect(addr1).sendMoneyToChild(addr2.address, ethers.utils.parseEther("0.5"));

        await contract.connect(addr2).withdrawMoneyByChild(ethers.utils.parseEther("0.3"));

        const getChild = await contract.childs(addr2.address);

        await expect(getChild.amountOfMoney).to.equal(ethers.utils.parseEther("0.2"));

        await expect(getChild.totalWithdrawnMoney).to.equal(ethers.utils.parseEther("0.3"));

        await expect(contract.connect(addr2).withdrawMoneyByChild(ethers.utils.parseEther("0.6"))).to.be.revertedWith("You are not have that much ether");

        await expect(contract.connect(addr1).withdrawMoneyByChild(ethers.utils.parseEther("0.3"))).to.be.revertedWith("Only child can do this")
        

        const parent2 = await contract.connect(addr3).addParent("parent", "two");
        const child2 = await contract.connect(addr3).addChild("child two", (Number(timestampAfter) + 300), addr4.address);
        
        await expect(contract.connect(addr4).withdrawMoneyByChild(ethers.utils.parseEther("0.1"))).to.be.revertedWith("You are not allowed widhdraw money yet");
        
    })

})