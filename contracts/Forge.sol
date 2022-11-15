//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.13;

import './GenBukowski.sol';

contract Forge {
    IGenBukowski private constant nft;
    mapping(uint256 => uint256) mintCoolDown;

    constructor(address nftAddr) {
        nft = IGenBukowski(nftAddr);
    } 
    
    function _mint(address to, uint256 id) internal {
        nft.mint(to, id, 1);
        mintCoolDown[to] = block.timestamp;
    }

    function _burn(address from, uint256 id, uint256 amount) internal {
        nft.burn(from, id, amount);
    }

    function _trade(address user, uint256 fromId, uint256 toId, uint256 amount) internal {
        nft.burn(user, fromId, amount);
        nft.mint(user, toId, amount);
    }

    function mint(uint256 id) external {
        require(id >= 0 && id <= 2, "id not in range [0-2]");
        if(mintCoolDown[msg.sender] != 0) {
            require(block.timestamp > mintCoolDown, "mint limit exceeded");
        }
        
        _mint(msg.sender, id);
    }

    function forge(bool[] memory ids) external {
        require(ids.length == 3, "Invalid ids length");
        if(ids[0] && ids[1] && ids[2]) {
            nft.burnBatch(msg.sender, [0,1,2], [1,1,1]);
            nft.mint(msg.sender, 6, 1);
        } else if(ids[0] && ids[1]) {
            nft.burnBatch(msg.sender, [0,1], [1,1]);
            nft.mint(msg.sender, 3, 1);
        } else if(ids[1] && ids[2]) {
            nft.burnBatch(msg.sender, [1,2], [1,1]);
            nft.mint(msg.sender, 4, 1);
        } else if(ids[2] && ids[3]) {
            nft.burnBatch(msg.sender, [2,3], [1,1]);
            nft.mint(msg.sender, 5, 1);
        }
    }   

    function burn(uint256 id, uint256 amount) external {
        _burn(msg.sender, id, amount);
    }

    function trade(uint256 fromId, uint256 toId, uint256 amount) {
        require(toId >= 0 && toId <=2, "tokens can only be traded for [0-2]");
        _trade(msg.sender, fromId, toId, amount);
    }

    function getMintCooldownTime(address user) external view returns (uint256) {
        return mintCoolDown(user);
    }
}