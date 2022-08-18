// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract InfinityContract {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct Child {
        address payable walletaddress;
        address parentAddress;
        string name;
        uint releaseTime;
        uint amountOfMoney;
        uint totalWithdrawnMoney;
    }

    struct Parent {
        address payable walletaddress;
        string name;
        string surname;
        uint currentBalance;
        uint childIndex;
        address[] childs;
    }

    mapping(address => Parent)  public parents;
    mapping(address => Child)  public childs; 

    event TransferToContract(address from, address to, uint amount);

    function sendMoney() public onlyParent payable{
        parents[msg.sender].currentBalance += msg.value;
        emit TransferToContract(msg.sender, address(this), msg.value);
    }

    function sendMoneyToChild(address _childAddress, uint _amount) public onlyParent{
        require(parents[msg.sender].currentBalance >= _amount, "You have not that much ether");

        parents[msg.sender].currentBalance -= _amount;
        childs[_childAddress].amountOfMoney += _amount;
    }

    function showMyBalance() public onlyParent view returns(uint) {
        return parents[msg.sender].currentBalance;
    }

    function showBalanceOfContract() public onlyAdmin view returns(uint){
        return address(this).balance;
    }

    function addParent(string memory _name, string memory _surname) public{
        address payable sender = payable(msg.sender);

        Parent storage parent = parents[sender];

        require(parent.walletaddress != sender, "This parent is already added!") ;

        parent.name = _name;
        parent.surname = _surname;
        parent.walletaddress = sender;
    }

    function addChild(string memory _childname, uint _releaseTime, address payable _childAddress) public onlyParent{
        Child storage child = childs[_childAddress];

        require(child.walletaddress != _childAddress, "This child is already added!");
        Child memory childNew = Child(_childAddress, msg.sender, _childname, _releaseTime, 0, 0);

        parents[msg.sender].childs.push(childNew.walletaddress);
        parents[msg.sender].childIndex++;

        childs[_childAddress] = childNew; 

    }

    function getChilds() public view onlyParent returns(Child[] memory) {
        Child[] memory childsOfParent = new Child[](parents[msg.sender].childIndex);

        for(uint i = 0; i < parents[msg.sender].childIndex; i++) {
            childsOfParent[i] = (childs[parents[msg.sender].childs[i]]);
        }
        return childsOfParent;
    }

    function changeReleaseTime(address _childAddress, uint _newReleaseTime) public onlyParent{
        require(childs[_childAddress].parentAddress == msg.sender, "This child is not your child!");
        childs[_childAddress].releaseTime = _newReleaseTime;
    }

    function withdrawMoneyByParent(uint _amount) public onlyParent{
        require(parents[msg.sender].currentBalance >= _amount, "You are not that much ether");

        parents[msg.sender].currentBalance -= _amount;

        payable(msg.sender).transfer(_amount);

    }

    function withdrawAllMoneyByParent() public onlyParent{
        require(parents[msg.sender].currentBalance != 0, "You are not have any ehter");

        uint amountOfAccessableMoney = parents[msg.sender].currentBalance;

        parents[msg.sender].currentBalance = 0;

        payable(msg.sender).transfer(amountOfAccessableMoney);

    }

    function withdrawMoneyByParentFromChild(address _childAddress, uint _amount) public onlyParent{

        require(childs[_childAddress].releaseTime > block.timestamp, "You are not allowed withdraw this money. Money is allowed to usage of child now.");

        require(childs[_childAddress].amountOfMoney >= _amount, "This child have not that much ether");

        parents[msg.sender].currentBalance += _amount;

        childs[_childAddress].amountOfMoney -= _amount;
    }

    function withdrawAllMoneyByParentFromChild(address _childAddress) public onlyParent{

        require(childs[_childAddress].releaseTime > block.timestamp, "You are not allowed withdraw this money. Money is allowed to usage of child now.");

        require(childs[_childAddress].amountOfMoney != 0, "This child have not any ether");

        uint amountOfMoney = childs[_childAddress].amountOfMoney;

        childs[_childAddress].amountOfMoney = 0;

        parents[msg.sender].currentBalance += amountOfMoney;

    }

    function withdrawMoneyByChild(uint _amount) public onlyChild{
        address walletaddress = msg.sender;

        require(childs[walletaddress].releaseTime <= block.timestamp, "You are not allowed withdraw money yet");
        require(childs[walletaddress].amountOfMoney >= _amount, "You are not have that much ether");

        childs[walletaddress].amountOfMoney -= _amount;

        childs[walletaddress].totalWithdrawnMoney += _amount;

        payable(msg.sender).transfer(_amount);
    }

    function withdrawAllMoneyByChild() public onlyChild{
        address walletaddress = msg.sender;

        uint amountOfMoneyChildHave = childs[walletaddress].amountOfMoney;

        require(childs[walletaddress].releaseTime <= block.timestamp, "You are not allowed withdraw money yet");
        require(amountOfMoneyChildHave != 0, "You are not have any ether");

        childs[walletaddress].amountOfMoney = 0;
        childs[walletaddress].totalWithdrawnMoney += amountOfMoneyChildHave;
        payable(msg.sender).transfer(amountOfMoneyChildHave);
    }

    function getRole() public view returns(string memory) {
        address sender = msg.sender;

        Parent storage parent = parents[sender];
        Child storage child = childs[sender];

        if(owner == sender) {
            return "admin";
        }
        else if(parent.walletaddress == sender) {
            return "parent";
        } else if(child.walletaddress == sender) {
            return "child";
        } else {
            return "none";
        }

    }

    modifier onlyAdmin() {
        require(owner == msg.sender, "Only admin can do this");
        _;
    }

    modifier onlyParent() {
        address sender = msg.sender;
        Parent storage parent = parents[sender];
        require(parent.walletaddress == sender, "Only parent can do this");
        _;
    }

    modifier onlyChild() {
        address sender = msg.sender;
        Child storage child = childs[sender];
        require(child.walletaddress == sender, "Only child can do this");
        _;
    }
}