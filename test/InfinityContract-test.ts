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

        await expect(contract.connect(addr1).addParent("parent", "two")).to.be.rejectedWith("This parent is already added!");

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
        
    })

    it("Should send money to the contract and increase amount of parent money", async function() {
        const { contract, owner, addr1, addr2 } = await loadFixture(deployFixture);

        const parent = await contract.connect(addr1).addParent("parent","one");

        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("1")})
        
        const newBalance = await contract.showBalanceOfContract();
        
        await expect(newBalance).to.equal(ethers.utils.parseEther("1"));
        
        const getParent = await contract.parents(addr1.address);

        await expect(getParent.currentBalance).to.equal(ethers.utils.parseEther("1"));

    })

    it("Should handle parent's withdrawal", async function() {
        const {contract, owner, addr1, addr2 } = await loadFixture(deployFixture);
        
        const parent = await contract.connect(addr1).addParent("parent","one");

        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("1")})
        
        await contract.connect(addr1).withdrawMoneyByParent(ethers.utils.parseEther("0.4"));

        const getParent = await contract.parents(addr1.address);

        await expect(getParent.currentBalance).to.be.equal(ethers.utils.parseEther("0.6"));

        await expect(contract.connect(addr1).withdrawMoneyByParent(ethers.utils.parseEther("1.2"))).to.be.rejectedWith("You are not that much ether");

        
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

        await expect(contract.connect(addr1).sendMoneyToChild(addr2.address, ethers.utils.parseEther("2"))).to.be.rejectedWith("You have not that much ether");

    })

    it("Parent should withdraw all ether", async function(){

        const {contract, owner, addr1, addr2 } = await loadFixture(deployFixture);
        
        const parent = await contract.connect(addr1).addParent("parent","one");
        const parent2 = await contract.connect(addr2).addParent("parent","iki");

        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("1")});

        await contract.connect(addr1).withdrawAllMoneyByParent();

        const getParent = await contract.parents(addr1.address);

        await expect(getParent.currentBalance).to.be.equal(ethers.utils.parseEther("0"));

        await expect(contract.connect(addr2).withdrawAllMoneyByParent()).to.be.rejectedWith("You are not have any ehter");


    })

    it("Parent should withdraw amount of ether from child's adress", async function(){

        const {contract, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);
        //şuanki zamanı kullanıyor
        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("2")});

        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address);
        
        await contract.connect(addr1).sendMoneyToChild(addr2.address,ethers.utils.parseEther("1"));
          
        await expect(contract.connect(addr1).withdrawMoneyByParentFromChild(addr2.address,ethers.utils.parseEther("1"))).to.be.rejectedWith("You are not allowed withdraw this money. Money is allowed to usage of child now.");

        const child2 = await contract.connect(addr1).addChild("child iki", (Number(timestampAfter) + 300), addr3.address);

        await contract.connect(addr1).sendMoneyToChild(addr3.address,ethers.utils.parseEther("1"));
        
        await contract.connect(addr1).withdrawMoneyByParentFromChild(addr3.address,ethers.utils.parseEther("0.4"));

        const getParent = await contract.parents(addr1.address);
        await expect(getParent.currentBalance).to.be.equal(ethers.utils.parseEther("0.4"));

        const getChild = await contract.childs(addr3.address);
        await expect(getChild.amountOfMoney).to.be.equal(ethers.utils.parseEther("0.6"));
        
        
        await expect(contract.connect(addr1).withdrawMoneyByParentFromChild(addr3.address,ethers.utils.parseEther("0.9"))).to.be.rejectedWith("This child have not that much ether");

    })

    it("Parent should withdraw all ether from child's adres", async function(){

        const {contract, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);
        //şuanki zamanı kullanıyor
        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("2")});

        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address);

        
        await contract.connect(addr1).sendMoneyToChild(addr2.address,ethers.utils.parseEther("1"));
          
        await expect(contract.connect(addr1).withdrawAllMoneyByParentFromChild(addr2.address)).to.be.rejectedWith("You are not allowed withdraw this money. Money is allowed to usage of child now.");

        const child2 = await contract.connect(addr1).addChild("child iki", (Number(timestampAfter) + 300), addr3.address);

        await contract.connect(addr1).sendMoneyToChild(addr3.address,ethers.utils.parseEther("1"));
        
        await contract.connect(addr1).withdrawAllMoneyByParentFromChild(addr3.address);

        const getParent = await contract.parents(addr1.address);
        await expect(getParent.currentBalance).to.be.equal(ethers.utils.parseEther("1"));

        const getChild = await contract.childs(addr3.address);
        await expect(getChild.amountOfMoney).to.be.equal(ethers.utils.parseEther("0"));
        
        
        await expect(contract.connect(addr1).withdrawAllMoneyByParentFromChild(addr3.address)).to.be.rejectedWith("This child have not any ether");

    })
    

    it("Child withdraw amount of money", async function(){

        const {contract, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);
        //şuanki zamanı kullanıyor
        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("2")});

        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address);

        await contract.connect(addr1).sendMoneyToChild(addr2.address,ethers.utils.parseEther("1"));

        await contract.connect(addr2).withdrawMoneyByChild(ethers.utils.parseEther("0.4"));
        
        const getChild = await contract.childs(addr2.address);
        await expect(getChild.amountOfMoney).to.be.equal(ethers.utils.parseEther("0.6"));

        await expect(getChild.totalWithdrawnMoney).to.be.equal(ethers.utils.parseEther("0.4"));


        const child2 = await contract.connect(addr1).addChild("child one", (Number(timestampAfter)+300), addr3.address);

        await contract.connect(addr1).sendMoneyToChild(addr3.address,ethers.utils.parseEther("1"));

        await expect(contract.connect(addr3).withdrawMoneyByChild(ethers.utils.parseEther("1"))).to.be.rejectedWith("You are not allowed withdraw money yet");

        await expect(contract.connect(addr2).withdrawMoneyByChild(ethers.utils.parseEther("0.8"))).to.be.rejectedWith("You are not have that much ether");
    })

    it("Child withdraw all money", async function(){

        const {contract, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);
        //şuanki zamanı kullanıyor
        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        await contract.connect(addr1).sendMoney({value: ethers.utils.parseEther("2")});

        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address);

        await contract.connect(addr1).sendMoneyToChild(addr2.address,ethers.utils.parseEther("1"));

        await contract.connect(addr2).withdrawAllMoneyByChild();
        
        const getChild = await contract.childs(addr2.address);
        await expect(getChild.amountOfMoney).to.be.equal(ethers.utils.parseEther("0"));

        await expect(getChild.totalWithdrawnMoney).to.be.equal(ethers.utils.parseEther("1"));

        const child2 = await contract.connect(addr1).addChild("child one", (Number(timestampAfter)+300), addr3.address);

        await contract.connect(addr1).sendMoneyToChild(addr3.address,ethers.utils.parseEther("1"));

        await expect(contract.connect(addr3).withdrawAllMoneyByChild()).to.be.rejectedWith("You are not allowed withdraw money yet");

        await expect(contract.connect(addr2).withdrawAllMoneyByChild()).to.be.rejectedWith("You are not have any ether");
    })

    it("Should change release time of child", async function() {
        const {contract, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);

        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address); 
        
        await contract.connect(addr1).changeReleaseTime(addr2.address, (Number(timestampAfter) + 300));

        const getChild = await contract.childs(addr2.address);

        await expect(getChild.releaseTime).to.be.equal((Number(timestampAfter) + 300));

        const parent2 = await contract.connect(addr3).addParent("parent","one");

        await expect(contract.connect(addr3).changeReleaseTime(addr2.address, (Number(timestampAfter) + 300))).to.be.rejectedWith("This child is not your child!");
    })

    it("Should get user role", async function(){

        const {contract, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);
        //şuanki zamanı kullanıyor
        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address);

        const role = await contract.connect(owner).getRole();
        await expect(role).to.be.equal("admin");

        const role2 = await contract.connect(addr1).getRole();
        await expect(role2).to.be.equal("parent");

        const role3 = await contract.connect(addr2).getRole();
        await expect(role3).to.be.equal("child");
        
        const role4 = await contract.connect(addr3).getRole();
        await expect(role4).to.be.equal("none");
       
    })

    it("Modifier check", async function(){

        const {contract, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);
        //şuanki zamanı kullanıyor
        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        const timestampAfter = blockAfter.timestamp;

        const parent = await contract.connect(addr1).addParent("parent","one");
        const child = await contract.connect(addr1).addChild("child one", timestampAfter, addr2.address);

        await expect(contract.connect(addr2).sendMoney({value: ethers.utils.parseEther("2")})).to.be.rejectedWith("Only parent can do this");

        await expect(contract.connect(owner).sendMoney({value: ethers.utils.parseEther("2")})).to.be.rejectedWith("Only parent can do this");

        await expect(contract.connect(addr3).sendMoney({value: ethers.utils.parseEther("2")})).to.be.rejectedWith("Only parent can do this");

        await expect(contract.connect(owner).withdrawMoneyByChild(ethers.utils.parseEther("2"))).to.be.rejectedWith("Only child can do this");

        await expect(contract.connect(addr1).withdrawMoneyByChild(ethers.utils.parseEther("2"))).to.be.rejectedWith("Only child can do this");

        await expect(contract.connect(addr3).withdrawMoneyByChild(ethers.utils.parseEther("2"))).to.be.rejectedWith("Only child can do this");

        await expect(contract.connect(addr3).showBalanceOfContract()).to.be.rejectedWith("Only admin can do this");

        await expect(contract.connect(addr2).showBalanceOfContract()).to.be.rejectedWith("Only admin can do this");

        await expect(contract.connect(addr1).showBalanceOfContract()).to.be.rejectedWith("Only admin can do this");
    
    })

    

})