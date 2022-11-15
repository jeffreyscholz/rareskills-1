// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./math/Power.sol";
import "./TokenWithGodMode.sol";

/*
* Warning: Unused local variable.
   --> contracts/TokenSaleWithBondingCurve.sol:111:21:
    |
111 |         (bool sent, bytes memory data) = (msg.sender).call{value: ethToSend}(
    |                     ^^^^^^^^^^^^^^^^^

* removed this variable to save memory

Warning: Unused local variable.
   --> contracts/TokenSaleWithBondingCurve.sol:124:21:
    |
124 |         (bool sent, bytes memory data) = (msg.sender).call{
    |  

* removed this variable to save memory

Warning: Function state mutability can be restricted to view
  --> contracts/TokenSaleWithBondingCurve.sol:32:5:
   |
32 |     function computePurchaseReturns(uint256 _deposit) public returns (uint256) {
   |     ^ (Relevant source part starts here and spans across multiple lines).

* changed to view

Warning: Function state mutability can be restricted to view
  --> contracts/TokenSaleWithBondingCurve.sol:60:5:
   |
60 |     function computeSaleReturns(uint256 _sellAmount) public returns (uint256) {
   |     ^ (Relevant source part starts here and spans across multiple lines).

* changed to view

*/

contract TokenSaleWithBondingCurve is TokenWithGodMode, Power {
    using SafeMath for uint256;
    using SafeMath for uint32;

    uint256 private _sellBackFees;
    uint256 private _reserveBalance = 1;
    uint32 private immutable _reserveRatio = 500_000; //linear curve, RR = 1/2 in ppm;
    uint32 private immutable MAX_RESERVE_RATIO = 1_000_000;

    constructor(
        string memory name,
        string memory symbol
    ) TokenWithGodMode(name, symbol) {
        _mint(address(this), 1);
    }

    /*
     * formula:
     * purchaseReturn = totalSupply*((1 + deposit/reserveBalance)^(reserveRatio/MAX_RESERVE_RATIO) - 1)
     */

    function computePurchaseReturns(
        uint256 _deposit
    ) public view returns (uint256) {
        uint256 result;
        uint8 precision;

        //Used in power function: (baseN/ baseD)^(expN/expD)
        //represents numerator of base
        uint256 baseN = _deposit.add(_reserveBalance);

        (result, precision) = power(
            baseN,
            _reserveBalance,
            _reserveRatio,
            MAX_RESERVE_RATIO
        );

        uint256 tokenSupply = totalSupply();
        uint256 newTokenSupply = tokenSupply.mul(result) >> precision;
        return newTokenSupply - tokenSupply;
    }

    /*
     * saleReturn = reserveBalance*(1 - (1 - _sellAmount/totalSupply) ^ (1/(reserveRatio/MAX_RESERVE_RATIO))
     */

    function computeSaleReturns(
        uint256 _sellAmount
    ) public view returns (uint256) {
        if (_sellAmount == 0) {
            return 0;
        }

        uint256 _supply = totalSupply();

        uint256 result;
        uint8 precision;

        uint256 baseD = _supply - _sellAmount;

        (result, precision) = power(
            _supply,
            baseD,
            MAX_RESERVE_RATIO,
            _reserveRatio
        );

        uint256 oldBalance = _reserveBalance.mul(result);
        uint256 newBalance = _reserveBalance << precision;

        return oldBalance.sub(newBalance).div(result);
    }

    function buyTokens() public payable returns (uint256) {
        uint256 weiAmount = msg.value;

        require(weiAmount > 0, "Send ETH to buy some tokens");

        uint256 tokensToSend = computePurchaseReturns(weiAmount);

        _reserveBalance = _reserveBalance.add(weiAmount);

        _mint(msg.sender, tokensToSend);
        return tokensToSend;
    }

    /*
    Slither analysis:

    Reentrancy in TokenSaleWithBondingCurve.sellTokens(uint256) (contracts/TokenSaleWithBondingCurve.sol#102-121):
    
    * Already marked as nonReentrant
    */

    function sellTokens(uint256 amount) public returns (uint256) {
        uint256 balance = balanceOf(msg.sender);
        require(balance >= amount, "Insufficient balance");

        uint256 ethToSend = computeSaleReturns(amount);
        uint256 fees = ethToSend.div(10);

        ethToSend = ethToSend.sub(fees);

        _burn(msg.sender, amount);
        _sellBackFees = _sellBackFees.add(fees);
        _reserveBalance = _reserveBalance.sub(ethToSend);

        (bool sent, ) = (msg.sender).call{value: ethToSend}("");
        require(sent, "Failed to send ether");

        return ethToSend;
    }

    /*
    Slither analysis:

    Reentrancy in TokenSaleWithBondingCurve.withdrawSellBackFees() (contracts/TokenSaleWithBondingCurve.sol#123-129):

    only admin can call this
    */

    function withdrawSellBackFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool sent, ) = (msg.sender).call{value: _sellBackFees}("");

        _sellBackFees = 0;

        require(sent, "Failed to send ether");
    }
}
