import { expect } from 'chai';
const { ethers } = require("hardhat");

describe("Infinity Contract", function () {
    let contract: any;
    let parentOne: any;
    let parentTwo: any;
    let childOne: any;
    let childTwo: any;
    let _undefined: any;
    let getParentOne: any;
    let getChildOne: any;
    let timestampAfter: any;
    let owner: any;


    this.beforeEach(async function () {
        const [ownerSigner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
        const ContractFactoryGet = await ethers.getContractFactory("InfinityContract");
        contract = await ContractFactoryGet.deploy();
        await contract.deployed();

        owner = ownerSigner;
        parentOne = addr1;
        parentTwo = addr2;
        childOne = addr3;
        childTwo = addr4;
        _undefined = addr5;

        const blockNumAfter = await ethers.provider.getBlockNumber();
        const blockAfter = await ethers.provider.getBlock(blockNumAfter);
        timestampAfter = blockAfter.timestamp;

        await contract.connect(parentOne).addParent("parent", "one");
        await contract.connect(parentTwo).addParent("parent", "two");

        await contract.connect(parentOne).addChild("child one", timestampAfter, childOne.address);
        await contract.connect(parentOne).addChild("child two", (Number(timestampAfter) + 300), childTwo.address)

        getParentOne = await contract.parents(parentOne.address);
        getChildOne = await contract.connect(parentOne).childs(childOne.address);
    })

    describe("Signup", function () {

        it("Should add parent to the parent list", async function () {
            await expect(getParentOne.walletaddress).to.equal(parentOne.address);
            await expect(getParentOne.name).to.equal("parent");
            await expect(getParentOne.surname).to.equal("one");
        })

        it("Should return 'This parent is already added!'", async function () {
            await expect(contract.connect(parentOne).addParent("parent", "two")).to.be.rejectedWith("This parent is already added!");
        })
    })

    describe("Parent", function () {

        describe("Adding Child", function () {

            it("Should add child", async function () {

                await expect(getChildOne.walletaddress).to.equal(childOne.address);
                await expect(getChildOne.parentAddress).to.equal(parentOne.address);
                await expect(getChildOne.name).to.equal("child one");
                await expect(getChildOne.releaseTime).to.equal(timestampAfter);
            })

            it("Should return 'This child is already added!'", async function () {
                await expect(contract.connect(parentOne).addChild("child two", timestampAfter, childOne.address)).to.be.rejectedWith("This child is already added!");
            })
        })

        describe("Transfers", function () {

            this.beforeEach(async function () {
                await contract.connect(parentOne).sendMoney({ value: ethers.utils.parseEther("1") })
                getParentOne = await contract.parents(parentOne.address);
            })

            it("Should send money to the contract", async function () {
                const balanceOfContract = await contract.showBalanceOfContract();
                await expect(balanceOfContract).to.equal(ethers.utils.parseEther("1"));
                await expect(getParentOne.currentBalance).to.equal(ethers.utils.parseEther("1"));

            })

            it("Should send ether to the child", async function () {

                const send = await contract.connect(parentOne).sendMoneyToChild(childOne.address, ethers.utils.parseEther("0.1"));

                getChildOne = await contract.childs(childOne.address);

                await expect(getChildOne.amountOfMoney).to.equal(ethers.utils.parseEther("0.1"));

                getParentOne = await contract.parents(parentOne.address);

                await expect(getParentOne.currentBalance).to.equal(ethers.utils.parseEther("0.9"));

            })

            describe("Withdrawals", function () {

                it("Should withdraw amount money", async function () {

                    await contract.connect(parentOne).withdrawMoneyByParent(ethers.utils.parseEther("0.4"));
                    getParentOne = await contract.parents(parentOne.address);

                    await expect(getParentOne.currentBalance).to.be.equal(ethers.utils.parseEther("0.6"));
                })

                it("Should return 'You are not that much ether'", async function () {

                    await contract.connect(parentOne).withdrawMoneyByParent(ethers.utils.parseEther("0.4"));

                    await expect(contract.connect(parentOne).withdrawMoneyByParent(ethers.utils.parseEther("1.2"))).to.be.rejectedWith("You are not that much ether");
                })

                it("Should return 'You have not that much ether'", async function () {

                    await contract.connect(parentOne).sendMoneyToChild(childOne.address, ethers.utils.parseEther("0.1"));

                    await expect(contract.connect(parentOne).sendMoneyToChild(childOne.address, ethers.utils.parseEther("2"))).to.be.rejectedWith("You have not that much ether");
                })

                it("Should withdraw all money", async function () {

                    await contract.connect(parentOne).withdrawAllMoneyByParent();

                    getParentOne = await contract.parents(parentOne.address);

                    await expect(getParentOne.currentBalance).to.be.equal(ethers.utils.parseEther("0"));
                })

                it("Should return 'You are not have any ether'", async function () {

                    await contract.connect(parentOne).withdrawAllMoneyByParent();

                    await expect(contract.connect(parentOne).withdrawAllMoneyByParent()).to.be.rejectedWith("You are not have any ehter");
                })

                it("Should withdraw money from child", async function () {

                    await contract.connect(parentOne).sendMoneyToChild(childTwo.address, ethers.utils.parseEther("1"));
                    await contract.connect(parentOne).withdrawMoneyByParentFromChild(childTwo.address, ethers.utils.parseEther("0.4"));

                    getParentOne = await contract.parents(parentOne.address);

                    await expect(getParentOne.currentBalance).to.be.equal(ethers.utils.parseEther("0.4"));

                    const getChildTwo = await contract.childs(childTwo.address);

                    await expect(getChildTwo.amountOfMoney).to.be.equal(ethers.utils.parseEther("0.6"));
                })

                it("Should return 'You are not allowed withdraw this money'", async function () {

                    await contract.connect(parentOne).sendMoneyToChild(childOne.address, ethers.utils.parseEther("1"));

                    await expect(contract.connect(parentOne).withdrawMoneyByParentFromChild(childOne.address, ethers.utils.parseEther("1"))).to.be.rejectedWith("You are not allowed withdraw this money. Money is allowed to usage of child now.");
                })

                it("Should return 'This child have not that much ether'", async function () {

                    await contract.connect(parentOne).sendMoneyToChild(childTwo.address, ethers.utils.parseEther("1"));
                    await contract.connect(parentOne).withdrawMoneyByParentFromChild(childTwo.address, ethers.utils.parseEther("0.4"));

                    await expect(contract.connect(parentOne).withdrawMoneyByParentFromChild(childTwo.address, ethers.utils.parseEther("0.9"))).to.be.rejectedWith("This child have not that much ether");
                })

                it("Should withdraw all money from child", async function () {

                    await contract.connect(parentOne).sendMoneyToChild(childTwo.address, ethers.utils.parseEther("0.8"));

                    await contract.connect(parentOne).withdrawAllMoneyByParentFromChild(childTwo.address);

                    getParentOne = await contract.parents(parentOne.address);
                    await expect(getParentOne.currentBalance).to.be.equal(ethers.utils.parseEther("1"));

                    getChildOne = await contract.childs(childTwo.address);
                    await expect(getChildOne.amountOfMoney).to.be.equal(ethers.utils.parseEther("0"));
                })

                it("Should return 'You are not allowed withdraw this money'", async function () {

                    await contract.connect(parentOne).sendMoneyToChild(childOne.address, ethers.utils.parseEther("1"));

                    await expect(contract.connect(parentOne).withdrawAllMoneyByParentFromChild(childOne.address)).to.be.rejectedWith("You are not allowed withdraw this money. Money is allowed to usage of child now.");
                })

                it("Should return 'This child have not any ether'", async function () {

                    await contract.connect(parentOne).sendMoneyToChild(childTwo.address, ethers.utils.parseEther("1"));
                    await contract.connect(parentOne).withdrawAllMoneyByParentFromChild(childTwo.address);

                    await expect(contract.connect(parentOne).withdrawAllMoneyByParentFromChild(childTwo.address)).to.be.rejectedWith("This child have not any ether");
                })
            })
        })

        describe("Changing Child Properties", function () {

            it("Should change release time of child", async function () {

                await contract.connect(parentOne).changeReleaseTime(childOne.address, (Number(timestampAfter) + 300));

                getChildOne = await contract.childs(childOne.address);

                await expect(getChildOne.releaseTime).to.be.equal((Number(timestampAfter) + 300));
            })

            it("Should return 'This child is not your child'", async function () {
                await expect(contract.connect(parentTwo).changeReleaseTime(childOne.address, (Number(timestampAfter) + 300))).to.be.rejectedWith("This child is not your child!");
            })
        })
    })


    describe("Child", function () {

        this.beforeEach(async function () {
            await contract.connect(parentOne).sendMoney({ value: ethers.utils.parseEther("2") })
            getParentOne = await contract.parents(parentOne.address);

            await contract.connect(parentOne).sendMoneyToChild(childOne.address, ethers.utils.parseEther("1"));
            await contract.connect(parentOne).sendMoneyToChild(childTwo.address, ethers.utils.parseEther("1"));
        })

        describe("Withdrawals", function () {

            it("Should withdraw amount of money", async function () {

                await contract.connect(childOne).withdrawMoneyByChild(ethers.utils.parseEther("0.4"));

                getChildOne = await contract.childs(childOne.address);
                await expect(getChildOne.amountOfMoney).to.be.equal(ethers.utils.parseEther("0.6"));

                await expect(getChildOne.totalWithdrawnMoney).to.be.equal(ethers.utils.parseEther("0.4"));
            })

            it("Should return 'You are not allowed withdraw money yet'", async function () {
                await expect(contract.connect(childTwo).withdrawMoneyByChild(ethers.utils.parseEther("1"))).to.be.rejectedWith("You are not allowed withdraw money yet");
            })

            it("Should return 'You are not have that much ether'", async function () {
                await expect(contract.connect(childOne).withdrawMoneyByChild(ethers.utils.parseEther("1.8"))).to.be.rejectedWith("You are not have that much ether");
            })

            it("Should withdraw all money", async function () {

                await contract.connect(childOne).withdrawAllMoneyByChild();

                getChildOne = await contract.childs(childOne.address);
                await expect(getChildOne.amountOfMoney).to.be.equal(ethers.utils.parseEther("0"));

                await expect(getChildOne.totalWithdrawnMoney).to.be.equal(ethers.utils.parseEther("1"));
            })

            it("Should return 'You are not allowed withdraw money yet'", async function () {
                await expect(contract.connect(childTwo).withdrawAllMoneyByChild()).to.be.rejectedWith("You are not allowed withdraw money yet");
            })

            it("Should return 'You are not have any ether'", async function () {
                await contract.connect(childOne).withdrawAllMoneyByChild();
                await expect(contract.connect(childOne).withdrawAllMoneyByChild()).to.be.rejectedWith("You are not have any ether");
            })
        })
    })

    describe("Admin", function () {

        it("Should get user role", async function () {

            const role = await contract.connect(owner).getRole();
            await expect(role).to.be.equal("admin");

            const role2 = await contract.connect(parentOne).getRole();
            await expect(role2).to.be.equal("parent");

            const role3 = await contract.connect(childOne).getRole();
            await expect(role3).to.be.equal("child");

            const role4 = await contract.connect(_undefined).getRole();
            await expect(role4).to.be.equal("none");
        })

        it("Should return 'Only parent can do this'", async function () {
            await expect(contract.connect(childOne).sendMoney({ value: ethers.utils.parseEther("2") })).to.be.rejectedWith("Only parent can do this");
            await expect(contract.connect(owner).sendMoney({ value: ethers.utils.parseEther("2") })).to.be.rejectedWith("Only parent can do this");
            await expect(contract.connect(_undefined).sendMoney({ value: ethers.utils.parseEther("2") })).to.be.rejectedWith("Only parent can do this");
        })

        it("Should return 'Only child can do this'", async function () {
            await expect(contract.connect(owner).withdrawMoneyByChild(ethers.utils.parseEther("2"))).to.be.rejectedWith("Only child can do this");
            await expect(contract.connect(parentOne).withdrawMoneyByChild(ethers.utils.parseEther("2"))).to.be.rejectedWith("Only child can do this");
            await expect(contract.connect(_undefined).withdrawMoneyByChild(ethers.utils.parseEther("2"))).to.be.rejectedWith("Only child can do this");
        })

        it("Should return 'Only admin can do this'", async function () {
            await expect(contract.connect(parentOne).showBalanceOfContract()).to.be.rejectedWith("Only admin can do this");
            await expect(contract.connect(childOne).showBalanceOfContract()).to.be.rejectedWith("Only admin can do this");
            await expect(contract.connect(_undefined).showBalanceOfContract()).to.be.rejectedWith("Only admin can do this");
        })
    })
})

