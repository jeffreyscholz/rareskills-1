//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.13;

import "./GenBukowski.sol";

//0xf14ea510D5C6718A11502FDF7eE74605538AE47b

contract Forge {
    IGenBukowski private immutable nft;
    mapping(address => uint256) private mintCoolDown;

    constructor(address nftAddr) {
        nft = IGenBukowski(nftAddr);
    } 
    
    function _mint(address to, uint256 id) internal {
        mintCoolDown[to] = block.timestamp + 60;
        nft.mint(to, id, 1);
    }

    function _burn(address from, uint256 id, uint256 amount) internal {
        nft.burn(from, id, amount);
    }

    function _trade(address user, uint256 fromId, uint256 toId, uint256 amount) internal {
        nft.burn(user, fromId, amount);
        nft.mint(user, toId, amount);
    }

    function mint(uint256 id) external {
        require(id <= 2, "id not in range [0-2]");
        if(mintCoolDown[msg.sender] != 0) {
            require(block.timestamp > mintCoolDown[msg.sender], "mint limit exceeded");
        }
        
        _mint(msg.sender, id);
    }

    function forge(bool[] memory ids) external {
        require(ids.length == 3, "Invalid ids length");
 
        if(ids[0] && ids[1] && ids[2]) {
            nft.burnBatch(msg.sender, unwrapArray([0,1,2]), unwrapArray([1,1,1]));
            nft.mint(msg.sender, 6, 1);
        } else if(ids[0] && ids[1]) {
            nft.burnBatch(msg.sender, unwrapArray([0,1]), unwrapArray([1,1]));
            nft.mint(msg.sender, 3, 1);
        } else if(ids[1] && ids[2]) {
            nft.burnBatch(msg.sender, unwrapArray([1,2]), unwrapArray([1,1]));
            nft.mint(msg.sender, 4, 1);
        } else if(ids[0] && ids[2]) {
            nft.burnBatch(msg.sender, unwrapArray([0,2]), unwrapArray([1,1]));
            nft.mint(msg.sender, 5, 1);
        }
    }   

    function burn(uint256 id, uint256 amount) external {
        _burn(msg.sender, id, amount);
    }

    function trade(uint256 fromId, uint256 toId, uint256 amount) external {
        require(toId <=2, "invalid tokenId");
        require(fromId != toId, "tokenIds cannot be same");
        _trade(msg.sender, fromId, toId, amount);
    }

    function getMintCooldownTime(address user) external view returns (uint256) {
        return mintCoolDown[user];
    }

    function unwrapArray(uint8[3] memory foo) internal pure returns (uint256[] memory) {
        uint256[] memory bar = new uint256[](3);
        for(uint i = 0; i < 3; i++) {
            bar[i] = uint256(foo[i]);
        }
        return bar;
    }

    function unwrapArray(uint8[2] memory foo) internal pure returns (uint256[] memory) {
        uint256[] memory bar = new uint256[](2);
        for(uint i = 0; i < 2; i++) {
            bar[i] = uint256(foo[i]);
        }
        return bar;
    }
}